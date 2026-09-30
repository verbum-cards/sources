import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { createEmptyDictionaryPackage } from '../../../src/db/entities/dictionary/build';
import { searchPackWordsByPrefix } from '../../../src/db/entities/dictionary/lookup';
import { seedDictionaryPackage } from '../../../src/db/entities/dictionary/seed';
import { getOrCreateLocalUserId } from '../../../src/db/entities/user/app-meta';
import type { DbExecutor } from '../../../src/db/executor';
import { migrate } from '../../../src/db/migrate';
import { DECKS } from '../../../src/mocks/decks';
import { applyRating, getCardSchedule, markCardIntroduced } from '../../../src/scheduler/scheduler';
import { addDeckToUser } from '../../../src/screens/decks/decks-logic';
import {
  addWordToUserDeck,
  createUserDeck,
  moveWordToDeck,
} from '../../../src/screens/decks/user-deck-logic';
import {
  advanceAfterAgain,
  advanceAfterGood,
  advanceAfterIntro,
  advanceAfterKnown,
  buildDeckSessionQueue,
  computeSessionSummary,
  currentSessionCard,
  isSessionDone,
  markCardKnown,
  startSession,
  type SessionCard,
} from '../../../src/screens/session/session-logic';
import { createNodeSqliteExecutor } from '../../support/node-sqlite-executor';

async function setupDbs() {
  const userDb = new DatabaseSync(':memory:');
  const db = createNodeSqliteExecutor(userDb);
  await migrate(db);
  const userId = await getOrCreateLocalUserId(db);

  const dictionaryDb = new DatabaseSync(':memory:');
  const dictionaryExecutor = createNodeSqliteExecutor(dictionaryDb);
  await createEmptyDictionaryPackage(dictionaryExecutor, {
    lang: 'en',
    nativeLang: 'ru',
    builtAt: '2026-01-01T00:00:00.000Z',
  });
  await seedDictionaryPackage(dictionaryExecutor);

  return { db, dictionaryDb: dictionaryExecutor, userId };
}

async function setUserProfile(db: DbExecutor, userId: string, newPerDay: number): Promise<void> {
  await db.run(
    `INSERT INTO user_profile (user_id, native_lang, target_lang, level, goals, daily_minutes, new_per_day, waitlist_langs, updated_at)
     VALUES (?, 'ru', 'en', 'A1', '[]', 10, ?, '[]', ?)`,
    [userId, newPerDay, new Date('2026-01-01T00:00:00.000Z').toISOString()]
  );
}

async function getCardId(db: DbExecutor, itemId: string): Promise<string> {
  const row = await db.get<{ id: string }>('SELECT id FROM card WHERE item_id = ?', [itemId]);
  assert.ok(row, `карточка для item_id=${itemId} должна существовать`);

  return row.id;
}

async function setDue(db: DbExecutor, cardId: string, due: string, now: Date): Promise<void> {
  await db.run(
    `INSERT INTO card_schedule (card_id, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, fsrs_state, last_review, first_review_at)
     VALUES (?, ?, 1, 1, 1, 1, 1, 0, 2, ?, ?)`,
    [cardId, due, now.toISOString(), now.toISOString()]
  );
}

test('buildDeckSessionQueue: просроченная карточка идёт раньше новой', async () => {
  const { db, dictionaryDb, userId } = await setupDbs();
  await setUserProfile(db, userId, 10);
  const deckId = await createUserDeck(db, 'Колода');
  const now = new Date('2026-02-01T12:00:00.000Z');

  const [wander] = await searchPackWordsByPrefix(dictionaryDb, 'wander');
  const [fierce] = await searchPackWordsByPrefix(dictionaryDb, 'fierce');
  assert.ok(wander && fierce);
  await addWordToUserDeck(db, deckId, wander, 'Мой словарь', now);
  await addWordToUserDeck(db, deckId, fierce, 'Мой словарь', now);

  const wanderCardId = await getCardId(db, wander.itemId);
  await setDue(db, wanderCardId, '2026-01-30T00:00:00.000Z', now);

  const queue = await buildDeckSessionQueue(db, deckId, now);

  assert.equal(queue.length, 2);
  assert.equal(queue[0]?.itemId, wander.itemId);
  assert.equal(queue[0]?.needsIntro, false);
  assert.deepEqual(queue[0]?.examples, wander.examples);
  assert.equal(queue[1]?.itemId, fierce.itemId);
  assert.equal(queue[1]?.needsIntro, true);
});

