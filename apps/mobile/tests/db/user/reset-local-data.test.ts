import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import {
  getOrCreateDeviceId,
  getOrCreateLocalUserId,
  markOnboardingCompleted,
} from '../../../src/db/entities/user/app-meta';
import { resetLocalData } from '../../../src/db/entities/user/reset-local-data';
import {
  hasCompletedOnboarding,
  saveUserProfile,
} from '../../../src/db/entities/user/user-profile';
import { migrate } from '../../../src/db/migrate';
import { subscribeToChanges } from '../../../src/utilities/event-bus';
import { createNodeSqliteExecutor } from '../../support/node-sqlite-executor';

async function setupDb() {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await migrate(executor);

  return executor;
}

// Наполняет базу так, как будто пользователь прошёл онбординг, добавил
// карточку, повторил её и добавил колоду — чтобы resetLocalData было что чистить
// во всех перечисленных в задаче таблицах.
async function seedFullState(db: Awaited<ReturnType<typeof setupDb>>) {
  const deviceId = await getOrCreateDeviceId(db);
  const userId = await getOrCreateLocalUserId(db);
  const now = '2026-01-01T00:00:00.000Z';

  await markOnboardingCompleted(db, new Date(now));

  await saveUserProfile(db, {
    userId,
    name: null,
    nativeLang: 'ru',
    targetLang: 'en',
    level: 'unknown',
    goals: ['self'],
    dailyMinutes: 10,
    newPerDay: 10,
    waitlistLangs: [],
    updatedAt: now,
    fieldRevisions: {},
  });

  await db.run(
    'INSERT INTO card (id, user_id, item_type, item_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['card-1', userId, 'sense', 'item-1', 'active', now, now]
  );
  await db.run(
    'INSERT INTO card_content (card_id, lemma, translation, source, refreshed_at) VALUES (?, ?, ?, ?, ?)',
    ['card-1', 'wander', 'бродить', 'manual', now]
  );
  await db.run('INSERT INTO card_schedule (card_id, due) VALUES (?, ?)', ['card-1', now]);
  await db.run(
    'INSERT INTO review_log (id, card_id, user_id, rating, reviewed_at, elapsed_ms, device_id, tz_offset_min) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['log-1', 'card-1', userId, 'good', now, 1000, deviceId, 180]
  );
  await db.run(
    'INSERT INTO user_deck (user_id, deck_id, added_at, fast_mode, updated_at) VALUES (?, ?, ?, ?, ?)',
    [userId, 'deck-1', now, 0, now]
  );
  await db.run(
    `INSERT INTO sync_op (op_id, schema_version, entity, entity_id, kind, client_ts, device_id, user_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['op-1', 1, 'card', 'card-1', 'create', now, deviceId, userId, now]
  );

  return { deviceId, userId };
}

test('resetLocalData: очищает все пользовательские таблицы, не трогая device_id', async () => {
  const db = await setupDb();
  const { deviceId } = await seedFullState(db);

  await resetLocalData(db);

  for (const table of [
    'card_content',
    'card_schedule',
    'review_log',
    'card',
    'user_deck',
    'user_profile',
    'sync_op',
  ]) {
    const rows = await db.all(`SELECT * FROM ${table}`);
    assert.equal(rows.length, 0, `таблица ${table} должна быть пустой после resetLocalData`);
  }

  const deviceRow = await db.get<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = 'device_id'"
  );
  assert.equal(deviceRow?.value, deviceId, 'device_id должен остаться прежним');

  const userIdRow = await db.get("SELECT value FROM app_meta WHERE key = 'user_id'");
  const userIdLocalRow = await db.get("SELECT value FROM app_meta WHERE key = 'user_id_is_local'");
  assert.equal(userIdRow, undefined);
  assert.equal(userIdLocalRow, undefined);

  const onboardingCompletedAtRow = await db.get(
    "SELECT value FROM app_meta WHERE key = 'onboarding_completed_at'"
  );
  assert.equal(onboardingCompletedAtRow, undefined);
});

test('resetLocalData: getOrCreateLocalUserId после сброса выдаёт новый userId', async () => {
  const db = await setupDb();
  const { userId: originalUserId } = await seedFullState(db);

  await resetLocalData(db);
  const newUserId = await getOrCreateLocalUserId(db);

  assert.notEqual(newUserId, originalUserId);
});

// Симулирует то, на что реально опирается AppContent в App.tsx (useQuery,
// подписанный на ['user_profile']): подписка + повторное чтение после
// notifyChange — без рендер-инфраструктуры для React эту часть иначе не
// проверить (в проекте нет React Testing Library, см. предыдущие отчёты).
test('реактивность: подписчик на user_profile видит переход онбординга в "не пройден" после сброса', async () => {
  const db = await setupDb();
  await seedFullState(db);

  assert.equal(await hasCompletedOnboarding(db), true);

  let notifiedOnboardingComplete: boolean | undefined;
  const unsubscribe = subscribeToChanges(['user_profile'], () => {
    void (async () => {
      notifiedOnboardingComplete = await hasCompletedOnboarding(db);
    })();
  });

  try {
    await resetLocalData(db);
    // notifyChange вызывает колбэк синхронно, но сам колбэк асинхронный —
    // дожидаемся микрозадачи, в которой resolve'ится hasCompletedOnboarding.
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(notifiedOnboardingComplete, false);
  } finally {
    unsubscribe();
  }
});
