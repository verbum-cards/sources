import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Cefr } from '@cards/contracts';

import { formatLlmInputsCsv, prepareLlmInputs } from './llm-inputs';
import { parseSeedCsv } from './seed-format';
import { CEFR_ORDER } from './seed-normalize';

// Отдельный шаг между этапом 1 («Исходный список», build-seed.ts) и этапом 2
// («Разбор на значения через LLM») — читает уже собранный data/cefr_seed.csv
// (без сети, без повторного скачивания источников) и группирует его по
// (lemma, pos), схлопывая случаи, когда одна и та же пара встречается в
// источниках на нескольких уровнях CEFR сразу (см. llm-inputs.ts). Пишет
// data/cefr_seed_prepared.csv — вход, который этап 2 будет читать один раз
// на слово, а не на строку исходного списка.
function main(): void {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const dataDir = join(scriptDir, '..', '..', '..', '..', 'data');
  const seedPath = join(dataDir, 'cefr_seed.csv');
  const outPath = join(dataDir, 'cefr_seed_prepared.csv');

  const seedWords = parseSeedCsv(readFileSync(seedPath, 'utf8'));
  const inputs = prepareLlmInputs(seedWords);
  writeFileSync(outPath, formatLlmInputsCsv(inputs), 'utf8');

  const countsByLevel = new Map<Cefr, number>();
  for (const input of inputs) {
    countsByLevel.set(input.seedLevel, (countsByLevel.get(input.seedLevel) ?? 0) + 1);
  }

  console.log(`${seedPath}: ${seedWords.length} строк`);
  console.log(
    `${outPath}: ${inputs.length} слов (схлопнуто ${seedWords.length - inputs.length} дублей — одна и та же пара лемма+pos на нескольких уровнях CEFR)`
  );
  for (const cefr of CEFR_ORDER) {
    const count = countsByLevel.get(cefr);
    if (count) console.log(`  ${cefr}: ${count}`);
  }
}

main();
