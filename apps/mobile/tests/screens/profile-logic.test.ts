import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { getOrCreateLocalUserId } from '../../src/db/entities/user/app-meta';
import { saveUserProfile } from '../../src/db/entities/user/user-profile';
import { migrate } from '../../src/db/migrate';
import {
  loadCurrentUserProfile,
  updateProfileDailyMinutes,
  updateProfileGoals,
  updateProfileLevel,
  updateProfileName,
} from '../../src/screens/profile/profile-logic';
import { createNodeSqliteExecutor } from '../support/node-sqlite-executor';

async function setupDbWithProfile() {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await migrate(executor);
  const userId = await getOrCreateLocalUserId(executor);

  await saveUserProfile(executor, {
    userId,
    name: null,
    nativeLang: 'ru',
    targetLang: 'en',
    level: 'B1',
    goals: ['travel', 'work'],
    dailyMinutes: 10,
    newPerDay: 10,
    waitlistLangs: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    fieldRevisions: {},
  });

  return { db: executor, userId };
}

test('loadCurrentUserProfile: undefined, пока онбординг не пройден', async () => {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await migrate(executor);

  assert.equal(await loadCurrentUserProfile(executor), undefined);
});

test('loadCurrentUserProfile: возвращает профиль после saveUserProfile', async () => {
  const { db, userId } = await setupDbWithProfile();

  const profile = await loadCurrentUserProfile(db);
  assert.equal(profile?.userId, userId);
  assert.equal(profile?.level, 'B1');
  assert.deepEqual(profile?.goals, ['travel', 'work']);
  assert.equal(profile?.dailyMinutes, 10);
});

test('updateProfileLevel: меняет только level, остальные поля не трогает', async () => {
  const { db } = await setupDbWithProfile();

  await updateProfileLevel(db, 'C1', new Date('2026-02-01T00:00:00.000Z'));

  const profile = await loadCurrentUserProfile(db);
  assert.equal(profile?.level, 'C1');
  assert.deepEqual(profile?.goals, ['travel', 'work']);
  assert.equal(profile?.dailyMinutes, 10);
  assert.equal(profile?.updatedAt, '2026-02-01T00:00:00.000Z');
});

test('updateProfileLevel: "не знаю" — валидный UserLevel', async () => {
  const { db } = await setupDbWithProfile();

  await updateProfileLevel(db, 'unknown');

  const profile = await loadCurrentUserProfile(db);
  assert.equal(profile?.level, 'unknown');
});

test('updateProfileLevel: "A0" (Первые шаги, ниже A1) — валидный UserLevel', async () => {
  const { db } = await setupDbWithProfile();

  await updateProfileLevel(db, 'A0');

  const profile = await loadCurrentUserProfile(db);
  assert.equal(profile?.level, 'A0');
});

test('updateProfileGoals: меняет только goals, остальные поля не трогает', async () => {
  const { db } = await setupDbWithProfile();

  await updateProfileGoals(db, ['games', 'tech']);

  const profile = await loadCurrentUserProfile(db);
  assert.deepEqual(profile?.goals, ['games', 'tech']);
  assert.equal(profile?.level, 'B1');
  assert.equal(profile?.dailyMinutes, 10);
});

test('updateProfileName: сохраняет имя, остальные поля не трогает', async () => {
  const { db } = await setupDbWithProfile();

  await updateProfileName(db, 'Александр', new Date('2026-02-01T00:00:00.000Z'));

  const profile = await loadCurrentUserProfile(db);
  assert.equal(profile?.name, 'Александр');
  assert.equal(profile?.level, 'B1');
  assert.deepEqual(profile?.goals, ['travel', 'work']);
  assert.equal(profile?.updatedAt, '2026-02-01T00:00:00.000Z');
});

test('updateProfileName: обрезает пробелы по краям', async () => {
  const { db } = await setupDbWithProfile();

  await updateProfileName(db, '  Александр  ');

  const profile = await loadCurrentUserProfile(db);
  assert.equal(profile?.name, 'Александр');
});

test('updateProfileName: пустая строка (после обрезки пробелов) сохраняется как null', async () => {
  const { db } = await setupDbWithProfile();

  await updateProfileName(db, '   ');

  const profile = await loadCurrentUserProfile(db);
  assert.equal(profile?.name, null);
});

test('updateProfileDailyMinutes: меняет dailyMinutes и newPerDay вместе', async () => {
  const { db } = await setupDbWithProfile();

  await updateProfileDailyMinutes(db, 15);

  const profile = await loadCurrentUserProfile(db);
  assert.equal(profile?.dailyMinutes, 15);
  assert.equal(profile?.newPerDay, 15);
  assert.equal(profile?.level, 'B1');
  assert.deepEqual(profile?.goals, ['travel', 'work']);
});

test('updateProfileLevel: бросает ошибку, если user_profile ещё не создан', async () => {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await migrate(executor);

  await assert.rejects(() => updateProfileLevel(executor, 'A1'));
});
