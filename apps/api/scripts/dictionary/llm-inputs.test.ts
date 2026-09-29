import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatLlmInputsCsv,
  parseLlmInputsCsv,
  prepareLlmInputs,
  type LlmInput,
} from './llm-inputs';
import type { SeedWord } from './seed-format';

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

test('prepareLlmInputs: слово с одним уровнем -> один вход с тем же уровнем', () => {
  const inputs = prepareLlmInputs([makeWord({ lemma: 'menu', pos: 'noun', cefr: 'A2' })]);

  assert.deepEqual(inputs, [
    { lemma: 'menu', pos: 'noun', seedLevel: 'A2', ipaUs: undefined, ipaUk: undefined },
  ]);
});

test('prepareLlmInputs: одна лемма+pos на двух уровнях (CEFR-J и Octanove) -> один вход, минимальный уровень', () => {
  const inputs = prepareLlmInputs([
    makeWord({ lemma: 'plane', pos: 'noun', cefr: 'A1', source: 'cefr-j' }),
    makeWord({ lemma: 'plane', pos: 'noun', cefr: 'C2', source: 'octanove' }),
  ]);

  assert.equal(inputs.length, 1);
  assert.equal(inputs[0].seedLevel, 'A1');
});

test('prepareLlmInputs: та же лемма, но другая часть речи — отдельный вход', () => {
  const inputs = prepareLlmInputs([
    makeWord({ lemma: 'drive', pos: 'noun', cefr: 'A1' }),
    makeWord({ lemma: 'drive', pos: 'verb', cefr: 'A2' }),
  ]);

  assert.equal(inputs.length, 2);
});

test('prepareLlmInputs: IPA берётся из строки с минимальным уровнем группы', () => {
  const inputs = prepareLlmInputs([
    makeWord({ lemma: 'plane', pos: 'noun', cefr: 'C2', ipaUs: 'wrong', ipaUk: 'wrong' }),
    makeWord({ lemma: 'plane', pos: 'noun', cefr: 'A1', ipaUs: 'pleɪn', ipaUk: 'pleɪn' }),
  ]);

  assert.equal(inputs[0].seedLevel, 'A1');
  assert.equal(inputs[0].ipaUs, 'pleɪn');
});

test('prepareLlmInputs: порядок значений уровня внутри группы не важен — результат тот же', () => {
  const a = prepareLlmInputs([
    makeWord({ lemma: 'plane', pos: 'noun', cefr: 'C2' }),
    makeWord({ lemma: 'plane', pos: 'noun', cefr: 'A1' }),
  ]);
  const b = prepareLlmInputs([
    makeWord({ lemma: 'plane', pos: 'noun', cefr: 'A1' }),
    makeWord({ lemma: 'plane', pos: 'noun', cefr: 'C2' }),
  ]);

  assert.deepEqual(a, b);
});

test('formatLlmInputsCsv -> parseLlmInputsCsv: обратимо, включая undefined IPA', () => {
  const inputs: LlmInput[] = [
    { lemma: 'plane', pos: 'noun', seedLevel: 'A1', ipaUs: 'pleɪn', ipaUk: 'pleɪn' },
    {
      lemma: 'good morning',
      pos: 'interjection',
      seedLevel: 'A1',
      ipaUs: undefined,
      ipaUk: undefined,
    },
  ];

  const csv = formatLlmInputsCsv(inputs);
  assert.deepEqual(parseLlmInputsCsv(csv), inputs);
});

test('formatLlmInputsCsv: поле с запятой уходит в кавычках', () => {
  const inputs: LlmInput[] = [
    { lemma: 'salt, pepper', pos: 'noun', seedLevel: 'B1', ipaUs: undefined, ipaUk: undefined },
  ];

  const csv = formatLlmInputsCsv(inputs);
  assert.match(csv, /"salt, pepper"/);
  assert.deepEqual(parseLlmInputsCsv(csv), inputs);
});
