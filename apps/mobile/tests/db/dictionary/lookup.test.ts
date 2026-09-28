import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { createEmptyDictionaryPackage } from '../../../src/db/entities/dictionary/build';
import {
  loadPackWordsByRefs,
  searchPackWordsByPrefix,
} from '../../../src/db/entities/dictionary/lookup';
import { seedDictionaryPackage } from '../../../src/db/entities/dictionary/seed';
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
  await seedDictionaryPackage(executor);

  return { db: executor };
}

test('searchPackWordsByPrefix: короче 2 символов -> пусто', async () => {
  const { db } = await setupPack();

  assert.deepEqual(await searchPackWordsByPrefix(db, 'm'), []);
});

test('searchPackWordsByPrefix: находит точный префикс леммы, без учёта регистра', async () => {
  const { db } = await setupPack();

  const results = await searchPackWordsByPrefix(db, 'MEN');
  assert.ok(results.some((word) => word.lemma === 'menu'));
});

test('searchPackWordsByPrefix: не находит слова, не начинающиеся с префикса', async () => {
  const { db } = await setupPack();

  const results = await searchPackWordsByPrefix(db, 'menu');
  assert.ok(results.every((word) => word.lemma.toLowerCase().startsWith('menu')));
});

test('searchPackWordsByPrefix: ограничивает число результатов', async () => {
  const { db } = await setupPack();

  // Односимвольные после нормализации префиксы вроде 't' соберут много слов —
  // предел работает независимо от того, что реально совпало.
  const results = await searchPackWordsByPrefix(db, 'to', 3);
  assert.ok(results.length <= 3);
});

test('loadPackWordsByRefs: возвращает полные данные (перевод, пример, определение) в порядке refs', async () => {
  const { db } = await setupPack();
  const menu = WORDS.find((w) => w.lemma === 'menu');
  const waiter = WORDS.find((w) => w.lemma === 'waiter');
  assert.ok(menu && waiter);

  const words = await loadPackWordsByRefs(db, [
    { itemType: waiter.itemType, itemId: waiter.itemId },
    { itemType: menu.itemType, itemId: menu.itemId },
  ]);

  assert.equal(words.length, 2);
  assert.equal(words[0]?.lemma, 'waiter');
  assert.equal(words[1]?.lemma, 'menu');
  assert.equal(words[1]?.translation, menu.translation);
  assert.equal(words[1]?.definition, menu.definition);
});

test('loadPackWordsByRefs: работает и для expression (без lexeme/pos)', async () => {
  const { db } = await setupPack();
  const phrase = WORDS.find((w) => w.itemType === 'expression');
  assert.ok(phrase);

  const words = await loadPackWordsByRefs(db, [{ itemType: 'expression', itemId: phrase.itemId }]);

  assert.equal(words[0]?.lemma, phrase.lemma);
  assert.equal(words[0]?.pos, undefined);
});

test('loadPackWordsByRefs: неизвестная ссылка молча пропускается, а не падает', async () => {
  const { db } = await setupPack();

  const words = await loadPackWordsByRefs(db, [{ itemType: 'sense', itemId: 'not-a-real-id' }]);
  assert.deepEqual(words, []);
});

test('loadPackWordsByRefs: пустой список refs -> пусто, без запроса', async () => {
  const { db } = await setupPack();

  assert.deepEqual(await loadPackWordsByRefs(db, []), []);
});
