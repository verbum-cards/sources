import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { USER_DB_PRAGMAS } from '../../src/db/entities/user/user.config';
import { getUserVersion, migrate } from '../../src/db/migrate';
import type { Migration } from '../../src/db/migrate';
import { LATEST_VERSION, migrations } from '../../src/db/migrations';
import { m001 } from '../../src/db/migrations/001_init';
import { createNodeSqliteExecutor } from '../support/node-sqlite-executor';
import { dumpSchema, formatSchemaDump } from '../support/schema-dump';
import { tempDbPath } from '../support/tmp-db';

const SNAPSHOT_PATH = join(__dirname, '..', '__snapshots__', 'user-db-v5.txt');

test('чистая установка: user_version 0 -> LATEST, схема совпадает со снимком', async () => {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);

  assert.equal(await getUserVersion(executor), 0);
  await migrate(executor);
  assert.equal(await getUserVersion(executor), LATEST_VERSION);

  const actual = formatSchemaDump(dumpSchema(db));
  if (process.env.UPDATE_SNAPSHOTS === '1') {
    writeFileSync(SNAPSHOT_PATH, actual);

    return;
  }
  const expected = readFileSync(SNAPSHOT_PATH, 'utf8');
  assert.equal(actual, expected);
});

test('идемпотентность: повторный migrate на актуальной базе не падает и ничего не меняет', async () => {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await migrate(executor);
  const before = formatSchemaDump(dumpSchema(db));

  await assert.doesNotReject(() => migrate(executor));

  assert.equal(await getUserVersion(executor), LATEST_VERSION);
  assert.equal(formatSchemaDump(dumpSchema(db)), before);
});

test('обновление (механизм): база версии N-1 с данными -> миграции применяются, данные сохраняются', async () => {
  // Синтетический список — проверяет сам механизм upgrade независимо от того,
  // что делают реальные миграции приложения (это отдельно проверяет тест
  // "обновление 001 -> 002" ниже, на настоящей второй миграции).
  const testMigrations: Migration[] = [
    { version: 1, statements: ['CREATE TABLE widget (id TEXT PRIMARY KEY, name TEXT NOT NULL)'] },
    { version: 2, statements: ['ALTER TABLE widget ADD COLUMN note TEXT'] },
  ];

  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);

  // Собираем базу версии N-1 (=1) и наливаем данные.
  await migrate(executor, [testMigrations[0]]);
  await executor.run('INSERT INTO widget (id, name) VALUES (?, ?)', ['w1', 'Hello']);

  // Применяем миграции целиком (как при обновлении приложения).
  await migrate(executor, testMigrations);

  assert.equal(await getUserVersion(executor), 2);
  const row = await executor.get<{ id: string; name: string; note: string | null }>(
    'SELECT * FROM widget WHERE id = ?',
    ['w1']
  );
  assert.deepEqual({ ...row }, { id: 'w1', name: 'Hello', note: null });
});

test('обновление 001 -> 002: state -> status, merged_into_card_id, FK-дети сохранены', async () => {
  // Файловая база с реальными USER_DB_PRAGMAS (foreign_keys=ON) — именно этот
  // сценарий закаскадировал бы card_content/card_schedule без disableForeignKeys.
  const path = tempDbPath('cards-user-upgrade.db');
  const db = new DatabaseSync(path);
  const executor = createNodeSqliteExecutor(db);
  for (const pragma of USER_DB_PRAGMAS) {
    await executor.execRaw(pragma);
  }

  await migrate(executor, [m001]);
  await executor.run(
    'INSERT INTO card (id, user_id, item_type, item_id, state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['c1', 'u1', 'sense', 'i1', 'review', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z']
  );
  await executor.run(
    'INSERT INTO card (id, user_id, item_type, item_id, state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['c2', 'u1', 'sense', 'i2', 'suspended', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z']
  );
  await executor.run(
    'INSERT INTO card (id, user_id, item_type, item_id, state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['c3', 'u1', 'sense', 'i3', 'known', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z']
  );
  await executor.run(
    'INSERT INTO card_content (card_id, lemma, translation, source, refreshed_at) VALUES (?, ?, ?, ?, ?)',
    ['c1', 'wander', 'бродить', 'pack', '2026-01-01T00:00:00.000Z']
  );
  await executor.run('INSERT INTO card_schedule (card_id, due) VALUES (?, ?)', [
    'c1',
    '2026-01-02T00:00:00.000Z',
  ]);

  await migrate(executor, migrations);

  assert.equal(await getUserVersion(executor), LATEST_VERSION);

  const rows = await executor.all<{
    id: string;
    status: string;
    merged_into_card_id: string | null;
  }>('SELECT id, status, merged_into_card_id FROM card ORDER BY id');
  assert.deepEqual(
    rows.map((r) => ({ ...r })),
    [
      { id: 'c1', status: 'active', merged_into_card_id: null }, // 'review' -> 'active'
      { id: 'c2', status: 'suspended', merged_into_card_id: null },
      { id: 'c3', status: 'known', merged_into_card_id: null },
    ]
  );

  // Доказательство, что disableForeignKeys действительно защитил детей от каскада.
  const content = await executor.all('SELECT * FROM card_content WHERE card_id = ?', ['c1']);
  const schedule = await executor.all('SELECT * FROM card_schedule WHERE card_id = ?', ['c1']);
  assert.equal(content.length, 1);
  assert.equal(schedule.length, 1);

  const fkCheck = await executor.all('PRAGMA foreign_key_check');
  assert.equal(fkCheck.length, 0);

  const fk = await executor.get<{ foreign_keys: number }>('PRAGMA foreign_keys');
  assert.equal(fk?.foreign_keys, 1); // восстановлено после миграции

  // ALTER TABLE ... RENAME TO card должен был сохранить FK-текст детей нетронутым.
  const childDdl = await executor.all<{ name: string; sql: string }>(
    "SELECT name, sql FROM sqlite_master WHERE name IN ('card_content', 'card_schedule')"
  );
  for (const child of childDdl) {
    assert.match(child.sql, /REFERENCES card \(id\)/);
    assert.doesNotMatch(child.sql, /card_new/);
  }
});

