import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { createEmptyDictionaryPackage } from '../../src/db/entities/dictionary/build';
import { migrate } from '../../src/db/migrate';
import { createNodeSqliteExecutor } from '../support/node-sqlite-executor';

const USES_INDEX = /USING (COVERING )?INDEX/;

function planText(db: DatabaseSync, sql: string, params: unknown[] = []): string {
  const rows = db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...(params as never[])) as {
    detail: string;
  }[];
  return rows.map((r) => r.detail).join('\n');
}

// Горячий запрос 1 (<=300мс): префикс при вводе слова, в пакете словаря.
test('EXPLAIN QUERY PLAN: префиксный поиск использует индекс search_term', async () => {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await createEmptyDictionaryPackage(executor, {
    lang: 'en',
    nativeLang: 'ru',
    builtAt: '2026-01-01T00:00:00.000Z',
  });

  const plan = planText(
    db,
    'SELECT item_type, item_id FROM search_term WHERE term_norm >= ? AND term_norm < ? ORDER BY rank',
    ['wand', 'wane']
  );
  assert.match(plan, USES_INDEX);
  assert.match(plan, /idx_search_term_lookup/);
});

// Горячий запрос 2 (<=100мс переход): «к повторению сегодня», в пользовательской базе.
test('EXPLAIN QUERY PLAN: подбор карточек к повторению использует индекс card_schedule(due)', async () => {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await migrate(executor);

  const plan = planText(
    db,
    `SELECT c.id, cs.due FROM card_schedule cs JOIN card c ON c.id = cs.card_id
     WHERE cs.due <= ? ORDER BY cs.due`,
    ['2026-01-01T00:00:00.000Z']
  );
  assert.match(plan, USES_INDEX);
  assert.match(plan, /idx_card_schedule_due/);
});

// Горячий запрос 3: подбор новых слов по уровню/цели, в пакете словаря.
test('EXPLAIN QUERY PLAN: подбор новых по CEFR и тегу использует индексы sense', async () => {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await createEmptyDictionaryPackage(executor, {
    lang: 'en',
    nativeLang: 'ru',
    builtAt: '2026-01-01T00:00:00.000Z',
  });

  const byCefr = planText(db, 'SELECT id FROM sense WHERE cefr = ? ORDER BY frequency_rank', [
    'B1',
  ]);
  assert.match(byCefr, USES_INDEX);
  assert.match(byCefr, /idx_sense_cefr_rank/);

  const byTag = planText(db, 'SELECT sense_id FROM sense_tag WHERE tag = ?', ['travel']);
  assert.match(byTag, USES_INDEX);
  assert.match(byTag, /idx_sense_tag_lookup/);
});
