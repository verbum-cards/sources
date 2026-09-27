import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { getOrCreateLocalUserId } from '../../src/db/entities/user/app-meta';
import { migrate } from '../../src/db/migrate';
import { DEBUG_WORDS } from '../../src/mocks/fsrs-debug-words';
import {
  addManualWord,
  addWordFromDictionary,
  isWordAlreadyAdded,
  loadAddedItemIds,
  undoAddedCard,
} from '../../src/screens/word-add-logic';
import { createNodeSqliteExecutor } from '../support/node-sqlite-executor';

async function setupDb() {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await migrate(executor);
  const userId = await getOrCreateLocalUserId(executor);

  return { db: executor, userId };
}

test('isWordAlreadyAdded: false, пока карточки нет', async () => {
  const { db } = await setupDb();
  const word = DEBUG_WORDS[0];

  assert.equal(await isWordAlreadyAdded(db, word.itemId), false);
});

test('isWordAlreadyAdded: true после добавления слова из словаря', async () => {
  const { db } = await setupDb();
  const word = DEBUG_WORDS[0];

  await addWordFromDictionary({ db, word });

  assert.equal(await isWordAlreadyAdded(db, word.itemId), true);
});

test('isWordAlreadyAdded: false после отмены (мягкое удаление) — можно добавить снова', async () => {
  const { db } = await setupDb();
  const word = DEBUG_WORDS[0];

  const cardId = await addWordFromDictionary({ db, word });
  await undoAddedCard(db, cardId);

  assert.equal(await isWordAlreadyAdded(db, word.itemId), false);
});

test('loadAddedItemIds: пусто, пока карточек нет', async () => {
  const { db } = await setupDb();

  assert.deepEqual(await loadAddedItemIds(db), new Set());
});

test('loadAddedItemIds: содержит item_id добавленных слов, не содержит отменённые', async () => {
  const { db } = await setupDb();
  const [added, undone] = DEBUG_WORDS;

  await addWordFromDictionary({ db, word: added });
  const undoneCardId = await addWordFromDictionary({ db, word: undone });
  await undoAddedCard(db, undoneCardId);

  assert.deepEqual(await loadAddedItemIds(db), new Set([added.itemId]));
});

test('addWordFromDictionary: создаёт card (status=active, item_type=sense) и card_content (source=pack)', async () => {
  const { db, userId } = await setupDb();
  const word = DEBUG_WORDS[2];

  const cardId = await addWordFromDictionary({ db, word });

  const card = await db.get<{
    user_id: string;
    item_type: string;
    item_id: string;
    status: string;
    deleted_at: string | null;
  }>('SELECT user_id, item_type, item_id, status, deleted_at FROM card WHERE id = ?', [cardId]);
  assert.deepEqual(
    { ...card },
    {
      user_id: userId,
      item_type: 'sense',
      item_id: word.itemId,
      status: 'active',
      deleted_at: null,
    }
  );

  const content = await db.get<{ lemma: string; translation: string; source: string }>(
    'SELECT lemma, translation, source FROM card_content WHERE card_id = ?',
    [cardId]
  );
  assert.deepEqual(
    { ...content },
    { lemma: word.lemma, translation: word.translation, source: 'pack' }
  );
});

test('addManualWord: создаёт card (status=active) и card_content (source=manual) с введёнными данными', async () => {
  const { db, userId } = await setupDb();

  const cardId = await addManualWord({
    db,
    lemma: 'serendipity',
    translation: 'счастливая случайность',
    example: 'It was pure serendipity.',
  });

  const card = await db.get<{ user_id: string; item_type: string; status: string }>(
    'SELECT user_id, item_type, status FROM card WHERE id = ?',
    [cardId]
  );
  assert.deepEqual({ ...card }, { user_id: userId, item_type: 'sense', status: 'active' });

  const content = await db.get<{
    lemma: string;
    translation: string;
    example: string | null;
    source: string;
  }>('SELECT lemma, translation, example, source FROM card_content WHERE card_id = ?', [cardId]);
  assert.deepEqual(
    { ...content },
    {
      lemma: 'serendipity',
      translation: 'счастливая случайность',
      example: 'It was pure serendipity.',
      source: 'manual',
    }
  );
});

test('addManualWord: пустой пример сохраняется как null, а не пустая строка', async () => {
  const { db } = await setupDb();

  const cardId = await addManualWord({ db, lemma: 'foo', translation: 'фу', example: '' });

  const content = await db.get<{ example: string | null }>(
    'SELECT example FROM card_content WHERE card_id = ?',
    [cardId]
  );
  assert.equal(content?.example, null);
});

test('addManualWord и addWordFromDictionary: каждый вызов создаёт отдельную карточку', async () => {
  const { db, userId } = await setupDb();

  await addWordFromDictionary({ db, word: DEBUG_WORDS[0] });
  await addManualWord({ db, lemma: 'foo', translation: 'фу' });

  const cards = await db.all('SELECT id FROM card WHERE user_id = ?', [userId]);
  assert.equal(cards.length, 2);
});

test('undoAddedCard: помечает карточку deleted_at, не удаляя строку физически', async () => {
  const { db } = await setupDb();
  const cardId = await addWordFromDictionary({ db, word: DEBUG_WORDS[0] });

  await undoAddedCard(db, cardId, new Date('2026-01-01T00:00:00.000Z'));

  const card = await db.get<{ deleted_at: string | null }>(
    'SELECT deleted_at FROM card WHERE id = ?',
    [cardId]
  );
  assert.equal(card?.deleted_at, '2026-01-01T00:00:00.000Z');
});
