import type { ItemType } from '@cards/contracts';

import type { PackWord } from '../../db/entities/dictionary/lookup';
import { getOrCreateLocalUserId } from '../../db/entities/user/app-meta';
import type { DbExecutor } from '../../db/executor';
import { notifyChange } from '../../utilities/event-bus';
import { uuidv7 } from '../../utilities/id';
import { addExistingCardToDeck, getOrCreateMyVocabularyDeck } from '../decks/user-deck-logic';

// Слово, введённое вручную («не нашли в словаре»), не привязано ни к какому
// itemType из пакета — 'sense' здесь просто значит «отдельное значение», как
// и для настоящих слов, не более того.
const MANUAL_WORD_ITEM_TYPE: ItemType = 'sense';

function addedItemKey(itemType: ItemType, itemId: string): string {
  return `${itemType}:${itemId}`;
}

// F6 «Добавление слова за 5 секунд» (docs/flows/f06.md, шаг 5). Тот же паттерн
// «card + card_content», что и в первой сессии онбординга
// (onboarding-logic.ts::answerFirstSessionWord) и в дебаг-экране FSRS: card —
// синхронизируемая сущность, card_content — локальный снимок для отображения.
// card.status здесь всегда 'active' (никакого режима знакомства — это только
// шаг 4 F1, здесь его нет): слово сразу попадает в очередь новых (FR-21).
//
// Каждое слово, добавленное с главного экрана, автоматически попадает в
// колоду «Мой словарь» (card.source_deck_id + deck_item, см.
// user-deck-logic.ts) — она заводится сама при первом слове. myVocabularyTitle
// передаёт вызывающий экран (доступ к i18n есть только у компонентов, не у
// этого файла); значение по умолчанию — только для тестов и других
// вызывающих кодов, которые ещё не думают об этой колоде.
const DEFAULT_MY_VOCABULARY_TITLE = 'Мой словарь';

// Дубликат (docs/flows/f06.md → «Слово уже есть»): у пользователя уже есть
// живая (не удалённая) карточка на это же значение словаря со статусом
// «активна» или «известна» — third статус 'suspended' не считается дублем.
// itemType обязателен: пакет отдаёт и sense, и expression (ADR-25), а
// item_id сам по себе не гарантирует уникальность между типами.
export async function isWordAlreadyAdded(
  db: DbExecutor,
  itemType: ItemType,
  itemId: string
): Promise<boolean> {
  const userId = await getOrCreateLocalUserId(db);
  const row = await db.get<{ id: string }>(
    `SELECT id FROM card
     WHERE user_id = ? AND item_type = ? AND item_id = ?
       AND status IN ('active', 'known') AND deleted_at IS NULL`,
    [userId, itemType, itemId]
  );

  return row != null;
}

// Тот же критерий «дубликата», что и в isWordAlreadyAdded, но сразу для всех
// живых карточек пользователя — чтобы пометить уже добавленные слова прямо в
// списке подсказок (docs/flows/f06.md), не гоняя запрос на каждую подсказку.
// Ключ — itemType+itemId вместе (тот же приём, что и в decks-logic.ts::deckItemKey).
export async function loadAddedItemIds(db: DbExecutor): Promise<Set<string>> {
  const userId = await getOrCreateLocalUserId(db);
  const rows = await db.all<{ item_type: ItemType; item_id: string }>(
    `SELECT item_type, item_id FROM card
     WHERE user_id = ?
       AND status IN ('active', 'known') AND deleted_at IS NULL`,
    [userId]
  );

  return new Set(rows.map((row) => addedItemKey(row.item_type, row.item_id)));
}

export interface AddWordFromDictionaryParams {
  db: DbExecutor;
  word: PackWord;
  myVocabularyTitle?: string;
  now?: Date;
}

