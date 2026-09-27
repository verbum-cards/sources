import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DEBUG_WORDS } from '../../../src/mocks/fsrs-debug-words';
import {
  buildUserProfileDraft,
  FIRST_SESSION_SIZE,
  getFirstSessionWords,
  isFirstSessionFinished,
  mapDailyMinutesToNewPerDay,
  SKIPPED_GOALS,
  toggleGoal,
} from '../../../src/screens/onboarding/onboarding-logic';

test('getFirstSessionWords: ровно FIRST_SESSION_SIZE слов, первые из общего набора', () => {
  const words = getFirstSessionWords();
  assert.equal(words.length, FIRST_SESSION_SIZE);
  assert.deepEqual(
    words.map((w) => w.itemId),
    DEBUG_WORDS.slice(0, FIRST_SESSION_SIZE).map((w) => w.itemId)
  );
});

test('isFirstSessionFinished: false пока индекс меньше общего числа слов, true на границе и после', () => {
  const total = 5;
  assert.equal(isFirstSessionFinished(0, total), false);
  assert.equal(isFirstSessionFinished(4, total), false);
  assert.equal(isFirstSessionFinished(5, total), true);
  assert.equal(isFirstSessionFinished(6, total), true);
});

test('toggleGoal: добавляет отсутствующую цель и убирает уже выбранную', () => {
  assert.deepEqual(toggleGoal([], 'travel'), ['travel']);
  assert.deepEqual(toggleGoal(['travel'], 'work'), ['travel', 'work']);
  assert.deepEqual(toggleGoal(['travel', 'work'], 'travel'), ['work']);
});

test('SKIPPED_GOALS: «Пропустить» на шаге цели равнозначно выбору «для себя»', () => {
  assert.deepEqual(SKIPPED_GOALS, ['self']);
});

test('mapDailyMinutesToNewPerDay: 5/10/15 минут в день -> то же число новых карточек', () => {
  assert.equal(mapDailyMinutesToNewPerDay(5), 5);
  assert.equal(mapDailyMinutesToNewPerDay(10), 10);
  assert.equal(mapDailyMinutesToNewPerDay(15), 15);
});

test('buildUserProfileDraft: собирает полный профиль из ответов онбординга', () => {
  const profile = buildUserProfileDraft(
    'user-1',
    { goals: ['work', 'exam'], level: 'B1', dailyMinutes: 10 },
    '2026-01-01T00:00:00.000Z'
  );

  assert.deepEqual(profile, {
    userId: 'user-1',
    nativeLang: 'ru',
    targetLang: 'en',
    level: 'B1',
    goals: ['work', 'exam'],
    dailyMinutes: 10,
    newPerDay: 10,
    waitlistLangs: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    fieldRevisions: {},
  });
});
