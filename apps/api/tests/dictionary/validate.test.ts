import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateSenses } from '../../scripts/dictionary/validate';
import type { DraftSense } from '../../scripts/dictionary/schema';

function sense(overrides: Partial<DraftSense>): DraftSense {
  return {
    senseId: 'id-1',
    lemma: 'bill',
    pos: 'noun',
    ipa: '',
    cefr: 'A2',
    cefrSource: 'cefr-j',
    tags: ['restaurant'],
    ru: 'счёт',
    example: 'Could I get the bill, please today?',
    highlight: [17, 21],
    exampleRu: 'Можно счёт, пожалуйста?',
    source: 'llm',
    status: 'unverified',
    model: 'fake-model',
    runId: 'r1',
    ...overrides,
  };
}

const OPTS = { seedLevelByLexeme: new Map([['bill::noun', 'A2' as const]]), allowedTags: ['restaurant', 'money'] };

test('accepts a well-formed sense', () => {
  const { valid, rejected } = validateSenses([sense({})], OPTS);
  assert.equal(valid.length, 1);
  assert.equal(rejected.length, 0);
});

test('rejects a sense with level below the seed level', () => {
  const { rejected } = validateSenses([sense({ cefr: 'A1' })], OPTS);
  assert.equal(rejected.length, 1);
  assert.match(rejected[0].reason, /level_below_seed/);
});

test('rejects the first sense when its level does not match the seed level', () => {
  const { rejected } = validateSenses([sense({ cefr: 'B1' })], OPTS);
  assert.match(rejected[0].reason, /first_sense_level_mismatch/);
});

test('rejects when the word is not found in the example (highlight is null)', () => {
  const { rejected } = validateSenses([sense({ highlight: null })], OPTS);
  assert.match(rejected[0].reason, /word_not_in_example/);
});

test('rejects examples shorter than 5 or longer than 12 words', () => {
  const short = validateSenses([sense({ example: 'Too short.' })], OPTS);
  assert.match(short.rejected[0].reason, /example_length/);

  const long = sense({
    example: 'This is a very long example sentence that goes well beyond the twelve word limit for sure.',
  });
  const longResult = validateSenses([long], OPTS);
  assert.match(longResult.rejected[0].reason, /example_length/);
});

test('rejects a translation longer than 4 words', () => {
  const { rejected } = validateSenses([sense({ ru: 'один два три четыре пять' })], OPTS);
  assert.match(rejected[0].reason, /translation_length/);
});

test('rejects tags outside the allowed list', () => {
  const { rejected } = validateSenses([sense({ tags: ['not-a-real-tag'] })], OPTS);
  assert.match(rejected[0].reason, /unknown_tags/);
});

test('rejects duplicate senses (same normalized ru within one lexeme)', () => {
  const a = sense({ senseId: 'a' });
  const b = sense({ senseId: 'b', cefr: 'B1' });
  const { valid, rejected } = validateSenses([a, b], OPTS);
  assert.equal(valid.length, 1);
  assert.equal(rejected.length, 1);
  assert.match(rejected[0].reason, /duplicate_sense/);
});

test('rejects when there is no seed level for the lexeme', () => {
  const { rejected } = validateSenses([sense({ lemma: 'unknown-word' })], OPTS);
  assert.match(rejected[0].reason, /missing_seed_level/);
});