test('ошибка миграции: rollback, user_version не меняется, частичных таблиц нет', async () => {
  const brokenMigrations: Migration[] = [
    {
      version: 1,
      statements: [
        'CREATE TABLE will_be_rolled_back (id TEXT PRIMARY KEY)',
        'THIS IS NOT VALID SQL',
      ],
    },
  ];

  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);

  await assert.rejects(() => migrate(executor, brokenMigrations));
  assert.equal(await getUserVersion(executor), 0);

  const tables = await executor.all<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'will_be_rolled_back'"
  );
  assert.equal(tables.length, 0);
});

test('ограничения: CHECK по item_type/status/rating соблюдаются', async () => {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await migrate(executor);

  await assert.rejects(() =>
    executor.run(
      'INSERT INTO card (id, user_id, item_type, item_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        'c1',
        'u1',
        'not-a-real-type',
        'i1',
        'active',
        '2026-01-01T00:00:00.000Z',
        '2026-01-01T00:00:00.000Z',
      ]
    )
  );

  await assert.rejects(() =>
    executor.run(
      'INSERT INTO card (id, user_id, item_type, item_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        'c1',
        'u1',
        'sense',
        'i1',
        'not-a-real-status',
        '2026-01-01T00:00:00.000Z',
        '2026-01-01T00:00:00.000Z',
      ]
    )
  );

  await assert.rejects(() =>
    executor.run(
      'INSERT INTO review_log (id, card_id, user_id, rating, reviewed_at, elapsed_ms, device_id, tz_offset_min) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['r1', 'c1', 'u1', 'not-a-real-rating', '2026-01-01T00:00:00.000Z', 1000, 'd1', 180]
    )
  );
});

test('ограничения: foreign_keys включены, каскад чистит card_content/card_schedule', async () => {
  const path = tempDbPath('cards-user-constraints.db');
  const db = new DatabaseSync(path);
  const executor = createNodeSqliteExecutor(db);
  for (const pragma of USER_DB_PRAGMAS) {
    await executor.execRaw(pragma);
  }
  await migrate(executor);

  const fk = await executor.get<{ foreign_keys: number }>('PRAGMA foreign_keys');
  assert.equal(fk?.foreign_keys, 1);

  await executor.run(
    'INSERT INTO card (id, user_id, item_type, item_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['c1', 'u1', 'sense', 'i1', 'active', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z']
  );
  await executor.run(
    'INSERT INTO card_content (card_id, lemma, translation, source, refreshed_at) VALUES (?, ?, ?, ?, ?)',
    ['c1', 'wander', 'бродить', 'pack', '2026-01-01T00:00:00.000Z']
  );
  await executor.run('INSERT INTO card_schedule (card_id, due) VALUES (?, ?)', [
    'c1',
    '2026-01-02T00:00:00.000Z',
  ]);

  await executor.run('DELETE FROM card WHERE id = ?', ['c1']);

  const content = await executor.all('SELECT * FROM card_content WHERE card_id = ?', ['c1']);
  const schedule = await executor.all('SELECT * FROM card_schedule WHERE card_id = ?', ['c1']);
  assert.equal(content.length, 0);
  assert.equal(schedule.length, 0);
});
