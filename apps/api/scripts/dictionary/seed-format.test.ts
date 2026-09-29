import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatSeedCsv, parseSeedCsv, splitCsvLine, type SeedWord } from './seed-format';

test('splitCsvLine: простая строка без кавычек', () => {
  assert.deepEqual(splitCsvLine('a,b,c'), ['a', 'b', 'c']);
});

test('splitCsvLine: поле в кавычках с запятой внутри', () => {
  assert.deepEqual(splitCsvLine('a,"b, c",d'), ['a', 'b, c', 'd']);
});

test('splitCsvLine: удвоенная кавычка внутри поля в кавычках — одна кавычка в значении', () => {
  assert.deepEqual(splitCsvLine('a,"b ""c"" d",e'), ['a', 'b "c" d', 'e']);
});

const sample: readonly SeedWord[] = [
  {
    lemma: 'menu',
    pos: 'noun',
    ipaUs: 'ˈmɛnju',
    ipaUk: 'ˈmɛnjuː',
    cefr: 'A2',
    source: 'cefr-j',
    license: 'CEFR-J custom',
  },
  {
    lemma: 'abandon',
    pos: 'verb',
    ipaUs: undefined,
    ipaUk: undefined,
    cefr: 'C1',
    source: 'octanove',
    license: 'CC BY-SA 4.0, with, comma',
  },
];

test('formatSeedCsv -> parseSeedCsv: круговой обход не теряет и не искажает данные', () => {
  const csv = formatSeedCsv(sample);
  const parsed = parseSeedCsv(csv);

  assert.deepEqual(parsed, sample);
});

test('formatSeedCsv: поле с запятой (license) уходит в кавычках', () => {
  const csv = formatSeedCsv(sample);
  const [, , abandonLine] = csv.split('\n');

  assert.match(abandonLine, /"CC BY-SA 4\.0, with, comma"/);
});

test('parseSeedCsv: неверный заголовок -> ошибка', () => {
  assert.throws(() => parseSeedCsv('wrong,header\na,b'));
});

test('parseSeedCsv: неизвестный source -> ошибка', () => {
  const badCsv = 'lemma,pos,ipaUs,ipaUk,cefr,source,license\nword,noun,,,A1,unknown-source,license';

  assert.throws(() => parseSeedCsv(badCsv));
});
