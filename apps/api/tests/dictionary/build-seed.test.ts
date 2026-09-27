import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildSeed, seedRowsToCsv } from '../../scripts/dictionary/build-seed';

const SAMPLE_CSV = `headword,pos,CEFR,CoreInventory 1,CoreInventory 2,Threshold
hotel,noun,A1,Travel and services vocab,,Travel
restaurant,noun,A1,"Things in the town, shops and shopping",,Food and drink
bill,noun,A2,Shopping,,Shopping
bill,verb,B1,,,
weird,adjective,,,,
,noun,A1,,,
`;

test('buildSeed maps headword/pos/CEFR into seed rows with source and license', () => {
  const { rows, skipped } = buildSeed(SAMPLE_CSV);
  assert.equal(rows.length, 4);
  assert.deepEqual(rows[0], { headword: 'hotel', pos: 'noun', cefr: 'A1', source: 'cefr-j', license: 'cefr-j-free-cite' });
  assert.deepEqual(rows[2], { headword: 'bill', pos: 'noun', cefr: 'A2', source: 'cefr-j', license: 'cefr-j-free-cite' });
});

test('buildSeed skips rows with empty cefr or empty headword', () => {
  const { skipped } = buildSeed(SAMPLE_CSV);
  assert.equal(skipped.length, 2);
  assert.ok(skipped.some((s) => s.headword === 'weird'));
  assert.ok(skipped.some((s) => s.headword === ''));
});

test('seedRowsToCsv produces a valid CSV with the expected header', () => {
  const { rows } = buildSeed(SAMPLE_CSV);
  const csv = seedRowsToCsv(rows);
  assert.match(csv, /^headword,pos,cefr,source,license\n/);
  assert.match(csv, /hotel,noun,A1,cefr-j,cefr-j-free-cite/);
});
