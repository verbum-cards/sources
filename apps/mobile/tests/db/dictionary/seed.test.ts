import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { createEmptyDictionaryPackage } from '../../../src/db/entities/dictionary/build';
import { seedDictionaryPackage } from '../../../src/db/entities/dictionary/seed';
import { DECKS } from '../../../src/mocks/decks';
import { WORDS } from '../../../src/mocks/words';
import { createNodeSqliteExecutor } from '../../support/node-sqlite-executor';

async function setupPack() {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await createEmptyDictionaryPackage(executor, {
    lang: 'en',
    nativeLang: 'ru',
    builtAt: '2026-01-01T00:00:00.000Z',
  });
  await seedDictionaryPackage(executor, '2026-01-02T00:00:00.000Z');

  return { db: executor };
}

test('seedDictionaryPackage: lexeme/sense — по числу sense-слов в WORDS', async () => {
  const { db } = await setupPack();
  const senseWords = WORDS.filter((word) => word.itemType === 'sense');

  const lexemeCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM lexeme');
  const senseCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM sense');
  assert.equal(lexemeCount?.count, senseWords.length);
  assert.equal(senseCount?.count, senseWords.length);
});

test('seedDictionaryPackage: expression — по числу expression-слов в WORDS', async () => {
  const { db } = await setupPack();
  const expressionWords = WORDS.filter((word) => word.itemType === 'expression');

  const expressionCount = await db.get<{ count: number }>(
    'SELECT COUNT(*) as count FROM expression'
  );
  assert.equal(expressionCount?.count, expressionWords.length);
});

test('seedDictionaryPackage: перевод, пример и определение доходят до строк sense-слова', async () => {
  const { db } = await setupPack();
  const word = WORDS.find((w) => w.lemma === 'wander');
  assert.ok(word);

  const sense = await db.get<{ cefr: string; definition: string | null }>(
    'SELECT cefr, definition FROM sense WHERE id = ?',
    [word.itemId]
  );
  assert.equal(sense?.cefr, word.cefr);
  assert.equal(sense?.definition, word.definition);

  const translation = await db.get<{ text: string }>(
    "SELECT text FROM translation WHERE target_type = 'sense' AND target_id = ? AND lang = 'ru'",
    [word.itemId]
  );
  assert.equal(translation?.text, word.translation);

  const examples = await db.all<{ id: string; text: string }>(
    "SELECT id, text FROM example WHERE target_type = 'sense' AND target_id = ? ORDER BY rowid",
    [word.itemId]
  );
  assert.deepEqual(
    examples.map((e) => e.text),
    word.examples.map((e) => e.text)
  );

  const translations = await db.all<{ text: string }>(
    `SELECT et.text FROM example_translation et
     JOIN example ex ON ex.id = et.example_id
     WHERE ex.target_type = 'sense' AND ex.target_id = ? AND et.lang = 'ru'
     ORDER BY ex.rowid`,
    [word.itemId]
  );
  assert.deepEqual(
    translations.map((t) => t.text),
    word.examples.map((e) => e.translation)
  );
});

test('seedDictionaryPackage: goals слова становятся sense_tag', async () => {
  const { db } = await setupPack();
  const word = WORDS.find((w) => w.lemma === 'wander');
  assert.ok(word?.goals);

  const tags = await db.all<{ tag: string }>('SELECT tag FROM sense_tag WHERE sense_id = ?', [
    word.itemId,
  ]);
  // sense_tag не хранит порядок (нет position) — сравниваем как множества.
  assert.deepEqual(new Set(tags.map((t) => t.tag)), new Set(word.goals));
});

test('seedDictionaryPackage: search_term содержит нормализованную лемму каждого слова', async () => {
  const { db } = await setupPack();

  const row = await db.get<{ item_id: string; item_type: string }>(
    "SELECT item_id, item_type FROM search_term WHERE term_norm = 'menu'"
  );
  const menu = WORDS.find((w) => w.lemma === 'menu');
  assert.equal(row?.item_id, menu?.itemId);
  assert.equal(row?.item_type, 'sense');
});

test('seedDictionaryPackage: deck/deck_goal_tag/deck_item — по данным DECKS', async () => {
  const { db } = await setupPack();
  const restaurant = DECKS[0];

  const deckRow = await db.get<{ title: string; type: string }>(
    'SELECT title, type FROM deck WHERE id = ?',
    [restaurant.id]
  );
  assert.equal(deckRow?.title, restaurant.title);
  assert.equal(deckRow?.type, restaurant.type);

  const tags = await db.all<{ tag: string }>('SELECT tag FROM deck_goal_tag WHERE deck_id = ?', [
    restaurant.id,
  ]);
  // deck_goal_tag не хранит порядок (нет position) — сравниваем как множества.
  assert.deepEqual(new Set(tags.map((t) => t.tag)), new Set(restaurant.goalTags));

  const items = await db.all<{ item_id: string; position: number; importance: number }>(
    'SELECT item_id, position, importance FROM deck_item WHERE deck_id = ? ORDER BY position',
    [restaurant.id]
  );
  assert.equal(items.length, restaurant.items.length);
  assert.equal(items[0]?.item_id, restaurant.items[0]?.itemId);
  assert.equal(items[0]?.importance, restaurant.items[0]?.importance);
});

test('seedDictionaryPackage: обновляет pack_meta (content_version, sense_count, built_at)', async () => {
  const { db } = await setupPack();
  const senseWords = WORDS.filter((word) => word.itemType === 'sense');

  const meta = await db.all<{ key: string; value: string }>('SELECT key, value FROM pack_meta');
  const byKey = Object.fromEntries(meta.map((row) => [row.key, row.value]));

  assert.equal(byKey.content_version, '1');
  assert.equal(byKey.sense_count, String(senseWords.length));
  assert.equal(byKey.built_at, '2026-01-02T00:00:00.000Z');
});
