import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCsv, parseCsvWithHeader, toCsv } from '../../scripts/dictionary/csv';

test('parseCsv splits simple rows', () => {
  const rows = parseCsv('a,b,c\n1,2,3\n');
  assert.deepEqual(rows, [
    ['a', 'b', 'c'],
    ['1', '2', '3'],
  ]);
});

test('parseCsv handles quoted fields with commas and escaped quotes', () => {
  const rows = parseCsv('headword,notes\nbill,"Shopping, and ""money"""\n');
  assert.deepEqual(rows, [
    ['headword', 'notes'],
    ['bill', 'Shopping, and "money"'],
  ]);
});

test('parseCsv handles last line without trailing newline', () => {
  const rows = parseCsv('a,b\n1,2');
  assert.deepEqual(rows, [
    ['a', 'b'],
    ['1', '2'],
  ]);
});

test('parseCsvWithHeader returns objects keyed by header', () => {
  const rows = parseCsvWithHeader('headword,pos,CEFR\nhotel,noun,A1\n');
  assert.deepEqual(rows, [{ headword: 'hotel', pos: 'noun', CEFR: 'A1' }]);
});

test('toCsv escapes commas, quotes and newlines', () => {
  const csv = toCsv(['a', 'b'], [['plain', 'has,comma'], ['has"quote', 'has\nnewline']]);
  assert.equal(csv, 'a,b\nplain,"has,comma"\n"has""quote","has\nnewline"\n');
});

test('round trip: toCsv output parses back to the same rows', () => {
  const header = ['headword', 'ru'];
  const rows = [
    ['order', 'заказ, заявка'],
    ['bill', 'счёт "к оплате"'],
  ];
  const csv = toCsv(header, rows);
  const parsed = parseCsv(csv);
  assert.deepEqual(parsed, [header, ...rows]);
});
