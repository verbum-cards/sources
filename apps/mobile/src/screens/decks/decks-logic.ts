import type { Goal, ItemType } from '@cards/contracts';
import { GoalSchema } from '@cards/contracts';

import { getOrCreateLocalUserId } from '../../db/entities/user/app-meta';
import { loadUserDeckIds, saveUserDeck } from '../../db/entities/user/user-deck';
import type { DbExecutor } from '../../db/executor';
import type { DeckWord, MockDeck } from '../../mocks/decks';
import { notifyChange } from '../../utilities/event-bus';
import { uuidv7 } from '../../utilities/id';
import { addToMyVocabulary } from './user-deck-logic';

export async function loadAddedDeckIds(db: DbExecutor): Promise<Set<string>> {
  const userId = await getOrCreateLocalUserId(db);

  return loadUserDeckIds(db, userId);
}

export interface DeckGoalGroup {
  goal: Goal;
  decks: readonly MockDeck[];
}

// Тот же порядок, что и на шаге «Цель» онбординга (goal.screen.tsx) — прямо
// из контракта (GoalSchema.options), а не отдельным списком: расходиться
// с ним нечему.
const GOAL_ORDER: readonly Goal[] = GoalSchema.options;
const KNOWN_GOALS: readonly string[] = GOAL_ORDER;

function isGoal(tag: string): tag is Goal {
  return KNOWN_GOALS.includes(tag);
}

// Каталог колод группируется по целям из онбординга — той же таксономии, без
// отдельной под колоды. Колода может входить в несколько групп сразу —
// goalTags это массив (навигация по каталогу стала важна с ростом числа
// колод). Неизвестные (не из Goal) теги пропускаются — goalTags в контракте
// это string[], а не закрытый Goal[].
export function groupDecksByGoal(decks: readonly MockDeck[]): readonly DeckGoalGroup[] {
  const groups = new Map<Goal, MockDeck[]>();
  for (const deck of decks) {
    for (const tag of deck.goalTags) {
      if (!isGoal(tag)) continue;
      const bucket = groups.get(tag);
      if (bucket) {
        bucket.push(deck);
      } else {
        groups.set(tag, [deck]);
      }
    }
  }

  return GOAL_ORDER.filter((goal) => groups.has(goal)).map((goal) => ({
    goal,
    decks: groups.get(goal) ?? [],
  }));
}

// itemId один на всю моковую библиотеку не гарантированно уникален между
// itemType (в контракте это составной ключ) — ключ для Set/Map всегда
// item_type+item_id вместе, одной функцией, чтобы не разойтись между
// loadAddedDeckItemIds и проверкой в экране.
function deckItemKey(itemType: ItemType, itemId: string): string {
  return `${itemType}:${itemId}`;
}

// Тот же критерий дубликата, что и в word-add-logic.ts::isWordAlreadyAdded —
// живая (не удалённая) карточка со статусом «активна» или «известна» на то же
// значение/выражение словаря.
async function isItemAlreadyAdded(
  db: DbExecutor,
  userId: string,
  itemType: ItemType,
  itemId: string
): Promise<boolean> {
  const row = await db.get<{ id: string }>(
    `SELECT id FROM card
     WHERE user_id = ? AND item_type = ? AND item_id = ?
       AND status IN ('active', 'known') AND deleted_at IS NULL`,
    [userId, itemType, itemId]
  );

  return row != null;
}

// Для иконки добавления у каждого слова колоды (screens/decks/decks.screen.tsx)
// — какие элементы (sense и expression) у пользователя уже есть, тем же
// критерием, что и isItemAlreadyAdded, но одним запросом на всю колоду сразу.
export async function loadAddedDeckItemIds(db: DbExecutor): Promise<Set<string>> {
  const userId = await getOrCreateLocalUserId(db);
  const rows = await db.all<{ item_type: ItemType; item_id: string }>(
    `SELECT item_type, item_id FROM card
     WHERE user_id = ? AND status IN ('active', 'known') AND deleted_at IS NULL`,
    [userId]
  );

  return new Set(rows.map((row) => deckItemKey(row.item_type, row.item_id)));
}

