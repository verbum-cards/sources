import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { mapRawToDrafts, parseOneWord, parseWords } from '../../scripts/dictionary/parse-senses';
import type { RawLlmResponse } from '../../scripts/dictionary/schema';

const RAW: RawLlmResponse = {
  lemma: 'bill',
  pos: 'noun',
  ipa: '/bɪl/',
  senses: [
    { level: 'A2', tags: ['restaurant'], ru: 'счёт', example: 'Could I get the bill, please?', example_ru: 'Можно счёт, пожалуйста?' },
    { level: 'B1', tags: ['money'], ru: 'законопроект', example: 'The bill passed in parliament today.', example_ru: 'Законопроект приняли в парламенте сегодня.' },
  ],
  expressions: [{ text: 'foot the bill', level: 'B2', tags: ['money'], ru: 'оплатить счёт' }],
};

test('mapRawToDrafts marks the first sense cefrSource=cefr-j and the rest llm', () => {
  const { senses } = mapRawToDrafts(RAW, { model: 'fake-model', runId: 'test-run' });
  assert.equal(senses[0].cefrSource, 'cefr-j');
  assert.equal(senses[1].cefrSource, 'llm');
  assert.equal(senses[0].source, 'llm');
  assert.equal(senses[0].status, 'unverified');
});

test('mapRawToDrafts computes highlight for each sense example', () => {
  const { senses } = mapRawToDrafts(RAW, { model: 'fake-model', runId: 'test-run' });
  assert.ok(senses[0].highlight);
  const [start, end] = senses[0].highlight!;
  assert.equal(senses[0].example.slice(start, end).toLowerCase(), 'bill');
});

test('mapRawToDrafts maps expressions with their own ids and llm/unverified', () => {
  const { expressions } = mapRawToDrafts(RAW, { model: 'fake-model', runId: 'test-run' });
  assert.equal(expressions.length, 1);
  assert.equal(expressions[0].source, 'llm');
  assert.equal(expressions[0].status, 'unverified');
  assert.ok(expressions[0].expressionId);
});

test('parseOneWord calls the LLM with the prompt.md schema and validates the response', async () => {
  const result = await parseOneWord(
    { headword: 'bill', pos: 'noun', cefr: 'A2' },
    { model: 'fake-model', tags: ['restaurant', 'money'], chatFn: async () => ({ content: JSON.stringify(RAW), usage: { promptTokens: 1, completionTokens: 2 } }) },
  );
  assert.equal(result.raw.lemma, 'bill');
  assert.equal(result.fromCache, false);
});

test('parseOneWord caches the raw response and skips the LLM call on the next run', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'dict-cache-'));
  let calls = 0;
  const chatFn = async () => {
    calls++;
    return { content: JSON.stringify(RAW), usage: { promptTokens: 1, completionTokens: 2 } };
  };
  const entry = { headword: 'bill', pos: 'noun', cefr: 'A2' as const };
  await parseOneWord(entry, { model: 'fake-model', tags: [], chatFn, cacheDir: dir });
  const second = await parseOneWord(entry, { model: 'fake-model', tags: [], chatFn, cacheDir: dir });
  assert.equal(calls, 1);
  assert.equal(second.fromCache, true);
  assert.ok(existsSync(path.join(dir, 'bill-noun.json')));
});

test('parseWords collects errors per word instead of failing the whole batch', async () => {
  const entries = [
    { headword: 'bill', pos: 'noun', cefr: 'A2' as const },
    { headword: 'broken', pos: 'adjective', cefr: 'A2' as const },
  ];
  const chatFn = async ({ messages }: { messages: { content: string }[] }) => {
    if (messages[1].content.includes('broken')) throw new Error('boom');
    return { content: JSON.stringify(RAW), usage: { promptTokens: 1, completionTokens: 2 } };
  };
  const result = await parseWords(entries, { model: 'fake-model', runId: 'r1', chatFn, tags: [], concurrency: 2, retries: 0 });
  assert.equal(result.senses.length, 2);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].headword, 'broken');
});
