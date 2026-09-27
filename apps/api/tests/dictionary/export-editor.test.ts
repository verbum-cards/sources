import assert from 'node:assert/strict';
import { test } from 'node:test';
import { draftsToEditorCsv } from '../../scripts/dictionary/export-editor';
import { parseCsv } from '../../scripts/dictionary/csv';
import type { DraftSense } from '../../scripts/dictionary/schema';

const SENSE: DraftSense = {
  senseId: 'id-1',
  lemma: 'bill',
  pos: 'noun',
  ipa: '/bɪl/',
  cefr: 'A2',
  cefrSource: 'cefr-j',
  tags: ['restaurant', 'money'],
  ru: 'счёт',
  example: 'Could I get the bill, please?',
  highlight: [17, 21],
  exampleRu: 'Можно счёт, пожалуйста?',
  source: 'llm',
  status: 'unverified',
  model: 'fake-model',
  runId: 'r1',
};

test('draftsToEditorCsv writes the exact column order from the skill', () => {
  const csv = draftsToEditorCsv([SENSE]);
  assert.match(csv, /^sense_id,lemma,pos,cefr,tags,ru,example,example_ru,source,status,editor_note\n/);
});

test('draftsToEditorCsv joins multiple tags with a pipe and leaves editor_note empty', () => {
  const csv = draftsToEditorCsv([SENSE]);
  const [, row] = parseCsv(csv);
  assert.equal(row[0], 'id-1');
  assert.equal(row[4], 'restaurant|money');
  assert.equal(row[6], 'Could I get the bill, please?');
  assert.equal(row[9], 'unverified');
  assert.equal(row[10], '');
});
