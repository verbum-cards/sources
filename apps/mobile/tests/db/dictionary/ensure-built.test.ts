import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { DICTIONARY_SCHEMA_VERSION } from '@cards/contracts';

import { ensureDictionaryPackageBuilt } from '../../../src/db/entities/dictionary/ensure-built';
import { createNodeSqliteExecutor } from '../../support/node-sqlite-executor';

async function setupDb() {
  const db = new DatabaseSync(':memory:');

  return { db: createNodeSqliteExecutor(db) };
}

test('ensureDictionaryPackageBuilt: чистый файл — собирает и сеет пакет', async () => {
  const { db } = await setupDb();

  await ensureDictionaryPackageBuilt(db);

  const version = await db.get<{ user_version: number }>('PRAGMA user_version');
  assert.equal(version?.user_version, DICTIONARY_SCHEMA_VERSION);

  const senseCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM sense');
  assert.ok((senseCount?.count ?? 0) > 0);
});

test('ensureDictionaryPackageBuilt: повторный вызов без изменений в моках — не трогает пакет', async () => {
  const { db } = await setupDb();

  await ensureDictionaryPackageBuilt(db);
  const builtAtFirst = await db.get<{ value: string }>(
    "SELECT value FROM pack_meta WHERE key = 'built_at'"
  );

  await ensureDictionaryPackageBuilt(db);
  const builtAtSecond = await db.get<{ value: string }>(
    "SELECT value FROM pack_meta WHERE key = 'built_at'"
  );

  assert.equal(builtAtSecond?.value, builtAtFirst?.value);
});

test('ensureDictionaryPackageBuilt: устаревший seed_source_hash — пересобирает пакет заново, без дублей', async () => {
  const { db } = await setupDb();

  await ensureDictionaryPackageBuilt(db);
  await db.run("UPDATE pack_meta SET value = 'stale-hash' WHERE key = 'seed_source_hash'");

  await ensureDictionaryPackageBuilt(db);

  const hashRow = await db.get<{ value: string }>(
    "SELECT value FROM pack_meta WHERE key = 'seed_source_hash'"
  );
  assert.notEqual(hashRow?.value, 'stale-hash');

  const menuRows = await db.all('SELECT id FROM lexeme WHERE lemma = ?', ['menu']);
  assert.equal(menuRows.length, 1, 'пересборка не должна дублировать строки');
});

test('ensureDictionaryPackageBuilt: пакет собран старой схемой (user_version не совпадает) — пересобирает', async () => {
  const { db } = await setupDb();

  await ensureDictionaryPackageBuilt(db);
  await db.execRaw('PRAGMA user_version = 1');

  await ensureDictionaryPackageBuilt(db);

  const version = await db.get<{ user_version: number }>('PRAGMA user_version');
  assert.equal(version?.user_version, DICTIONARY_SCHEMA_VERSION);
});
