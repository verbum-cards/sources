import type { Cefr, DeckCategory, ItemType } from '@cards/contracts';
import { DeckCategorySchema } from '@cards/contracts';

import { getOrCreateLocalUserId } from '../../db/entities/user/app-meta';
import { insertCardContentExamples } from '../../db/entities/user/card-content';
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

// Порядок пунктов каталога (decks.screen.tsx) — прямо из контракта
// (DeckCategorySchema.options), а не отдельным списком: расходиться с ним
// нечему. Список категорий фиксирован и показывается весь, даже если для
// какой-то пока нет ни одной колоды (стабильное меню, не прыгает по мере
// наполнения контента) — пустой список decks экран категории покажет сам.
export const CATEGORY_ORDER: readonly DeckCategory[] = DeckCategorySchema.options;

// Колоды одной категории каталога (ADR-35) — колода может быть в нескольких
// категориях сразу (categories — массив), у каждой категории свой экран
// (decks.screen.tsx), поэтому группировка всех категорий разом (как раньше
// groupDecksByGoal) больше не нужна — только выборка под одну. Сортировка по
// deck.importance (по убыванию, 3 — сначала) — та же логика приоритета, что
// уже была у слов внутри колоды, просто уровнем выше: какую колоду показать
// в начале списка категории. При равном importance — порядок как в DECKS
// (Array.prototype.sort стабильна), не переставляется случайно.
export function getDecksByCategory(
  decks: readonly MockDeck[],
  category: DeckCategory
): readonly MockDeck[] {
  return decks
    .filter((deck) => deck.categories.includes(category))
    .sort((a, b) => b.importance - a.importance);
}

// Порядок для разрешения ничьей в getDeckLevel — при равном числе слов на
// нескольких уровнях побеждает более сложный: значок уровня — это сигнал
// «на что рассчитывать», занизить сложность хуже, чем завысить (новичок,
// открывший колоду сложнее, чем ждал, просто выйдет — а не растеряется
// посреди неё, ожидая лёгкого).
const CEFR_ORDER: readonly Cefr[] = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// Уровень колоды не хранится отдельным полем (DeckSchema его не знает,
// уровень есть только у каждого слова) — самый частый cefr среди её items,
// то же «ядро» уровня, что в skill deck-authoring («ядро A2 (~50%)» и т.п.).
// undefined только для пустой колоды (в реальном DECKS такой не бывает).
export function getDeckLevel(deck: MockDeck): Cefr | undefined {
  const counts = new Map<Cefr, number>();
  for (const item of deck.items) {
    counts.set(item.cefr, (counts.get(item.cefr) ?? 0) + 1);
  }

  let best: Cefr | undefined;
  let bestCount = 0;
  for (const cefr of CEFR_ORDER) {
    const count = counts.get(cefr) ?? 0;
    if (count > 0 && count >= bestCount) {
      best = cefr;
      bestCount = count;
    }
  }

  return best;
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
    `INSERT INTO card_content (card_id, lemma, pos, ipa, cefr, translation, definition, source, refreshed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      cardId,
      word.lemma,
      word.pos ?? null,
      word.ipa ?? null,
      word.cefr,
      word.translation,
      word.definition,
      'pack',
      nowIso,
    ]
  );
  await insertCardContentExamples(db, cardId, word.examples);
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
// замена источника. Возвращает false, если карточка уже была (нет-оп для
// card/card_content, а не ошибка — тот же критерий, что и addDeckToUser), но
// «Мой словарь» всё равно пополняется: слово может уже быть карточкой из
// другой колоды или с главного экрана — тогда именно это действие (нажатие
// «+»/«Сохранить» здесь) и есть единственный шанс связать его с «Мой
// словарь», пропускать его нельзя.
export async function addSingleDeckWord(
  db: DbExecutor,
  deck: MockDeck,
  word: DeckWord,
  myVocabularyTitle: string,
  now: Date = new Date()
): Promise<boolean> {
  const userId = await getOrCreateLocalUserId(db);
  const exists = await isItemAlreadyAdded(db, userId, word.itemType, word.itemId);

  if (!exists) {
    await addDeckWordCard(db, userId, word, deck.id, now);
    notifyChange(['card', 'card_content']);
  }

  await addToMyVocabulary(db, word.itemType, word.itemId, myVocabularyTitle, now);

  return !exists;
}

// Свайп по официальной колоде в «Мои колоды» — «убрать» её оттуда: мягко
// удаляет строку user_deck (deletedAt), карточки и их прогресс не трогает.
// Повторное «Добавить колоду» позже снова апсертит ту же строку (saveUserDeck)
// и убирает deletedAt — та же логика восстановления, что и в контракте
// UserDeckSchema.
export async function removeDeckFromUser(
  db: DbExecutor,
  deckId: string,
  now: Date = new Date()
): Promise<void> {
  const userId = await getOrCreateLocalUserId(db);
  const nowIso = now.toISOString();
  await db.run(
    `UPDATE user_deck SET deleted_at = ?, updated_at = ? WHERE user_id = ? AND deck_id = ?`,
    [nowIso, nowIso, userId, deckId]
  );
  notifyChange(['user_deck']);
}
