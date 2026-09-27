import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { getOrCreateLocalUserId } from '../../../src/db/entities/user/app-meta';
import {
  getUserProfile,
  hasCompletedOnboarding,
  saveUserProfile,
} from '../../../src/db/entities/user/user-profile';
import { migrate } from '../../../src/db/migrate';
import { createNodeSqliteExecutor } from '../../support/node-sqlite-executor';

async function setupDb() {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await migrate(executor);

  return executor;
}

test('hasCompletedOnboarding: false, пока нет строки user_profile; true после saveUserProfile', async () => {
  const db = await setupDb();

  assert.equal(await hasCompletedOnboarding(db), false);

  const userId = await getOrCreateLocalUserId(db);
  await saveUserProfile(db, {
    userId,
    nativeLang: 'ru',
    targetLang: 'en',
    level: 'unknown',
    goals: ['self'],
    dailyMinutes: 10,
    newPerDay: 10,
    waitlistLangs: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    fieldRevisions: {},
  });

  assert.equal(await hasCompletedOnboarding(db), true);
});

test('getOrCreateLocalUserId: возвращает один и тот же id при повторных вызовах', async () => {
  const db = await setupDb();
  const first = await getOrCreateLocalUserId(db);
  const second = await getOrCreateLocalUserId(db);
  assert.equal(first, second);
});

test('saveUserProfile + getUserProfile: круговой обход сохраняет все поля', async () => {
  const db = await setupDb();
  const userId = await getOrCreateLocalUserId(db);

  await saveUserProfile(db, {
    userId,
    nativeLang: 'ru',
    targetLang: 'en',
    level: 'B1',
    goals: ['travel', 'work'],
    dailyMinutes: 15,
    newPerDay: 15,
    waitlistLangs: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    fieldRevisions: {},
  });

  const profile = await getUserProfile(db, userId);
  assert.deepEqual(profile, {
    userId,
    nativeLang: 'ru',
    targetLang: 'en',
    level: 'B1',
    goals: ['travel', 'work'],
    dailyMinutes: 15,
    newPerDay: 15,
    waitlistLangs: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    fieldRevisions: {},
  });
});

test('saveUserProfile: повторный вызов апсертит, а не создаёт вторую строку', async () => {
  const db = await setupDb();
  const userId = await getOrCreateLocalUserId(db);

  await saveUserProfile(db, {
    userId,
    nativeLang: 'ru',
    targetLang: 'en',
    level: 'unknown',
    goals: [],
    dailyMinutes: 5,
    newPerDay: 5,
    waitlistLangs: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    fieldRevisions: {},
  });
  await saveUserProfile(db, {
    userId,
    nativeLang: 'ru',
    targetLang: 'en',
    level: 'B2',
    goals: ['exam'],
    dailyMinutes: 15,
    newPerDay: 15,
    waitlistLangs: [],
    updatedAt: '2026-01-02T00:00:00.000Z',
    fieldRevisions: {},
  });

  const rows = await db.all('SELECT * FROM user_profile');
  assert.equal(rows.length, 1);

  const profile = await getUserProfile(db, userId);
  assert.equal(profile?.level, 'B2');
  assert.deepEqual(profile?.goals, ['exam']);
});
