import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { DICTIONARY_SCHEMA_VERSION } from '@cards/contracts';
import { createEmptyDictionaryPackage } from '../../../src/db/entities/dictionary/build';
import { createNodeSqliteExecutor } from '../../support/node-sqlite-executor';
import { tempDbPath } from '../../support/tmp-db';

test('пустой пакет словаря: journal_mode не WAL, pack_meta.schema_version совпадает с DICTIONARY_SCHEMA_VERSION', async () => {
  // Файловая база: :memory: всегда отвечает journal_mode = 'memory', это не
  // проверяет реальное поведение собранного пакета.
  const path = tempDbPath('dictionary-en-ru.db');
  const db = new DatabaseSync(path);
  const executor = createNodeSqliteExecutor(db);

  await createEmptyDictionaryPackage(executor, { lang: 'en', nativeLang: 'ru', builtAt: '2026-01-01T00:00:00.000Z' });

  const journalMode = await executor.get<{ journal_mode: string }>('PRAGMA journal_mode');
  assert.equal(journalMode?.journal_mode, 'delete');

  const userVersion = await executor.get<{ user_version: number }>('PRAGMA user_version');
  assert.equal(userVersion?.user_version, DICTIONARY_SCHEMA_VERSION);

  const schemaVersionRow = await executor.get<{ value: string }>("SELECT value FROM pack_meta WHERE key = 'schema_version'");
  assert.equal(schemaVersionRow?.value, String(DICTIONARY_SCHEMA_VERSION));

  const tables = await executor.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
  const tableNames = tables.map((t) => t.name);
  for (const expected of ['lexeme', 'sense', 'expression', 'translation', 'example', 'search_term', 'deck', 'deck_item', 'pack_meta']) {
    assert.ok(tableNames.includes(expected), `таблица ${expected} отсутствует в пакете`);
  }
});