// Слово найдено в пакете словаря -> card_content.source = 'pack': контент не
// введён руками, а пришёл «из словаря» (см. CardContentSource в db/entities/user/types.ts).
export async function addWordFromDictionary({
  db,
  word,
  myVocabularyTitle = DEFAULT_MY_VOCABULARY_TITLE,
  now = new Date(),
}: AddWordFromDictionaryParams): Promise<string> {
  const userId = await getOrCreateLocalUserId(db);
  const nowIso = now.toISOString();
  const cardId = uuidv7(now);
  const myVocabularyDeckId = await getOrCreateMyVocabularyDeck(db, myVocabularyTitle, now);

  await db.run(
    'INSERT INTO card (id, user_id, item_type, item_id, source_deck_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [cardId, userId, word.itemType, word.itemId, myVocabularyDeckId, 'active', nowIso, nowIso]
  );
  await db.run(
    `INSERT INTO card_content (card_id, lemma, pos, ipa, cefr, translation, example, example_translation, definition, source, refreshed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      cardId,
      word.lemma,
      word.pos ?? null,
      word.ipa ?? null,
      word.cefr ?? null,
      word.translation,
      word.example,
      word.exampleTranslation,
      word.definition,
      'pack',
      nowIso,
    ]
  );
  await addExistingCardToDeck(db, myVocabularyDeckId, word.itemType, word.itemId, now);
  notifyChange(['card', 'card_content']);

  return cardId;
}

export interface AddManualWordParams {
  db: DbExecutor;
  lemma: string;
  translation: string;
  example?: string;
  myVocabularyTitle?: string;
  now?: Date;
}

// Ветка «Не нашли такого слова» (docs/flows/f06.md): слова нет в пакете
// словаря — пользователь сам вводит перевод и, необязательно, пример. Ни
// нормализации, ни поиска по русскому слову, ни разбора фраз здесь нет —
// явно не в объёме (следующие задачи). item_id — новый UUID: своей таблицы
// личных слов нет, это просто уникальный идентификатор значения внутри
// карточки, вне пакета.
export async function addManualWord({
  db,
  lemma,
  translation,
  example,
  myVocabularyTitle = DEFAULT_MY_VOCABULARY_TITLE,
  now = new Date(),
}: AddManualWordParams): Promise<string> {
  const userId = await getOrCreateLocalUserId(db);
  const nowIso = now.toISOString();
  const cardId = uuidv7(now);
  const itemId = uuidv7(now);
  const trimmedExample = example?.trim();
  const myVocabularyDeckId = await getOrCreateMyVocabularyDeck(db, myVocabularyTitle, now);

  await db.run(
    'INSERT INTO card (id, user_id, item_type, item_id, source_deck_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [cardId, userId, MANUAL_WORD_ITEM_TYPE, itemId, myVocabularyDeckId, 'active', nowIso, nowIso]
  );
  await db.run(
    `INSERT INTO card_content (card_id, lemma, translation, example, source, refreshed_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [cardId, lemma.trim(), translation.trim(), trimmedExample || null, 'manual', nowIso]
  );
  await addExistingCardToDeck(db, myVocabularyDeckId, MANUAL_WORD_ITEM_TYPE, itemId, now);
  notifyChange(['card', 'card_content']);

  return cardId;
}

// «Отменить» в строке подтверждения, в течение 5 с после добавления (docs/flows/f06.md,
// шаг 5) — мягкое удаление той же карточки, тем же полем deleted_at, что и
// остальные пользовательские данные (docs/data-model.md, инвариант 7). Ссылку
// в «Моём словаре» (deck_item) тоже убираем — иначе отменённое слово всё
// равно осталось бы видно в этой колоде.
export async function undoAddedCard(
  db: DbExecutor,
  cardId: string,
  now: Date = new Date()
): Promise<void> {
  const nowIso = now.toISOString();
  const card = await db.get<{ item_type: string; item_id: string }>(
    'SELECT item_type, item_id FROM card WHERE id = ?',
    [cardId]
  );
  await db.run('UPDATE card SET deleted_at = ?, updated_at = ? WHERE id = ?', [
    nowIso,
    nowIso,
    cardId,
  ]);
  if (card) {
    await db.run('DELETE FROM deck_item WHERE item_type = ? AND item_id = ?', [
      card.item_type,
      card.item_id,
    ]);
  }
  notifyChange(['card', 'card_content', 'deck_item']);
}
