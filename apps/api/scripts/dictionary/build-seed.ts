import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Cefr } from '@cards/contracts';

import { fetchCmudict, lookupIpa } from './cmudict';
import { formatSeedCsv, splitCsvLine, type SeedWord } from './seed-format';
import { canonicalLemma, CEFR_ORDER, dedupeWords, sortWords } from './seed-normalize';

// Этап 1 конвейера словаря (skill dictionary-pipeline) — «Исходный список»:
// CEFR-J (A1–B2) и Octanove (C1–C2) собраны в один репозиторий GitHub, оба
// файла — простой CSV без кавычек внутри полей на практике, но парсер (см.
// seed-format.ts::splitCsvLine) всё равно учитывает кавычки — дешевле не
// доверять источнику, которым не управляем, чем однажды сломаться на строке
// с запятой внутри поля.
interface SourceConfig {
  source: SeedWord['source'];
  url: string;
  license: string;
  // Уровни, которые реально ожидаются из этого источника — что угодно ещё
  // (опечатка в данных, новая версия файла с другим диапазоном) явно
  // распечатывается как предупреждение, а не тихо проходит дальше.
  expectedCefr: readonly Cefr[];
}

const SOURCES: readonly SourceConfig[] = [
  {
    source: 'cefr-j',
    url: 'https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/cefrj-vocabulary-profile-1.5.csv',
    // README репозитория: собственные условия Tono Laboratory (TUFS) —
    // исследовательское и коммерческое использование бесплатно при указании
    // источника, не CC-BY-SA (в отличие от Octanove ниже).
    license: 'CEFR-J custom license (research/commercial use, attribution required)',
    expectedCefr: ['A1', 'A2', 'B1', 'B2'],
  },
  {
    source: 'octanove',
    url: 'https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/octanove-vocabulary-profile-c1c2-1.0.csv',
    license: 'CC BY-SA 4.0',
    expectedCefr: ['C1', 'C2'],
  },
];

async function fetchSourceWords(config: SourceConfig): Promise<SeedWord[]> {
  const response = await fetch(config.url);
  if (!response.ok) {
    throw new Error(`${config.url}: HTTP ${response.status}`);
  }
  const csv = await response.text();
  const lines = csv.split('\n').filter((line) => line.trim().length > 0);
  const [headerLine, ...rows] = lines;
  const header = splitCsvLine(headerLine).map((column) => column.trim().toLowerCase());
  const headwordIndex = header.indexOf('headword');
  const posIndex = header.indexOf('pos');
  const cefrIndex = header.indexOf('cefr');
  if (headwordIndex === -1 || posIndex === -1 || cefrIndex === -1) {
    throw new Error(`${config.url}: не нашли колонки headword/pos/CEFR в "${headerLine}"`);
  }

  const words: SeedWord[] = [];
  for (const line of rows) {
    const fields = splitCsvLine(line);
    const lemma = canonicalLemma(fields[headwordIndex] ?? '');
    const pos = (fields[posIndex] ?? '').trim();
    const cefr = (fields[cefrIndex] ?? '').trim() as Cefr;
    if (!lemma || !pos || !cefr) continue;

    if (!config.expectedCefr.includes(cefr)) {
      console.warn(`${config.source}: неожиданный уровень "${cefr}" у "${lemma}" — пропущено`);
      continue;
    }

    words.push({
      lemma,
      pos,
      ipa: undefined,
      cefr,
      source: config.source,
      license: config.license,
    });
  }

  return words;
}

async function main(): Promise<void> {
  const bySource: SeedWord[][] = [];
  for (const config of SOURCES) {
    const words = await fetchSourceWords(config);
    console.log(`${config.source}: ${words.length} строк из ${config.url}`);
    bySource.push(words);
  }

  const withoutIpa = sortWords(dedupeWords(bySource.flat()));

  console.log(`\nCMUdict: скачивание...`);
  const cmudict = await fetchCmudict();
  const words = withoutIpa.map((word) => ({ ...word, ipa: lookupIpa(word.lemma, cmudict) }));
  const withIpaCount = words.filter((word) => word.ipa).length;

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const outPath = join(scriptDir, '..', '..', '..', '..', 'data', 'cefr_seed.csv');
  writeFileSync(outPath, formatSeedCsv(words), 'utf8');

  const countsByLevel = new Map<Cefr, number>();
  for (const word of words) {
    countsByLevel.set(word.cefr, (countsByLevel.get(word.cefr) ?? 0) + 1);
  }

  console.log(`\nИтого: ${words.length} слов -> ${outPath}`);
  console.log(
    `IPA (CMUdict, американское произношение): ${withIpaCount} из ${words.length} (${Math.round((withIpaCount / words.length) * 100)}%)`
  );
  for (const cefr of CEFR_ORDER) {
    const count = countsByLevel.get(cefr);
    if (count) console.log(`  ${cefr}: ${count}`);
  }
}

void main();
