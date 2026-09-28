import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { getOrCreateLocalUserId } from '../../../src/db/entities/user/app-meta';
import { loadUserDeckIds, saveUserDeck } from '../../../src/db/entities/user/user-deck';
import { migrate } from '../../../src/db/migrate';
import { createNodeSqliteExecutor } from '../../support/node-sqlite-executor';

async function setupDb() {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await migrate(executor);
  const userId = await getOrCreateLocalUserId(executor);

  return { db: executor, userId };
}

const DECK_ID = '0195d000-0000-7000-8000-000000000001';

test('loadUserDeckIds: пусто, пока ни одна колода не добавлена', async () => {
  const { db } = await setupDb();

  assert.deepEqual(await loadUserDeckIds(db, 'any-user'), new Set());
});

test('saveUserDeck: колода появляется в loadUserDeckIds', async () => {
  const { db, userId } = await setupDb();

  await saveUserDeck(db, {
    userId,
    deckId: DECK_ID,
    addedAt: '2026-01-01T00:00:00.000Z',
    fastMode: false,
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    fieldRevisions: {},
  });

  assert.deepEqual(await loadUserDeckIds(db, userId), new Set([DECK_ID]));
});

test('saveUserDeck: повторный вызов апсертит ту же строку, а не дублирует', async () => {
  const { db, userId } = await setupDb();
  const base = {
    userId,
    deckId: DECK_ID,
    fastMode: false,
    deletedAt: null,
    fieldRevisions: {},
  };

  await saveUserDeck(db, {
    ...base,
    addedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
  await saveUserDeck(db, {
    ...base,
    addedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  });

  const rows = await db.all('SELECT * FROM user_deck WHERE user_id = ?', [userId]);
  assert.equal(rows.length, 1);

  const row = await db.get<{ updated_at: string }>(
    'SELECT updated_at FROM user_deck WHERE user_id = ? AND deck_id = ?',
    [userId, DECK_ID]
  );
  assert.equal(row?.updated_at, '2026-01-02T00:00:00.000Z');
});

test('saveUserDeck: deletedAt скрывает колоду из loadUserDeckIds, а null-апсерт «воскрешает»', async () => {
  const { db, userId } = await setupDb();
  const base = { userId, deckId: DECK_ID, fastMode: false, fieldRevisions: {} };

  await saveUserDeck(db, {
    ...base,
    addedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
  });
  await saveUserDeck(db, {
    ...base,
    addedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    deletedAt: '2026-01-02T00:00:00.000Z',
  });
  assert.deepEqual(await loadUserDeckIds(db, userId), new Set());

  await saveUserDeck(db, {
    ...base,
    addedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
    deletedAt: null,
  });
  assert.deepEqual(await loadUserDeckIds(db, userId), new Set([DECK_ID]));
});
