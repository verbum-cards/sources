import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import type { PackWord } from '../../src/db/entities/dictionary/lookup';
import { getOrCreateLocalUserId } from '../../src/db/entities/user/app-meta';
import { migrate } from '../../src/db/migrate';
import { DEBUG_WORDS } from '../../src/mocks/fsrs-debug-words';
import { loadUserDecks } from '../../src/screens/decks/user-deck-logic';
import {
  addManualWord,
  addWordFromDictionary,
  isWordAlreadyAdded,
  loadAddedItemIds,
  undoAddedCard,
} from '../../src/screens/home/word-add-logic';
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

  assert.equal(await isWordAlreadyAdded(db, word.itemType, word.itemId), false);
});

test('isWordAlreadyAdded: true после добавления слова из словаря', async () => {
  const { db } = await setupDb();
  const word = DEBUG_WORDS[0];

  await addWordFromDictionary({ db, word });

  assert.equal(await isWordAlreadyAdded(db, word.itemType, word.itemId), true);
});

test('isWordAlreadyAdded: false после отмены (мягкое удаление) — можно добавить снова', async () => {
  const { db } = await setupDb();
  const word = DEBUG_WORDS[0];

  const cardId = await addWordFromDictionary({ db, word });
  await undoAddedCard(db, cardId);

  assert.equal(await isWordAlreadyAdded(db, word.itemType, word.itemId), false);
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

  assert.deepEqual(await loadAddedItemIds(db), new Set([`${added.itemType}:${added.itemId}`]));
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

  const content = await db.get<{
    lemma: string;
    ipa: string;
    cefr: string;
    translation: string;
    definition: string;
    source: string;
  }>(
    'SELECT lemma, ipa, cefr, translation, definition, source FROM card_content WHERE card_id = ?',
    [cardId]
  );
  assert.deepEqual(
    { ...content },
    {
      lemma: word.lemma,
      ipa: word.ipa,
      cefr: word.cefr,
      translation: word.translation,
      definition: word.definition,
      source: 'pack',
    }
  );
});

test('addWordFromDictionary: слово-фраза (item_type=expression) пишет expression, а не sense', async () => {
  const { db, userId } = await setupDb();
  const word: PackWord = {
    itemId: 'expr-1',
    itemType: 'expression',
    lemma: 'give it a shot',
    translation: 'попробовать',
    example: "Let's give it a shot.",
    exampleTranslation: 'Давай попробуем.',
    definition: 'to attempt something',
  };

  const cardId = await addWordFromDictionary({ db, word });

  const card = await db.get<{ item_type: string; item_id: string }>(
    'SELECT item_type, item_id FROM card WHERE id = ? AND user_id = ?',
    [cardId, userId]
  );
  assert.equal(card?.item_type, 'expression');
  assert.equal(card?.item_id, word.itemId);

  assert.equal(
    await isWordAlreadyAdded(db, 'expression', word.itemId),
    true,
    'дубликат должен определяться по expression, не по sense'
  );
  assert.equal(
    await isWordAlreadyAdded(db, 'sense', word.itemId),
    false,
    'тот же itemId под другим itemType не считается дублем'
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

test('addWordFromDictionary: слово попадает в «Мой словарь» — source_deck_id, deck_item и счётчик колоды', async () => {
  const { db } = await setupDb();
  const word = DEBUG_WORDS[0];

  const cardId = await addWordFromDictionary({ db, word, myVocabularyTitle: 'Мой словарь' });

  const card = await db.get<{ source_deck_id: string | null }>(
    'SELECT source_deck_id FROM card WHERE id = ?',
    [cardId]
  );
  assert.ok(card?.source_deck_id);

  const deckItem = await db.get('SELECT deck_id FROM deck_item WHERE deck_id = ? AND item_id = ?', [
    card.source_deck_id,
    word.itemId,
  ]);
  assert.ok(deckItem);

  const [deck] = await loadUserDecks(db);
  assert.equal(deck?.title, 'Мой словарь');
  assert.equal(deck?.itemCount, 1);
});

test('addManualWord: тоже попадает в «Мой словарь», в ту же колоду, что и слова из словаря', async () => {
  const { db } = await setupDb();

  const dictCardId = await addWordFromDictionary({
    db,
    word: DEBUG_WORDS[0],
    myVocabularyTitle: 'Мой словарь',
  });
  await addManualWord({
    db,
    lemma: 'serendipity',
    translation: 'счастливая случайность',
    myVocabularyTitle: 'Мой словарь',
  });

  const decks = await loadUserDecks(db);
  assert.equal(decks.length, 1, 'колода «Мой словарь» не должна создаваться дважды');
  assert.equal(decks[0]?.itemCount, 2);

  const dictCard = await db.get<{ source_deck_id: string }>(
    'SELECT source_deck_id FROM card WHERE id = ?',
    [dictCardId]
  );
  assert.equal(dictCard?.source_deck_id, decks[0]?.id);
});

test('undoAddedCard: убирает слово и из «Моего словаря» (deck_item), не только из card', async () => {
  const { db } = await setupDb();
  const word = DEBUG_WORDS[0];
  const cardId = await addWordFromDictionary({ db, word, myVocabularyTitle: 'Мой словарь' });

  await undoAddedCard(db, cardId);

  const [deck] = await loadUserDecks(db);
  assert.equal(deck?.itemCount, 0);
});
