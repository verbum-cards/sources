import assert from 'node:assert/strict';
import { test } from 'node:test';

import { arpabetToIpa } from './arpabet-ipa';

test('arpabetToIpa: "about" (AH0 B AW1 T) -> əbˈaʊt', () => {
  assert.equal(arpabetToIpa(['AH0', 'B', 'AW1', 'T']), 'əbˈaʊt');
});

test('arpabetToIpa: безударная AH -> ə, не ʌ', () => {
  assert.equal(arpabetToIpa(['AH0']), 'ə');
});

test('arpabetToIpa: ударная AH -> ʌ, с основным ударением', () => {
  assert.equal(arpabetToIpa(['AH1']), 'ˈʌ');
});

test('arpabetToIpa: второстепенное ударение -> ˌ', () => {
  assert.equal(arpabetToIpa(['AH2']), 'ˌʌ');
});

test('arpabetToIpa: безударная ER -> ɚ, ударная -> ɝ', () => {
  assert.equal(arpabetToIpa(['ER0']), 'ɚ');
  assert.equal(arpabetToIpa(['ER1']), 'ˈɝ');
});

test('arpabetToIpa: аффрикаты и шипящие (CH, JH, SH, ZH, NG)', () => {
  assert.equal(arpabetToIpa(['CH']), 'tʃ');
  assert.equal(arpabetToIpa(['JH']), 'dʒ');
  assert.equal(arpabetToIpa(['SH']), 'ʃ');
  assert.equal(arpabetToIpa(['ZH']), 'ʒ');
  assert.equal(arpabetToIpa(['NG']), 'ŋ');
});

test('arpabetToIpa: пустой список -> пустая строка', () => {
  assert.equal(arpabetToIpa([]), '');
});
