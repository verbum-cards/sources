// Шаг 1 конвейера (см. .claude/skills/dictionary-pipeline/SKILL.md).
// Собирает data/cefr_seed.csv из уже скачанного и зафиксированного файла
// CEFR-J (data/vendor/cefr-j/, происхождение — data/vendor/cefr-j/SOURCE.md).
// Octanove (C1–C2) сюда сознательно не входит — решение владельца для пилота
// T1.6, подробности в data/vendor/cefr-j/SOURCE.md.
//
// Раньше этот шаг был описан в скилле как Python-скрипт (data/build_seed.py);
// стек репозитория — Node/TS без Python-тулинга, поэтому шаг сделан на TS.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseCsvWithHeader, toCsv } from './csv';
import { SeedRowSchema, type SeedRow } from './schema';
import { DATA_DIR } from './lib/paths';

export interface BuildSeedResult {
  rows: SeedRow[];
  skipped: { headword: string; pos: string; cefr: string; reason: string }[];
}

// CEFR-J размечает уровнями только A1–B2; строки с пустым/неизвестным уровнем
// (в файле их не должно быть, но проверяем явно, а не молча падаем) идут в skipped.
export function buildSeed(cefrjCsvText: string): BuildSeedResult {
  const records = parseCsvWithHeader(cefrjCsvText);
  const rows: SeedRow[] = [];
  const skipped: BuildSeedResult['skipped'] = [];

  for (const rec of records) {
    const headword = rec.headword?.trim();
    const pos = rec.pos?.trim();
    const cefr = rec.CEFR?.trim();
    if (!headword || !pos || !cefr) {
      skipped.push({ headword: headword ?? '', pos: pos ?? '', cefr: cefr ?? '', reason: 'empty_field' });
      continue;
    }
    const parsed = SeedRowSchema.safeParse({
      headword,
      pos,
      cefr,
      source: 'cefr-j',
      license: 'cefr-j-free-cite',
    });
    if (!parsed.success) {
      skipped.push({ headword, pos, cefr, reason: 'invalid_cefr' });
      continue;
    }
    rows.push(parsed.data);
  }
  return { rows, skipped };
}

export function seedRowsToCsv(rows: SeedRow[]): string {
  return toCsv(
    ['headword', 'pos', 'cefr', 'source', 'license'],
    rows.map((r) => [r.headword, r.pos, r.cefr, r.source, r.license]),
  );
}

function main() {
  const inputPath = path.join(DATA_DIR, 'vendor', 'cefr-j', 'cefrj-vocabulary-profile-1.5.csv');
  const outputPath = path.join(DATA_DIR, 'cefr_seed.csv');
  const raw = readFileSync(inputPath, 'utf8');
  const { rows, skipped } = buildSeed(raw);
  writeFileSync(outputPath, seedRowsToCsv(rows), 'utf8');
  console.log(`data/cefr_seed.csv: ${rows.length} слов, ${skipped.length} строк пропущено`);
  if (skipped.length > 0) {
    console.log('Пропущенные строки:', skipped.slice(0, 10));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
