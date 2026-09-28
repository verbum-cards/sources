import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import {
  getOrCreateDeviceId,
  getOrCreateLocalUserId,
  markOnboardingCompleted,
} from '../../src/db/entities/user/app-meta';
import { migrate } from '../../src/db/migrate';
import { applyRating } from '../../src/scheduler/scheduler';
import {
  computeStreakDays,
  countCardsCreatedToday,
  countUserCards,
  loadCardCreationDates,
  loadHomeStats,
  loadOnboardingCompletedAt,
  loadRecentCards,
  shouldPromptForReminders,
} from '../../src/screens/home/home-logic';
import { addManualWord } from '../../src/screens/word-add-logic';
import { createNodeSqliteExecutor } from '../support/node-sqlite-executor';

// created_at всегда пишется как new Date().toISOString() от локального
// момента (см. addManualWord и т.д.) — конструируем тестовые фикстуры так же,
// через локальные компоненты даты, а не литералы с суффиксом Z: иначе тест
// зависит от часового пояса машины, на которой запущен (день по UTC и день
// по местному времени — не одно и то же около полуночи).
function localIso(year: number, month: number, day: number, hour = 12): string {
  return new Date(year, month, day, hour).toISOString();
}

async function setupDb() {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await migrate(executor);
  const userId = await getOrCreateLocalUserId(executor);
  const deviceId = await getOrCreateDeviceId(executor);

  return { db: executor, userId, deviceId };
}

test('countUserCards и loadRecentCards: 0, пока карточек нет', async () => {
  const { db } = await setupDb();

  assert.equal(await countUserCards(db), 0);
  assert.deepEqual(await loadRecentCards(db), []);
});

test('loadRecentCards: отдаёт example/exampleTranslation — нужны карточке обучения по тапу на слово', async () => {
  const { db } = await setupDb();

  await addManualWord({
    db,
    lemma: 'serendipity',
    translation: 'счастливая случайность',
    example: 'It was pure serendipity.',
  });

  const [card] = await loadRecentCards(db);
  assert.equal(card?.example, 'It was pure serendipity.');
  assert.equal(card?.exampleTranslation, null);
});

test('loadHomeStats: known -> learned, активная без ревью -> queued, после applyRating выходит из queued', async () => {
  const { db, userId, deviceId } = await setupDb();

  const knownCardId = await addManualWord({ db, lemma: 'wander', translation: 'бродить' });
  await db.run("UPDATE card SET status = 'known' WHERE id = ?", [knownCardId]);

  const queuedCardId = await addManualWord({ db, lemma: 'fierce', translation: 'свирепый' });

  assert.deepEqual(await loadHomeStats(db), { learned: 1, queued: 1 });

  await applyRating({ db, cardId: queuedCardId, userId, deviceId, rating: 'again' });

  assert.deepEqual(await loadHomeStats(db), { learned: 1, queued: 0 });
});

test('countCardsCreatedToday: считает только сегодняшние даты', () => {
  const now = new Date(2026, 2, 10, 12);
  const dates = [localIso(2026, 2, 10, 8), localIso(2026, 2, 10, 23), localIso(2026, 2, 9, 12)];

  assert.equal(countCardsCreatedToday(dates, now), 2);
});

test('countCardsCreatedToday: 0 для пустого списка', () => {
  assert.equal(countCardsCreatedToday([], new Date()), 0);
});

test('computeStreakDays: 0 для пустого списка', () => {
  assert.equal(computeStreakDays([], new Date(2026, 2, 10, 12)), 0);
});

test('computeStreakDays: сегодня + вчера + позавчера подряд -> 3', () => {
  const now = new Date(2026, 2, 10, 12);
  const dates = [localIso(2026, 2, 10, 8), localIso(2026, 2, 9, 8), localIso(2026, 2, 8, 8)];

  assert.equal(computeStreakDays(dates, now), 3);
});

test('computeStreakDays: разрыв (нет вчера) обрывает серию на сегодняшнем дне', () => {
  const now = new Date(2026, 2, 10, 12);
  const dates = [localIso(2026, 2, 10, 8), localIso(2026, 2, 8, 8)];

  assert.equal(computeStreakDays(dates, now), 1);
});

test('computeStreakDays: сегодня ещё ничего нет, но вчера было -> серия жива до конца дня', () => {
  const now = new Date(2026, 2, 10, 12);
  const dates = [localIso(2026, 2, 9, 8), localIso(2026, 2, 8, 8)];

  assert.equal(computeStreakDays(dates, now), 2);
});

test('computeStreakDays: ни сегодня, ни вчера -> 0', () => {
  const now = new Date(2026, 2, 10, 12);
  const dates = [localIso(2026, 2, 5, 8)];

  assert.equal(computeStreakDays(dates, now), 0);
});

test('loadCardCreationDates: отдаёт created_at всех живых карточек пользователя', async () => {
  const { db } = await setupDb();
  await addManualWord({ db, lemma: 'wander', translation: 'бродить' });
  await addManualWord({ db, lemma: 'fierce', translation: 'свирепый' });

  const dates = await loadCardCreationDates(db);
  assert.equal(dates.length, 2);
});

test('loadOnboardingCompletedAt: null, пока онбординг не завершён', async () => {
  const { db } = await setupDb();

  assert.equal(await loadOnboardingCompletedAt(db), null);
});

test('loadOnboardingCompletedAt: отдаёт значение после markOnboardingCompleted', async () => {
  const { db } = await setupDb();
  const now = new Date(2026, 2, 1, 10);

  await markOnboardingCompleted(db, now);

  assert.equal(await loadOnboardingCompletedAt(db), now.toISOString());
});

test('shouldPromptForReminders: false, если онбординг ещё не завершён', () => {
  assert.equal(shouldPromptForReminders(null, new Date(2026, 2, 10, 12)), false);
});

test('shouldPromptForReminders: false, пока не прошёл настроенный интервал (тот же день)', () => {
  const completedAt = localIso(2026, 2, 10, 9);
  const now = new Date(2026, 2, 10, 23);

  assert.equal(shouldPromptForReminders(completedAt, now, 1), false);
});

test('shouldPromptForReminders: true ровно на границе интервала (полночь, не 24 часа)', () => {
  const completedAt = localIso(2026, 2, 10, 23);
  const now = new Date(2026, 2, 11, 1);

  assert.equal(shouldPromptForReminders(completedAt, now, 1), true);
});

test('shouldPromptForReminders: интервал регулируется параметром delayDays', () => {
  const completedAt = localIso(2026, 2, 10, 8);
  const oneDayLater = new Date(2026, 2, 11, 8);
  const threeDaysLater = new Date(2026, 2, 13, 8);

  assert.equal(shouldPromptForReminders(completedAt, oneDayLater, 3), false);
  assert.equal(shouldPromptForReminders(completedAt, threeDaysLater, 3), true);
});