test('buildDeckSessionQueue: не больше остатка дневного лимита новых', async () => {
  const { db, dictionaryDb, userId } = await setupDbs();
  await setUserProfile(db, userId, 1);
  const deckId = await createUserDeck(db, 'Колода');
  const now = new Date('2026-02-01T12:00:00.000Z');

  const [wander] = await searchPackWordsByPrefix(dictionaryDb, 'wander');
  const [fierce] = await searchPackWordsByPrefix(dictionaryDb, 'fierce');
  assert.ok(wander && fierce);
  await addWordToUserDeck(db, deckId, wander, 'Мой словарь', now);
  await addWordToUserDeck(db, deckId, fierce, 'Мой словарь', now);

  const queue = await buildDeckSessionQueue(db, deckId, now);

  assert.equal(queue.length, 1);
});

test('buildDeckSessionQueue: лимит учитывает уже показанные сегодня («знакомство» тоже показ)', async () => {
  const { db, dictionaryDb, userId } = await setupDbs();
  await setUserProfile(db, userId, 1);
  const deckId = await createUserDeck(db, 'Колода');
  const now = new Date('2026-02-01T12:00:00.000Z');

  const [wander] = await searchPackWordsByPrefix(dictionaryDb, 'wander');
  const [fierce] = await searchPackWordsByPrefix(dictionaryDb, 'fierce');
  assert.ok(wander && fierce);
  await addWordToUserDeck(db, deckId, wander, 'Мой словарь', now);
  await addWordToUserDeck(db, deckId, fierce, 'Мой словарь', now);

  const wanderCardId = await getCardId(db, wander.itemId);
  await markCardIntroduced(db, wanderCardId, now);

  const queue = await buildDeckSessionQueue(db, deckId, now);

  // wander уже не «новая» (есть card_schedule), а лимит на сегодня исчерпан —
  // fierce новой карточкой не пройдёт, но сам wander вернётся как due
  // (незавершённое знакомство).
  assert.equal(queue.length, 1);
  assert.equal(queue[0]?.itemId, wander.itemId);
  assert.equal(queue[0]?.needsIntro, false);
});

test('buildDeckSessionQueue: только карточки этой колоды, не другой', async () => {
  const { db, dictionaryDb, userId } = await setupDbs();
  await setUserProfile(db, userId, 10);
  const deckA = await createUserDeck(db, 'Колода А');
  const deckB = await createUserDeck(db, 'Колода Б');
  const now = new Date('2026-02-01T12:00:00.000Z');

  const [wander] = await searchPackWordsByPrefix(dictionaryDb, 'wander');
  const [fierce] = await searchPackWordsByPrefix(dictionaryDb, 'fierce');
  assert.ok(wander && fierce);
  await addWordToUserDeck(db, deckA, wander, 'Мой словарь', now);
  await addWordToUserDeck(db, deckB, fierce, 'Мой словарь', now);

  const queue = await buildDeckSessionQueue(db, deckA, now);

  assert.equal(queue.length, 1);
  assert.equal(queue[0]?.itemId, wander.itemId);
});

test('buildDeckSessionQueue: «Знаю это слово» (status=known) исключает карточку', async () => {
  const { db, dictionaryDb, userId } = await setupDbs();
  await setUserProfile(db, userId, 10);
  const deckId = await createUserDeck(db, 'Колода');
  const now = new Date('2026-02-01T12:00:00.000Z');

  const [wander] = await searchPackWordsByPrefix(dictionaryDb, 'wander');
  assert.ok(wander);
  await addWordToUserDeck(db, deckId, wander, 'Мой словарь', now);
  const wanderCardId = await getCardId(db, wander.itemId);

  await markCardKnown(db, wanderCardId, now);

  const queue = await buildDeckSessionQueue(db, deckId, now);
  assert.equal(queue.length, 0);
});

test('buildDeckSessionQueue: официальная колода (нет строки в deck/deck_item) — членство по source_deck_id', async () => {
  const { db, userId } = await setupDbs();
  // Не DECKS[0] — порядок DECKS зависит от алфавитного порядка файлов
  // data/decks/*.json, нужна просто любая непустая колода.
  const restaurant = DECKS.reduce((max, deck) =>
    deck.items.length > max.items.length ? deck : max
  );
  await setUserProfile(db, userId, restaurant.items.length);

  await addDeckToUser(db, restaurant);

  const queue = await buildDeckSessionQueue(
    db,
    restaurant.id,
    new Date('2026-02-01T12:00:00.000Z')
  );

  assert.equal(queue.length, restaurant.items.length);
  assert.ok(queue.every((card) => card.needsIntro));
});