export function isDeckWordAdded(addedItemIds: ReadonlySet<string>, word: DeckWord): boolean {
  return addedItemIds.has(deckItemKey(word.itemType, word.itemId));
}

// card.source_deck_id: колонка существует с T1.4, но до колод писать в неё
// было некому — первое настоящее использование.
async function addDeckWordCard(
  db: DbExecutor,
  userId: string,
  word: DeckWord,
  deckId: string,
  now: Date
): Promise<void> {
  const nowIso = now.toISOString();
  const cardId = uuidv7(now);

  await db.run(
    `INSERT INTO card (id, user_id, item_type, item_id, source_deck_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [cardId, userId, word.itemType, word.itemId, deckId, 'active', nowIso, nowIso]
  );
  await db.run(
    `INSERT INTO card_content (card_id, lemma, pos, ipa, cefr, translation, example, example_translation, definition, source, refreshed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      cardId,
      word.lemma,
      word.pos ?? null,
      word.ipa ?? null,
      word.cefr,
      word.translation,
      word.example,
      word.exampleTranslation,
      word.definition,
      'pack',
      nowIso,
    ]
  );
}

export interface AddDeckResult {
  added: number;
  skipped: number;
}

// Добавляет всю колоду разом (docs/flows/f06.md-подобный паттерн, но пачкой):
// слова, которых у пользователя ещё нет, становятся настоящими card +
// card_content; уже добавленные — пропускаются, но колода всё равно
// отмечается как добавленная в user_deck (апсерт, поэтому повторный вызов
// безопасен).
export async function addDeckToUser(
  db: DbExecutor,
  deck: MockDeck,
  now: Date = new Date()
): Promise<AddDeckResult> {
  const userId = await getOrCreateLocalUserId(db);
  let added = 0;
  let skipped = 0;

  for (const word of deck.items) {
    const exists = await isItemAlreadyAdded(db, userId, word.itemType, word.itemId);
    if (exists) {
      skipped += 1;
      continue;
    }
    await addDeckWordCard(db, userId, word, deck.id, now);
    added += 1;
  }

  if (added > 0) notifyChange(['card', 'card_content']);

  await saveUserDeck(db, {
    userId,
    deckId: deck.id,
    addedAt: now.toISOString(),
    fastMode: false,
    updatedAt: now.toISOString(),
    deletedAt: null,
    fieldRevisions: {},
  });

  return { added, skipped };
}

// Добавление одного слова из колоды по иконке в WordRow — без апсерта
// user_deck: сама колода не считается «добавленной» (это отдельное действие,
// «Добавить колоду»), просто у пользователя появляется ещё одна карточка.
// Заодно попадает и в «Мой словарь» (user-deck-logic.ts::addToMyVocabulary) —
// source_deck_id карточки при этом не меняется, он по-прежнему указывает на
// эту официальную колоду, «Мой словарь» — отдельная ссылка (deck_item), не
// замена источника. Возвращает false, если слово уже было — нет-оп, а не
// ошибка (тот же критерий, что и addDeckToUser).
export async function addSingleDeckWord(
  db: DbExecutor,
  deck: MockDeck,
  word: DeckWord,
  myVocabularyTitle: string,
  now: Date = new Date()
): Promise<boolean> {
  const userId = await getOrCreateLocalUserId(db);
  const exists = await isItemAlreadyAdded(db, userId, word.itemType, word.itemId);
  if (exists) return false;

  await addDeckWordCard(db, userId, word, deck.id, now);
  await addToMyVocabulary(db, word.itemType, word.itemId, myVocabularyTitle, now);
  notifyChange(['card', 'card_content']);

  return true;
}
