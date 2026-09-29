import assert from 'node:assert/strict';
import { test } from 'node:test';

import { lookupIpa } from './cmudict';

const FAKE_DICT = new Map<string, readonly string[]>([
  ['about', ['AH0', 'B', 'AW1', 'T']],
  ['menu', ['M', 'EH1', 'N', 'Y', 'UW0']],
  ['pay', ['P', 'EY1']],
  ['by', ['B', 'AY1']],
  ['card', ['K', 'AA1', 'R', 'D']],
]);

test('lookupIpa: однословная лемма из словаря', () => {
  assert.equal(lookupIpa('menu', FAKE_DICT), 'mˈɛnju');
});

test('lookupIpa: регистр не важен', () => {
  assert.equal(lookupIpa('Menu', FAKE_DICT), lookupIpa('menu', FAKE_DICT));
});

test('lookupIpa: фраза — склеивает IPA слов через пробел', () => {
  const dictWithTo = new Map([...FAKE_DICT, ['to', ['T', 'UW1']]]);

  assert.equal(lookupIpa('to pay by card', dictWithTo), 'tˈu pˈeɪ bˈaɪ kˈɑɹd');
});

test('lookupIpa: слова нет в словаре -> undefined', () => {
  assert.equal(lookupIpa('xyzzy', FAKE_DICT), undefined);
});

test('lookupIpa: фраза с хотя бы одним неизвестным словом -> undefined целиком, не частично', () => {
  assert.equal(lookupIpa('menu xyzzy', FAKE_DICT), undefined);
});

test('lookupIpa: знаки препинания на границах токенов отбрасываются', () => {
  assert.equal(lookupIpa('menu?', FAKE_DICT), lookupIpa('menu', FAKE_DICT));
});