test('buildDeckSessionQueue: карточка, перенесённая из своей колоды в другую, больше не входит в исходную', async () => {
  const { db, dictionaryDb, userId } = await setupDbs();
  await setUserProfile(db, userId, 10);
  const deckA = await createUserDeck(db, 'Колода А');
  const deckB = await createUserDeck(db, 'Колода Б');
  const now = new Date('2026-02-01T12:00:00.000Z');

  const [wander] = await searchPackWordsByPrefix(dictionaryDb, 'wander');
  assert.ok(wander);
  await addWordToUserDeck(db, deckA, wander, 'Мой словарь', now);
  await moveWordToDeck(db, deckA, deckB, wander.itemType, wander.itemId, now);

  const queueA = await buildDeckSessionQueue(db, deckA, now);
  const queueB = await buildDeckSessionQueue(db, deckB, now);

  assert.equal(queueA.length, 0, 'source_deck_id всё ещё указывает на А, но это не членство');
  assert.equal(queueB.length, 1);
});

test('markCardIntroduced: пишет first_review_at, нет-оп при повторном вызове', async () => {
  const { db, dictionaryDb } = await setupDbs();
  const deckId = await createUserDeck(db, 'Колода');
  const now = new Date('2026-02-01T12:00:00.000Z');

  const [wander] = await searchPackWordsByPrefix(dictionaryDb, 'wander');
  assert.ok(wander);
  await addWordToUserDeck(db, deckId, wander, 'Мой словарь', now);
  const cardId = await getCardId(db, wander.itemId);

  await markCardIntroduced(db, cardId, now);
  const first = await getCardSchedule(db, cardId);
  assert.equal(first?.first_review_at, now.toISOString());
  assert.equal(first?.fsrs_state, null);

  await markCardIntroduced(db, cardId, new Date('2026-02-02T00:00:00.000Z'));
  const second = await getCardSchedule(db, cardId);
  assert.equal(second?.first_review_at, now.toISOString(), 'второй вызов не должен перезаписать');
});

test('computeSessionSummary: доля верных = null, если в сессии не было ни одного квиза', async () => {
  const { db } = await setupDbs();
  const deckId = await createUserDeck(db, 'Колода');
  const now = new Date('2026-02-01T12:00:00.000Z');

  const summary = await computeSessionSummary(
    db,
    deckId,
    { cardsReviewed: 0, totalAnswers: 0, correctAnswers: 0 },
    now
  );

  assert.equal(summary.correctRatio, null);
  assert.equal(summary.cardsReviewed, 0);
});

test('computeSessionSummary: доля верных считается из totalAnswers/correctAnswers', async () => {
  const { db } = await setupDbs();
  const deckId = await createUserDeck(db, 'Колода');
  const now = new Date('2026-02-01T12:00:00.000Z');

  const summary = await computeSessionSummary(
    db,
    deckId,
    { cardsReviewed: 4, totalAnswers: 4, correctAnswers: 3 },
    now
  );

  assert.equal(summary.correctRatio, 0.75);
  assert.equal(summary.cardsReviewed, 4);
});

test('computeSessionSummary: «вернётся сегодня» и «прогноз на завтра» считаются по due этой колоды', async () => {
  const { db, dictionaryDb } = await setupDbs();
  const deckId = await createUserDeck(db, 'Колода');
  const now = new Date('2026-02-01T12:00:00.000Z');

  const [wander] = await searchPackWordsByPrefix(dictionaryDb, 'wander');
  const [fierce] = await searchPackWordsByPrefix(dictionaryDb, 'fierce');
  assert.ok(wander && fierce);
  await addWordToUserDeck(db, deckId, wander, 'Мой словарь', now);
  await addWordToUserDeck(db, deckId, fierce, 'Мой словарь', now);

  const wanderCardId = await getCardId(db, wander.itemId);
  const fierceCardId = await getCardId(db, fierce.itemId);
  await setDue(db, wanderCardId, '2026-02-01T18:00:00.000Z', now); // сегодня, позже
  await setDue(db, fierceCardId, '2026-02-02T09:00:00.000Z', now); // завтра

  const summary = await computeSessionSummary(
    db,
    deckId,
    { cardsReviewed: 0, totalAnswers: 0, correctAnswers: 0 },
    now
  );

  assert.equal(summary.dueTodayCount, 1);
  assert.equal(summary.dueTomorrowCount, 1);
});

