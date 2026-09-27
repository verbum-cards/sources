import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  findWordByLemma,
  searchWordsByPrefix,
  SUGGESTION_LIMIT,
} from '../../src/dictionary/search';

test('searchWordsByPrefix: меньше 2 символов -> пусто', () => {
  assert.deepEqual(searchWordsByPrefix(''), []);
  assert.deepEqual(searchWordsByPrefix('l'), []);
});

test('searchWordsByPrefix: префикс без учёта регистра, не больше SUGGESTION_LIMIT', () => {
  // 'te' совпадает и с 'team', и с 'tenant' в моке — не больше лимита.
  const results = searchWordsByPrefix('TE');
  assert.ok(results.length > 0);
  assert.ok(results.length <= SUGGESTION_LIMIT);
  for (const word of results) {
    assert.ok(word.lemma.toLowerCase().startsWith('te'));
  }
});

test('searchWordsByPrefix: точный однозначный префикс находит нужное слово', () => {
  const results = searchWordsByPrefix('valuab');
  assert.deepEqual(
    results.map((w) => w.lemma),
    ['valuable']
  );
});

test('searchWordsByPrefix: нет совпадений -> пустой массив', () => {
  assert.deepEqual(searchWordsByPrefix('zzzzz'), []);
});

test('findWordByLemma: точное совпадение без учёта регистра и с пробелами по краям', () => {
  const found = findWordByLemma('  Password  ');
  assert.equal(found?.lemma, 'password');
});

test('findWordByLemma: слова нет в словаре -> undefined', () => {
  assert.equal(findWordByLemma('serendipity'), undefined);
});
