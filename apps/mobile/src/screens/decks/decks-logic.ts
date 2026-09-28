import type { ItemType } from '@cards/contracts';

import { getOrCreateLocalUserId } from '../../db/entities/user/app-meta';
import { loadUserDeckIds, saveUserDeck } from '../../db/entities/user/user-deck';
import type { DbExecutor } from '../../db/executor';
import type { DeckWord, MockDeck } from '../../mocks/decks';
import { notifyChange } from '../../utilities/event-bus';
import { uuidv7 } from '../../utilities/id';

export async function loadAddedDeckIds(db: DbExecutor): Promise<Set<string>> {
  const userId = await getOrCreateLocalUserId(db);

  return loadUserDeckIds(db, userId);
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
