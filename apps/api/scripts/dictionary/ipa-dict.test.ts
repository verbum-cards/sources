import assert from 'node:assert/strict';
import { test } from 'node:test';

import { lookupPhraseIpa, parseIpaDictLine } from './ipa-dict';

test('parseIpaDictLine: слово и IPA без слэшей', () => {
  assert.deepEqual(parseIpaDictLine('menu\t/ˈmɛnju/'), ['menu', 'ˈmɛnju']);
});

test('parseIpaDictLine: несколько вариантов через запятую — берётся первый', () => {
  assert.deepEqual(parseIpaDictLine('a\t/ˈeɪ/, /ə/'), ['a', 'ˈeɪ']);
});

test('parseIpaDictLine: пустая строка -> null', () => {
  assert.equal(parseIpaDictLine(''), null);
  assert.equal(parseIpaDictLine('   '), null);
});

test('parseIpaDictLine: строка без таба -> null', () => {
  assert.equal(parseIpaDictLine('menu ˈmɛnju'), null);
});

const FAKE_DICT = new Map<string, string>([
  ['menu', 'ˈmɛnju'],
  ['good', 'ɡʊd'],
  ['morning', 'ˈmɔːnɪŋ'],
]);

test('lookupPhraseIpa: однословная лемма из словаря', () => {
  assert.equal(lookupPhraseIpa('menu', FAKE_DICT), 'ˈmɛnju');
});

test('lookupPhraseIpa: регистр не важен', () => {
  assert.equal(lookupPhraseIpa('Menu', FAKE_DICT), lookupPhraseIpa('menu', FAKE_DICT));
});

test('lookupPhraseIpa: фраза — склеивает IPA слов через пробел', () => {
  assert.equal(lookupPhraseIpa('good morning', FAKE_DICT), 'ɡʊd ˈmɔːnɪŋ');
});

test('lookupPhraseIpa: слова нет в словаре -> undefined', () => {
  assert.equal(lookupPhraseIpa('xyzzy', FAKE_DICT), undefined);
});

test('lookupPhraseIpa: фраза с хотя бы одним неизвестным словом -> undefined целиком, не частично', () => {
  assert.equal(lookupPhraseIpa('good xyzzy', FAKE_DICT), undefined);
});

test('lookupPhraseIpa: знаки препинания на границах токенов отбрасываются', () => {
  assert.equal(lookupPhraseIpa('menu?', FAKE_DICT), lookupPhraseIpa('menu', FAKE_DICT));
});
