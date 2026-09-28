import assert from 'node:assert/strict';
import { test } from 'node:test';

import { wordByLemma, WORDS } from '../../src/mocks/words';

test('WORDS: itemId и lemma уникальны по всему списку (иначе модуль не импортировался бы)', () => {
  const itemIds = WORDS.map((word) => word.itemId);
  assert.equal(new Set(itemIds).size, itemIds.length);

  const lemmas = WORDS.map((word) => word.lemma);
  assert.equal(new Set(lemmas).size, lemmas.length);
});

test('wordByLemma: находит слово по точной лемме', () => {
  const word = wordByLemma('menu');
  assert.equal(word.lemma, 'menu');
  assert.equal(word.itemType, 'sense');
});

test('wordByLemma: неизвестная лемма — исключение, а не undefined', () => {
  assert.throws(() => wordByLemma('not-a-real-lemma'));
});

test('WORDS: слова из DEBUG_WORDS несут goals, слова из колод — нет', () => {
  const wander = wordByLemma('wander');
  assert.ok(wander.goals && wander.goals.length > 0);

  const menu = wordByLemma('menu');
  assert.equal(menu.goals, undefined);
});
