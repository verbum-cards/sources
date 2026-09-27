import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { Rating as FsrsRating } from 'ts-fsrs';

import type { CardScheduleRow } from '../../src/db/entities/user/types';
import { migrate } from '../../src/db/migrate';
import { BUTTON_TO_GRADE, GRADE_TO_RATING, RATING_TO_GRADE } from '../../src/scheduler/ratings';
import { applyRating, getReviewLogs, recalculateSchedule } from '../../src/scheduler/scheduler';
import { createNodeSqliteExecutor } from '../support/node-sqlite-executor';

const USER_ID = 'u1';
const DEVICE_ID = 'device-1';
const CARD_ID = 'card-1';

async function setupDb() {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await migrate(executor);
  await executor.run(
    'INSERT INTO card (id, user_id, item_type, item_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      CARD_ID,
      USER_ID,
      'sense',
      'item-1',
      'active',
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    ]
  );
  return executor;
}

test('маппинг кнопок в оценки FSRS (дефолтный 2-кнопочный режим)', () => {
  assert.equal(BUTTON_TO_GRADE.again, FsrsRating.Again);
  assert.equal(BUTTON_TO_GRADE.good, FsrsRating.Good);
  assert.equal(GRADE_TO_RATING[FsrsRating.Again], 'again');
  assert.equal(GRADE_TO_RATING[FsrsRating.Good], 'good');
  // Обратное соответствие для пересчёта из журнала (там могут быть все 4 оценки).
  assert.equal(RATING_TO_GRADE.again, FsrsRating.Again);
  assert.equal(RATING_TO_GRADE.hard, FsrsRating.Hard);
  assert.equal(RATING_TO_GRADE.good, FsrsRating.Good);
  assert.equal(RATING_TO_GRADE.easy, FsrsRating.Easy);
});

test('новая карточка -> Again -> Good: due после Good позже, чем после Again', async () => {
  const db = await setupDb();

  const afterAgain = await applyRating({
    db,
    cardId: CARD_ID,
    userId: USER_ID,
    deviceId: DEVICE_ID,
    rating: 'again',
    now: new Date('2026-01-01T10:00:00.000Z'),
  });
  assert.equal(afterAgain.reviewLog.rating, 'again');

  const afterGood = await applyRating({
    db,
    cardId: CARD_ID,
    userId: USER_ID,
    deviceId: DEVICE_ID,
    rating: 'good',
    now: new Date('2026-01-01T10:05:00.000Z'),
  });
  assert.equal(afterGood.reviewLog.rating, 'good');
  assert.ok(
    new Date(afterGood.schedule.due!).getTime() > new Date(afterAgain.schedule.due!).getTime(),
    'due после "Помню" должно быть позже, чем due после "Не помню"'
  );
  assert.ok(
    new Date(afterGood.schedule.due!).getTime() > new Date('2026-01-01T10:05:00.000Z').getTime(),
    'следующее due должно быть в будущем относительно момента ответа'
  );

  const logs = await getReviewLogs(db, CARD_ID);
  assert.equal(logs.length, 2);
  assert.deepEqual(
    logs.map((l) => l.rating),
    ['again', 'good']
  );
});

test('пересчёт из журнала даёт то же состояние, что пошаговое applyRating', async () => {
  const db = await setupDb();

  const steps: { rating: 'again' | 'good'; now: Date }[] = [
    { rating: 'again', now: new Date('2026-01-01T10:00:00.000Z') },
    { rating: 'good', now: new Date('2026-01-01T10:05:00.000Z') },
    { rating: 'good', now: new Date('2026-01-03T09:00:00.000Z') },
    { rating: 'again', now: new Date('2026-01-10T09:00:00.000Z') },
    { rating: 'good', now: new Date('2026-01-10T09:02:00.000Z') },
  ];

  let last: CardScheduleRow | undefined;
  for (const step of steps) {
    const result = await applyRating({
      db,
      cardId: CARD_ID,
      userId: USER_ID,
      deviceId: DEVICE_ID,
      ...step,
    });
    last = result.schedule;
  }

  const logs = await getReviewLogs(db, CARD_ID);
  assert.equal(logs.length, steps.length);

  const recalculated = recalculateSchedule(logs);
  assert.ok(recalculated, 'пересчёт не должен вернуть null при непустом журнале');
  assert.ok(last);

  assert.equal(recalculated.due.toISOString(), last.due);
  assert.equal(recalculated.stability, last.stability);
  assert.equal(recalculated.difficulty, last.difficulty);
  assert.equal(recalculated.reps, last.reps);
  assert.equal(recalculated.lapses, last.lapses);
  assert.equal(recalculated.state, last.fsrs_state);
  assert.equal(recalculated.scheduled_days, last.scheduled_days);
});

test('пересчёт из пустого журнала возвращает null', () => {
  assert.equal(recalculateSchedule([]), null);
});
