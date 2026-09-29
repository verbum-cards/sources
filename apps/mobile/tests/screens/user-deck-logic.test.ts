import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { createEmptyDictionaryPackage } from '../../src/db/entities/dictionary/build';
import { searchPackWordsByPrefix } from '../../src/db/entities/dictionary/lookup';
import { seedDictionaryPackage } from '../../src/db/entities/dictionary/seed';
import { getOrCreateLocalUserId } from '../../src/db/entities/user/app-meta';
import { migrate } from '../../src/db/migrate';
import {
  addExistingCardToDeck,
  addWordToUserDeck,
  createUserDeck,
  deleteUserDeck,
  getOrCreateMyVocabularyDeck,
  loadUserDeck,
  loadUserDecks,
  loadUserDeckWords,
  moveWordToDeck,
  removeWordFromUserDeck,
  renameUserDeck,
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

test('loadUserDeck: отдаёт название и счётчик конкретной колоды', async () => {
  const { db, dictionaryDb } = await setupDbs();
  const deckId = await createUserDeck(db, 'Слова из фильма');
  const [menu] = await searchPackWordsByPrefix(dictionaryDb, 'menu');
  assert.ok(menu);
  await addWordToUserDeck(db, deckId, menu, 'Мой словарь');

  const deck = await loadUserDeck(db, deckId);
  assert.deepEqual(deck, { id: deckId, title: 'Слова из фильма', itemCount: 1 });
});

test('loadUserDeck: удалённая или несуществующая колода -> undefined', async () => {
  const { db } = await setupDbs();
  const deckId = await createUserDeck(db, 'Слова из фильма');
  await deleteUserDeck(db, deckId);

  assert.equal(await loadUserDeck(db, deckId), undefined);
  assert.equal(await loadUserDeck(db, 'not-a-real-id'), undefined);
});

test('deleteUserDeck: колода пропадает из loadUserDecks (мягкое удаление)', async () => {
  const { db } = await setupDbs();
  const deckId = await createUserDeck(db, 'Слова из фильма');

  await deleteUserDeck(db, deckId);

  assert.deepEqual(await loadUserDecks(db), []);
});

test('renameUserDeck: меняет название, обрезая пробелы', async () => {
  const { db } = await setupDbs();
  const deckId = await createUserDeck(db, 'Старое название');

  await renameUserDeck(db, deckId, '  Новое название  ');

  const [deck] = await loadUserDecks(db);
  assert.equal(deck?.title, 'Новое название');
});

test('renameUserDeck: пустое название (после trim) — нет-оп', async () => {
  const { db } = await setupDbs();
  const deckId = await createUserDeck(db, 'Название');

  await renameUserDeck(db, deckId, '   ');

  const [deck] = await loadUserDecks(db);
  assert.equal(deck?.title, 'Название');
});

test('moveWordToDeck: слово пропадает из исходной колоды и появляется в целевой', async () => {
  const { db, dictionaryDb } = await setupDbs();
  const fromDeckId = await createUserDeck(db, 'Колода А');
  const toDeckId = await createUserDeck(db, 'Колода Б');
  const [menu] = await searchPackWordsByPrefix(dictionaryDb, 'menu');
  assert.ok(menu);
  await addWordToUserDeck(db, fromDeckId, menu, 'Мой словарь');

  await moveWordToDeck(db, fromDeckId, toDeckId, menu.itemType, menu.itemId);

  assert.deepEqual(await loadUserDeckWords(db, dictionaryDb, fromDeckId), []);
  const toWords = await loadUserDeckWords(db, dictionaryDb, toDeckId);
  assert.equal(toWords.length, 1);
  assert.equal(toWords[0]?.itemId, menu.itemId);
});

test('moveWordToDeck: слово остаётся в «Мой словарь», карточка заново не создаётся', async () => {
  const { db, dictionaryDb, userId } = await setupDbs();
  const myVocabularyId = await getOrCreateMyVocabularyDeck(db, 'Мой словарь');
  const fromDeckId = await createUserDeck(db, 'Колода А');
  const toDeckId = await createUserDeck(db, 'Колода Б');
  const [menu] = await searchPackWordsByPrefix(dictionaryDb, 'menu');
  assert.ok(menu);
  await addWordToUserDeck(db, fromDeckId, menu, 'Мой словарь');
  const cardsBefore = await db.all('SELECT id FROM card WHERE user_id = ?', [userId]);

  await moveWordToDeck(db, fromDeckId, toDeckId, menu.itemType, menu.itemId);

  const myVocabularyWords = await loadUserDeckWords(db, dictionaryDb, myVocabularyId);
  assert.equal(myVocabularyWords.length, 1);
  const cardsAfter = await db.all('SELECT id FROM card WHERE user_id = ?', [userId]);
  assert.deepEqual(cardsAfter, cardsBefore);
});

test('createUserDeck: обрезает пробелы по краям названия', async () => {
  const { db } = await setupDbs();

  await createUserDeck(db, '  Моя колода  ');

  const [deck] = await loadUserDecks(db);
  assert.equal(deck?.title, 'Моя колода');
});

test('loadUserDecks: «Мой словарь» всегда первая, даже если она самая старая', async () => {
  const { db } = await setupDbs();

  const myVocabularyId = await getOrCreateMyVocabularyDeck(
    db,
    'Мой словарь',
    new Date('2026-01-01T00:00:00.000Z')
  );
  await createUserDeck(db, 'Слова из фильма', new Date('2026-02-01T00:00:00.000Z'));
  await createUserDeck(db, 'Свежая колода', new Date('2026-03-01T00:00:00.000Z'));

  const decks = await loadUserDecks(db);
  assert.equal(decks[0]?.id, myVocabularyId);
  assert.deepEqual(
    decks.map((d) => d.title),
    ['Мой словарь', 'Свежая колода', 'Слова из фильма']
  );
});

test('getOrCreateMyVocabularyDeck: повторный вызов возвращает тот же id, колода не дублируется', async () => {
  const { db } = await setupDbs();

  const first = await getOrCreateMyVocabularyDeck(db, 'Мой словарь');
  const second = await getOrCreateMyVocabularyDeck(db, 'Мой словарь');

  assert.equal(first, second);
  const decks = await loadUserDecks(db);
  assert.equal(decks.length, 1);
});

test('getOrCreateMyVocabularyDeck: протухший указатель в app_meta (колода удалена/не создана) — создаёт новую, а не возвращает мёртвый id', async () => {
  const { db } = await setupDbs();

  await db.run('INSERT INTO app_meta (key, value) VALUES (?, ?)', [
    'my_vocabulary_deck_id',
    'does-not-exist',
  ]);

  const deckId = await getOrCreateMyVocabularyDeck(db, 'Мой словарь');

  assert.notEqual(deckId, 'does-not-exist');
  const decks = await loadUserDecks(db);
  assert.equal(decks.length, 1);
  assert.equal(decks[0]?.id, deckId);

  // Указатель в app_meta перезаписан на новый id — следующий вызов не будет
  // снова спотыкаться о мёртвую ссылку.
  const second = await getOrCreateMyVocabularyDeck(db, 'Мой словарь');
  assert.equal(second, deckId);
});

test('getOrCreateMyVocabularyDeck: указатель ведёт на колоду другого user_id — создаёт новую для текущего пользователя', async () => {
  const { db } = await setupDbs();
  const now = '2026-01-01T00:00:00.000Z';
  const foreignDeckId = 'deck-of-another-user';

  // Колода физически существует (та же строка id), но принадлежит другому
  // user_id — воспроизводит протухший указатель после смены локального
  // пользователя (например, при повторном прогоне миграций в разработке).
  await db.run(
    `INSERT INTO deck (id, user_id, title, lang, native_lang, type, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [foreignDeckId, 'some-other-user-id', 'Мой словарь', 'en', 'ru', 'user', now, now]
  );
  await db.run('INSERT INTO app_meta (key, value) VALUES (?, ?)', [
    'my_vocabulary_deck_id',
    foreignDeckId,
  ]);

  const deckId = await getOrCreateMyVocabularyDeck(db, 'Мой словарь');

  assert.notEqual(deckId, foreignDeckId);
  const decks = await loadUserDecks(db);
  assert.equal(decks.length, 1);
  assert.equal(decks[0]?.id, deckId);
});

test('addWordToUserDeck: добавляет ссылку и создаёт настоящую карточку', async () => {
  const { db, dictionaryDb, userId } = await setupDbs();
  const deckId = await createUserDeck(db, 'Моя колода');
  const [menu] = await searchPackWordsByPrefix(dictionaryDb, 'menu');
  assert.ok(menu);

  const added = await addWordToUserDeck(db, deckId, menu, 'Мой словарь');

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

  await addWordToUserDeck(db, deckId, menu, 'Мой словарь');
  const second = await addWordToUserDeck(db, deckId, menu, 'Мой словарь');

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

  await addWordToUserDeck(db, deckId, menu, 'Мой словарь', new Date(now));

  const cards = await db.all('SELECT id FROM card WHERE user_id = ?', [userId]);
  assert.equal(cards.length, 1);
});

test('loadUserDeckWords: слова колоды в порядке добавления, с полными данными из пакета', async () => {
  const { db, dictionaryDb } = await setupDbs();
  const deckId = await createUserDeck(db, 'Моя колода');
  const [menu] = await searchPackWordsByPrefix(dictionaryDb, 'menu');
  const [waiter] = await searchPackWordsByPrefix(dictionaryDb, 'waiter');
  assert.ok(menu && waiter);

  await addWordToUserDeck(db, deckId, menu, 'Мой словарь');
  await addWordToUserDeck(db, deckId, waiter, 'Мой словарь');

  const words = await loadUserDeckWords(db, dictionaryDb, deckId);
  assert.deepEqual(
    words.map((w) => w.lemma),
    ['menu', 'waiter']
  );
});

test('loadUserDeckWords: слово, которого нет в пакете (введено вручную), резолвится из card_content', async () => {
  const { db, dictionaryDb, userId } = await setupDbs();
  const deckId = await createUserDeck(db, 'Мой словарь');

  const now = '2026-01-01T00:00:00.000Z';
  const cardId = 'manual-card';
  const itemId = 'manual-item';
  await db.run(
    'INSERT INTO card (id, user_id, item_type, item_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [cardId, userId, 'sense', itemId, 'active', now, now]
  );
  await db.run(
    `INSERT INTO card_content (card_id, lemma, translation, source, refreshed_at)
     VALUES (?, ?, ?, ?, ?)`,
    [cardId, 'serendipity', 'счастливая случайность', 'manual', now]
  );
  await db.run(
    'INSERT INTO card_content_example (card_id, position, text, translation) VALUES (?, ?, ?, ?)',
    [cardId, 0, 'It was pure serendipity.', 'Это была чистая случайность.']
  );
  await addExistingCardToDeck(db, deckId, 'sense', itemId, new Date(now));

  const words = await loadUserDeckWords(db, dictionaryDb, deckId);

  assert.equal(words.length, 1);
  assert.equal(words[0]?.lemma, 'serendipity');
  assert.equal(words[0]?.translation, 'счастливая случайность');
  assert.equal(words[0]?.cefr, undefined);
  assert.deepEqual(words[0]?.examples, [
    { text: 'It was pure serendipity.', translation: 'Это была чистая случайность.' },
  ]);
});

test('removeWordFromUserDeck: убирает слово из колоды (deck_item), карточку не трогает', async () => {
  const { db, dictionaryDb, userId } = await setupDbs();
  const deckId = await createUserDeck(db, 'Слова из фильма');
  const [menu] = await searchPackWordsByPrefix(dictionaryDb, 'menu');
  assert.ok(menu);
  await addWordToUserDeck(db, deckId, menu, 'Мой словарь');

  await removeWordFromUserDeck(db, deckId, menu.itemType, menu.itemId);

  const words = await loadUserDeckWords(db, dictionaryDb, deckId);
  assert.deepEqual(words, []);

  const card = await db.get<{ id: string; deleted_at: string | null }>(
    'SELECT id, deleted_at FROM card WHERE user_id = ? AND item_id = ?',
    [userId, menu.itemId]
  );
  assert.ok(card, 'карточка остаётся — свайп по колоде не удаляет слово из словаря пользователя');
  assert.equal(card?.deleted_at, null);
});

test('removeWordFromUserDeck: не трогает то же слово в другой колоде', async () => {
  const { db, dictionaryDb } = await setupDbs();
  const deckId = await createUserDeck(db, 'Слова из фильма');
  const otherDeckId = await createUserDeck(db, 'Другая колода');
  const [menu] = await searchPackWordsByPrefix(dictionaryDb, 'menu');
  assert.ok(menu);
  await addWordToUserDeck(db, deckId, menu, 'Мой словарь');
  await addWordToUserDeck(db, otherDeckId, menu, 'Мой словарь');

  await removeWordFromUserDeck(db, deckId, menu.itemType, menu.itemId);

  assert.deepEqual(await loadUserDeckWords(db, dictionaryDb, deckId), []);
  const otherWords = await loadUserDeckWords(db, dictionaryDb, otherDeckId);
  assert.equal(otherWords.length, 1);
});

test('removeWordFromUserDeck: слова не было в колоде — нет-оп, без ошибки', async () => {
  const { db, dictionaryDb } = await setupDbs();
  const deckId = await createUserDeck(db, 'Слова из фильма');

  await removeWordFromUserDeck(db, deckId, 'sense', 'not-there');

  assert.deepEqual(await loadUserDeckWords(db, dictionaryDb, deckId), []);
});

test('addWordToUserDeck: слово попадает и в свою колоду, и в «Мой словарь»', async () => {
  const { db, dictionaryDb } = await setupDbs();
  const deckId = await createUserDeck(db, 'Слова из фильма');
  const [menu] = await searchPackWordsByPrefix(dictionaryDb, 'menu');
  assert.ok(menu);

  await addWordToUserDeck(db, deckId, menu, 'Мой словарь');

  const decks = await loadUserDecks(db);
  const ownDeck = decks.find((d) => d.id === deckId);
  const myVocabulary = decks.find((d) => d.title === 'Мой словарь');
  assert.equal(ownDeck?.itemCount, 1);
  assert.equal(myVocabulary?.itemCount, 1);
});

test('addWordToUserDeck: слово, уже существующее карточкой из другого источника, тоже попадает в «Мой словарь»', async () => {
  const { db, dictionaryDb, userId } = await setupDbs();
  const deckId = await createUserDeck(db, 'Слова из фильма');
  const [menu] = await searchPackWordsByPrefix(dictionaryDb, 'menu');
  assert.ok(menu);

  const now = '2026-01-01T00:00:00.000Z';
  await db.run(
    'INSERT INTO card (id, user_id, item_type, item_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['existing-card', userId, menu.itemType, menu.itemId, 'active', now, now]
  );

  await addWordToUserDeck(db, deckId, menu, 'Мой словарь', new Date(now));

  const decks = await loadUserDecks(db);
  const myVocabulary = decks.find((d) => d.title === 'Мой словарь');
  assert.equal(myVocabulary?.itemCount, 1);
});
