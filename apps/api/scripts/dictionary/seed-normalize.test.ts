import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { SeedWord } from './seed-format';
import { canonicalLemma, dedupeWords, sortWords } from './seed-normalize';

test('canonicalLemma: одиночное слово остаётся как есть', () => {
  assert.equal(canonicalLemma('menu'), 'menu');
});

test('canonicalLemma: склеенные через "/" варианты написания — берётся первый', () => {
  assert.equal(canonicalLemma('a.m./A.M./am/AM'), 'a.m.');
});

function makeWord(overrides: Partial<SeedWord>): SeedWord {
  return {
    lemma: 'word',
    pos: 'noun',
    ipaUs: undefined,
    ipaUk: undefined,
    cefr: 'A1',
    source: 'cefr-j',
    license: 'CEFR-J custom',
    ...overrides,
  };
}

test('dedupeWords: точный дубль (лемма+pos+cefr+source) убирается, первое вхождение остаётся', () => {
  const words = [
    makeWord({ lemma: 'about', pos: 'adverb' }),
    makeWord({ lemma: 'about', pos: 'adverb' }),
  ];

  const result = dedupeWords(words);

  assert.equal(result.length, 1);
});

test('dedupeWords: та же лемма, но другая часть речи — не дубль', () => {
  const words = [
    makeWord({ lemma: 'about', pos: 'adverb' }),
    makeWord({ lemma: 'about', pos: 'preposition' }),
  ];

  assert.equal(dedupeWords(words).length, 2);
});

test('sortWords: сначала по уровню (A0..C2), внутри уровня — по алфавиту', () => {
  const words = [
    makeWord({ lemma: 'zebra', cefr: 'B1' }),
    makeWord({ lemma: 'apple', cefr: 'A1' }),
    makeWord({ lemma: 'banana', cefr: 'A1' }),
  ];

  const sorted = sortWords(words).map((w) => `${w.cefr}:${w.lemma}`);

  assert.deepEqual(sorted, ['A1:apple', 'A1:banana', 'B1:zebra']);
});
