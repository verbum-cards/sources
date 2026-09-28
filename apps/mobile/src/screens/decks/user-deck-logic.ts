import type { ItemType } from '@cards/contracts';

import {
  loadPackWordsByRefs,
  type PackWord,
  type PackWordRef,
} from '../../db/entities/dictionary/lookup';
import { getOrCreateLocalUserId } from '../../db/entities/user/app-meta';
import type { DbExecutor } from '../../db/executor';
import { notifyChange } from '../../utilities/event-bus';
import { uuidv7 } from '../../utilities/id';

// Свои колоды (тип 'user', миграция 005) — собираются на устройстве из слов,
// уже существующих в пакете словаря, не из произвольного текста (см. ADR).
// Полностью локально: без sync_op, без синхронизации между устройствами —
// это сознательно расширяет объём беты за пределы docs/sync-protocol.md
// («колоды user/shared — v1»), но только для этой части, не для протокола.

export interface UserDeck {
  id: string;
  title: string;
  itemCount: number;
}

export async function loadUserDecks(db: DbExecutor): Promise<readonly UserDeck[]> {
  const userId = await getOrCreateLocalUserId(db);
  const rows = await db.all<{ id: string; title: string; item_count: number }>(
    `SELECT d.id, d.title, COUNT(di.item_id) as item_count
     FROM deck d
     LEFT JOIN deck_item di ON di.deck_id = d.id
     WHERE d.user_id = ? AND d.deleted_at IS NULL
     GROUP BY d.id
     ORDER BY d.created_at DESC`,
    [userId]
  );

  return rows.map((row) => ({ id: row.id, title: row.title, itemCount: row.item_count }));
}

export async function createUserDeck(
  db: DbExecutor,
  title: string,
  now: Date = new Date()
): Promise<string> {
  const userId = await getOrCreateLocalUserId(db);
  const nowIso = now.toISOString();
  const deckId = uuidv7(now);

  await db.run(
    `INSERT INTO deck (id, user_id, title, lang, native_lang, type, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [deckId, userId, title.trim(), 'en', 'ru', 'user', nowIso, nowIso]
  );
  notifyChange(['deck']);

  return deckId;
}

async function loadUserDeckItemRefs(
  db: DbExecutor,
  deckId: string
): Promise<readonly PackWordRef[]> {
  const rows = await db.all<{ item_type: ItemType; item_id: string }>(
    `SELECT item_type, item_id FROM deck_item WHERE deck_id = ? ORDER BY position`,
    [deckId]
  );

  return rows.map((row) => ({ itemType: row.item_type, itemId: row.item_id }));
}

// Слова своей колоды в порядке добавления, с полными данными из пакета —
// deck_item хранит только ссылки (cards-user.db и пакет — разные файлы,
// JOIN между ними невозможен, docs/data-model.md).
export async function loadUserDeckWords(
  db: DbExecutor,
  dictionaryDb: DbExecutor,
  deckId: string
): Promise<readonly PackWord[]> {
  const refs = await loadUserDeckItemRefs(db, deckId);

  return loadPackWordsByRefs(dictionaryDb, refs);
}

// Добавляет слово из пакета в свою колоду: ссылка (deck_item) + сразу личная
// карточка (card + card_content), тем же способом, что и официальные колоды
// (decks-logic.ts::addDeckWordCard) — источник данных теперь пакет словаря,
// а не mocks/decks.ts. Возвращает false, если слово уже в этой колоде — нет-оп.
export async function addWordToUserDeck(
  db: DbExecutor,
  deckId: string,
  word: PackWord,
  now: Date = new Date()
): Promise<boolean> {
  const userId = await getOrCreateLocalUserId(db);
  const alreadyInDeck = await db.get<{ deck_id: string }>(
    `SELECT deck_id FROM deck_item WHERE deck_id = ? AND item_type = ? AND item_id = ?`,
    [deckId, word.itemType, word.itemId]
  );
  if (alreadyInDeck) return false;

  const nowIso = now.toISOString();
  const positionRow = await db.get<{ next: number }>(
    `SELECT COUNT(*) as next FROM deck_item WHERE deck_id = ?`,
    [deckId]
  );

  await db.run(
    `INSERT INTO deck_item (deck_id, item_type, item_id, position, added_at) VALUES (?, ?, ?, ?, ?)`,
    [deckId, word.itemType, word.itemId, positionRow?.next ?? 0, nowIso]
  );
  await db.run(`UPDATE deck SET updated_at = ? WHERE id = ?`, [nowIso, deckId]);

  // Тот же критерий дубликата, что и в decks-logic.ts::isItemAlreadyAdded —
  // слово может уже быть личной карточкой пользователя (из другой колоды или
  // добавлено вручную); тогда просто не заводим вторую карточку на то же значение.
  const existingCard = await db.get<{ id: string }>(
    `SELECT id FROM card
     WHERE user_id = ? AND item_type = ? AND item_id = ?
       AND status IN ('active', 'known') AND deleted_at IS NULL`,
    [userId, word.itemType, word.itemId]
  );
  if (!existingCard) {
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
    notifyChange(['card', 'card_content']);
  }

  notifyChange(['deck_item']);

  return true;
}
