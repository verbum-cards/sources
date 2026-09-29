import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import {
  getOrCreateDeviceId,
  getOrCreateLocalUserId,
} from '../../../src/db/entities/user/app-meta';
import { migrate } from '../../../src/db/migrate';
import { DEBUG_WORDS } from '../../../src/mocks/fsrs-debug-words';
import { loadUserDecks } from '../../../src/screens/decks/user-deck-logic';
import { answerFirstSessionWord } from '../../../src/screens/onboarding/onboarding-logic';
import { createNodeSqliteExecutor } from '../../support/node-sqlite-executor';

const MY_VOCABULARY_TITLE = 'Мой словарь';

async function setupDb() {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await migrate(executor);
  const userId = await getOrCreateLocalUserId(executor);
  const deviceId = await getOrCreateDeviceId(executor);

  return { db: executor, userId, deviceId };
}

test('answerFirstSessionWord: «Знаю это слово» -> card.status=known, без review_log/card_schedule', async () => {
  const { db, userId, deviceId } = await setupDb();
  const word = DEBUG_WORDS[0];

  const cardId = await answerFirstSessionWord({
    db,
    userId,
    deviceId,
    word,
    knowsWord: true,
    myVocabularyTitle: MY_VOCABULARY_TITLE,
  });

  const card = await db.get<{ status: string; item_type: string; item_id: string }>(
    'SELECT status, item_type, item_id FROM card WHERE id = ?',
    [cardId]
  );
  assert.deepEqual({ ...card }, { status: 'known', item_type: 'sense', item_id: word.itemId });

  const content = await db.get<{
    lemma: string;
    ipa: string;
    cefr: string;
    translation: string;
    definition: string;
  }>('SELECT lemma, ipa, cefr, translation, definition FROM card_content WHERE card_id = ?', [
    cardId,
  ]);
  assert.deepEqual(
    { ...content },
    {
      lemma: word.lemma,
      ipa: word.ipa,
      cefr: word.cefr,
      translation: word.translation,
      definition: word.definition,
    }
  );

  const reviewLogs = await db.all('SELECT * FROM review_log WHERE card_id = ?', [cardId]);
  const schedules = await db.all('SELECT * FROM card_schedule WHERE card_id = ?', [cardId]);
  assert.equal(reviewLogs.length, 0, 'известные слова не должны заводить review_log');
  assert.equal(schedules.length, 0, 'известные слова не должны заводить card_schedule');

  const [myVocabulary] = await loadUserDecks(db);
  assert.equal(myVocabulary?.title, MY_VOCABULARY_TITLE);
  assert.equal(myVocabulary?.itemCount, 1, '«Знаю это слово» тоже попадает в «Мой словарь»');
});

test('answerFirstSessionWord: «Не знаю» -> card.status=active + review_log/card_schedule с оценкой again', async () => {
  const { db, userId, deviceId } = await setupDb();
  const word = DEBUG_WORDS[1];

  const cardId = await answerFirstSessionWord({
    db,
    userId,
    deviceId,
    word,
    knowsWord: false,
    myVocabularyTitle: MY_VOCABULARY_TITLE,
  });

  const card = await db.get<{ status: string }>('SELECT status FROM card WHERE id = ?', [cardId]);
  assert.equal(card?.status, 'active');

  const reviewLogs = await db.all<{ rating: string; card_id: string }>(
    'SELECT rating, card_id FROM review_log WHERE card_id = ?',
    [cardId]
  );
  assert.equal(reviewLogs.length, 1);
  assert.equal(reviewLogs[0].rating, 'again');

  const schedule = await db.get<{ card_id: string; reps: number | null }>(
    'SELECT card_id, reps FROM card_schedule WHERE card_id = ?',
    [cardId]
  );
  assert.ok(schedule, 'card_schedule должен появиться после applyRating');

  const [myVocabulary] = await loadUserDecks(db);
  assert.equal(myVocabulary?.itemCount, 1);
});

test('answerFirstSessionWord: разные слова первой сессии создают разные карточки', async () => {
  const { db, userId, deviceId } = await setupDb();

  const knownCardId = await answerFirstSessionWord({
    db,
    userId,
    deviceId,
    word: DEBUG_WORDS[0],
    knowsWord: true,
    myVocabularyTitle: MY_VOCABULARY_TITLE,
  });
  const activeCardId = await answerFirstSessionWord({
    db,
    userId,
    deviceId,
    word: DEBUG_WORDS[1],
    knowsWord: false,
    myVocabularyTitle: MY_VOCABULARY_TITLE,
  });

  assert.notEqual(knownCardId, activeCardId);
  const cards = await db.all('SELECT id FROM card WHERE user_id = ?', [userId]);
  assert.equal(cards.length, 2);

  const [myVocabulary] = await loadUserDecks(db);
  assert.equal(myVocabulary?.itemCount, 2, 'оба слова первой сессии — в «Мой словарь»');
});