test('computeSessionSummary: серия дней — по датам review_log этого пользователя', async () => {
  const { db, dictionaryDb, userId } = await setupDbs();
  const deviceId = 'device-1';
  const deckId = await createUserDeck(db, 'Колода');
  const [wander] = await searchPackWordsByPrefix(dictionaryDb, 'wander');
  assert.ok(wander);
  await addWordToUserDeck(db, deckId, wander, 'Мой словарь', new Date('2026-02-01T08:00:00.000Z'));
  const cardId = await getCardId(db, wander.itemId);

  await applyRating({
    db,
    cardId,
    userId,
    deviceId,
    rating: 'good',
    now: new Date('2026-02-01T09:00:00.000Z'),
  });
  await applyRating({
    db,
    cardId,
    userId,
    deviceId,
    rating: 'good',
    now: new Date('2026-02-02T09:00:00.000Z'),
  });

  const summary = await computeSessionSummary(
    db,
    deckId,
    { cardsReviewed: 1, totalAnswers: 1, correctAnswers: 1 },
    new Date('2026-02-02T12:00:00.000Z')
  );

  assert.equal(summary.streakDays, 2);
});

function makeCard(overrides: Partial<SessionCard>): SessionCard {
  return {
    cardId: '1',
    itemType: 'sense',
    itemId: 'item-1',
    lemma: 'word',
    ipa: null,
    translation: 'перевод',
    examples: [],
    needsIntro: false,
    ...overrides,
  };
}

test('advanceAfterGood: просто переходит к следующей карточке', () => {
  const queue = [makeCard({ cardId: '1' }), makeCard({ cardId: '2' })];
  const state = startSession(queue);

  const next = advanceAfterGood(state);

  assert.equal(currentSessionCard(next)?.cardId, '2');
  assert.equal(isSessionDone(next), false);
});

test('isSessionDone: true после последней карточки', () => {
  const state = startSession([makeCard({ cardId: '1' })]);

  const next = advanceAfterGood(state);

  assert.equal(isSessionDone(next), true);
  assert.equal(currentSessionCard(next), undefined);
});

test('advanceAfterIntro: карточка возвращается через offset позиций с needsIntro=false', () => {
  const queue = [
    makeCard({ cardId: '1', needsIntro: true }),
    makeCard({ cardId: '2' }),
    makeCard({ cardId: '3' }),
    makeCard({ cardId: '4' }),
    makeCard({ cardId: '5' }),
  ];
  const state = startSession(queue);
  const fixedRandom = () => 0; // offset = 3

  const next = advanceAfterIntro(state, fixedRandom);

  assert.equal(next.queue.length, 5);
  assert.equal(
    currentSessionCard(next)?.cardId,
    '2',
    'после удаления текущей на её месте следующая'
  );
  assert.equal(next.queue[3]?.cardId, '1', '1 вставлена через 3 позиции');
  assert.equal(next.queue[3]?.needsIntro, false, 'знакомство больше не нужно — теперь вопрос');
});

test('advanceAfterAgain: карточка возвращается через offset позиций, needsIntro не меняется', () => {
  const queue = [
    makeCard({ cardId: '1', needsIntro: false }),
    makeCard({ cardId: '2' }),
    makeCard({ cardId: '3' }),
    makeCard({ cardId: '4' }),
  ];
  const state = startSession(queue);
  const fixedRandom = () => 0.999; // offset = 5, но короче очереди -> хвост

  const next = advanceAfterAgain(state, fixedRandom);

  assert.equal(next.queue.length, 4);
  assert.equal(next.queue[next.queue.length - 1]?.cardId, '1', 'вставка клэмпится в конец очереди');
  assert.equal(next.queue[next.queue.length - 1]?.needsIntro, false);
});

test('advanceAfterKnown: карточка убирается из очереди насовсем', () => {
  const queue = [makeCard({ cardId: '1' }), makeCard({ cardId: '2' }), makeCard({ cardId: '3' })];
  const state = { queue, position: 1 };

  const next = advanceAfterKnown(state);

  assert.equal(next.queue.length, 2);
  assert.deepEqual(
    next.queue.map((c) => c.cardId),
    ['1', '3']
  );
  assert.equal(currentSessionCard(next)?.cardId, '3', 'на месте убранной — следующая');
});
