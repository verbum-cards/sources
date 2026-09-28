import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { createEmptyDictionaryPackage } from '../../src/db/entities/dictionary/build';
import { searchPackWordsByPrefix } from '../../src/db/entities/dictionary/lookup';
import { seedDictionaryPackage } from '../../src/db/entities/dictionary/seed';
import { getOrCreateLocalUserId } from '../../src/db/entities/user/app-meta';
import { migrate } from '../../src/db/migrate';
import {
  addWordToUserDeck,
  createUserDeck,
  loadUserDecks,
  loadUserDeckWords,
} from '../../src/screens/decks/user-deck-logic';
import { createNodeSqliteExecutor } from '../support/node-sqlite-executor';

async function setupDbs() {
  const userDb = new DatabaseSync(':memory:');
  const userExecutor = createNodeSqliteExecutor(userDb);
  await migrate(userExecutor);
  const userId = await getOrCreateLocalUserId(userExecutor);

  const dictionaryDb = new DatabaseSync(':memory:');
  const dictionaryExecutor = createNodeSqliteExecutor(dictionaryDb);
  await createEmptyDictionaryPackage(dictionaryExecutor, {
    lang: 'en',
    nativeLang: 'ru',
    builtAt: '2026-01-01T00:00:00.000Z',
  });
  await seedDictionaryPackage(dictionaryExecutor);

  return { db: userExecutor, dictionaryDb: dictionaryExecutor, userId };
}

test('createUserDeck + loadUserDecks: новая колода появляется с нулём слов', async () => {
  const { db } = await setupDbs();

  const deckId = await createUserDeck(db, 'Слова из фильма');

  const decks = await loadUserDecks(db);
  assert.deepEqual(decks, [{ id: deckId, title: 'Слова из фильма', itemCount: 0 }]);
});

test('createUserDeck: обрезает пробелы по краям названия', async () => {
  const { db } = await setupDbs();

  await createUserDeck(db, '  Моя колода  ');

  const [deck] = await loadUserDecks(db);
  assert.equal(deck?.title, 'Моя колода');
});

test('addWordToUserDeck: добавляет ссылку и создаёт настоящую карточку', async () => {
  const { db, dictionaryDb, userId } = await setupDbs();
  const deckId = await createUserDeck(db, 'Моя колода');
  const [menu] = await searchPackWordsByPrefix(dictionaryDb, 'menu');
  assert.ok(menu);

  const added = await addWordToUserDeck(db, deckId, menu);

  assert.equal(added, true);
  const [deck] = await loadUserDecks(db);
  assert.equal(deck?.itemCount, 1);

  const card = await db.get<{ item_id: string; source_deck_id: string; status: string }>(
    'SELECT item_id, source_deck_id, status FROM card WHERE user_id = ?',
    [userId]
  );
  assert.equal(card?.item_id, menu.itemId);
  assert.equal(card?.source_deck_id, deckId);
  assert.equal(card?.status, 'active');

  const content = await db.get<{ translation: string; definition: string }>(
    'SELECT translation, definition FROM card_content WHERE card_id = (SELECT id FROM card WHERE user_id = ?)',
    [userId]
  );
  assert.equal(content?.translation, menu.translation);
  assert.equal(content?.definition, menu.definition);
});

test('addWordToUserDeck: повторное добавление того же слова — нет-оп, без дублей', async () => {
  const { db, dictionaryDb } = await setupDbs();
  const deckId = await createUserDeck(db, 'Моя колода');
  const [menu] = await searchPackWordsByPrefix(dictionaryDb, 'menu');
  assert.ok(menu);

  await addWordToUserDeck(db, deckId, menu);
  const second = await addWordToUserDeck(db, deckId, menu);

  assert.equal(second, false);
  const [deck] = await loadUserDecks(db);
  assert.equal(deck?.itemCount, 1);
});

test('addWordToUserDeck: слово, уже добавленное вручную, не создаёт вторую карточку', async () => {
  const { db, dictionaryDb, userId } = await setupDbs();
  const deckId = await createUserDeck(db, 'Моя колода');
  const [menu] = await searchPackWordsByPrefix(dictionaryDb, 'menu');
  assert.ok(menu);

  const now = '2026-01-01T00:00:00.000Z';
  await db.run(
    'INSERT INTO card (id, user_id, item_type, item_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['manual-card', userId, menu.itemType, menu.itemId, 'active', now, now]
  );

  await addWordToUserDeck(db, deckId, menu, new Date(now));

  const cards = await db.all('SELECT id FROM card WHERE user_id = ?', [userId]);
  assert.equal(cards.length, 1);
});

test('loadUserDeckWords: слова колоды в порядке добавления, с полными данными из пакета', async () => {
  const { db, dictionaryDb } = await setupDbs();
  const deckId = await createUserDeck(db, 'Моя колода');
  const [menu] = await searchPackWordsByPrefix(dictionaryDb, 'menu');
  const [waiter] = await searchPackWordsByPrefix(dictionaryDb, 'waiter');
  assert.ok(menu && waiter);

  await addWordToUserDeck(db, deckId, menu);
  await addWordToUserDeck(db, deckId, waiter);

  const words = await loadUserDeckWords(db, dictionaryDb, deckId);
  assert.deepEqual(
    words.map((w) => w.lemma),
    ['menu', 'waiter']
  );
});
