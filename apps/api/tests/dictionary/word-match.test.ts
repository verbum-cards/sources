import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findHighlight } from '../../scripts/dictionary/lib/word-match';

test('finds exact lemma match', () => {
  const text = 'Could I get the bill, please?';
  const result = findHighlight(text, 'bill');
  assert.ok(result);
  assert.equal(text.slice(result![0], result![1]), 'bill');
});

test('finds plural form (s)', () => {
  const text = 'There are two hotels nearby.';
  const result = findHighlight(text, 'hotel');
  assert.ok(result);
  assert.equal(text.slice(result![0], result![1]), 'hotels');
});

test('finds -ing form with doubled consonant', () => {
  const text = 'We are stopping at the next gate.';
  const result = findHighlight(text, 'stop');
  assert.ok(result);
  assert.equal(text.slice(result![0], result![1]), 'stopping');
});

test('finds -ed form', () => {
  const result = findHighlight('She ordered a coffee.', 'order');
  assert.ok(result);
});

test('finds -ies form (study -> studies)', () => {
  const result = findHighlight('He studies every evening.', 'study');
  assert.ok(result);
});

test('is case-insensitive', () => {
  const result = findHighlight('Hotel staff were friendly.', 'hotel');
  assert.deepEqual(result, [0, 5]);
});

test('matches multi-word lemma as substring', () => {
  const result = findHighlight('Please give up your seat for her.', 'give up');
  assert.ok(result);
  assert.equal('give up'.length, result![1] - result![0]);
});

test('returns null when the word is not in the example', () => {
  const result = findHighlight('This sentence has nothing relevant.', 'airport');
  assert.equal(result, null);
});

test('returns null for irregular forms not covered by suffix rules', () => {
  // "went" is not derivable from "go" by suffix stripping — expected limitation.
  const result = findHighlight('We went to the airport yesterday.', 'go');
  assert.equal(result, null);
});
