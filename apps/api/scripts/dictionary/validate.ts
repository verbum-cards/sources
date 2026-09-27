// Шаг 3 конвейера: валидация черновиков значений по правилам
// .claude/skills/dictionary-pipeline/SKILL.md, до выгрузки редактору.
// Всё, что не проходит — в rejected с причиной; в CSV редактору не идёт.
import type { Cefr } from '@cards/contracts';
import type { DraftSense, RejectedRecord } from './schema';

const CEFR_ORDER: Cefr[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const cefrIndex = (c: Cefr) => CEFR_ORDER.indexOf(c);

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export interface ValidateOptions {
  seedLevelByLexeme: Map<string, Cefr>; // key: `${lemma.toLowerCase()}::${pos.toLowerCase()}`
  allowedTags: string[];
}

export function validateSenses(senses: DraftSense[], opts: ValidateOptions): {
  valid: DraftSense[];
  rejected: RejectedRecord[];
} {
  const valid: DraftSense[] = [];
  const rejected: RejectedRecord[] = [];
  const allowedTagSet = new Set(opts.allowedTags);

  const byLexeme = new Map<string, DraftSense[]>();
  for (const s of senses) {
    const key = `${s.lemma.toLowerCase()}::${s.pos.toLowerCase()}`;
    const list = byLexeme.get(key) ?? [];
    list.push(s);
    byLexeme.set(key, list);
  }

  for (const [key, group] of byLexeme) {
    const seedLevel = opts.seedLevelByLexeme.get(key);
    const seenRu = new Set<string>();
    group.forEach((sense, i) => {
      const reasons: string[] = [];

      if (seedLevel !== undefined) {
        if (cefrIndex(sense.cefr) < cefrIndex(seedLevel)) {
          reasons.push(`level_below_seed:${sense.cefr}<${seedLevel}`);
        }
        if (i === 0 && sense.cefr !== seedLevel) {
          reasons.push(`first_sense_level_mismatch:${sense.cefr}!=${seedLevel}`);
        }
      } else {
        reasons.push('missing_seed_level');
      }

      if (sense.highlight === null) {
        reasons.push('word_not_in_example');
      }

      const exampleWords = countWords(sense.example);
      if (exampleWords < 5 || exampleWords > 12) {
        reasons.push(`example_length:${exampleWords}`);
      }

      const ruWords = countWords(sense.ru);
      if (ruWords < 1 || ruWords > 4) {
        reasons.push(`translation_length:${ruWords}`);
      }

      const badTags = sense.tags.filter((t) => !allowedTagSet.has(t));
      if (badTags.length > 0) {
        reasons.push(`unknown_tags:${badTags.join('|')}`);
      }
      if (sense.tags.length === 0) {
        reasons.push('no_tags');
      }

      const ruNorm = sense.ru.trim().toLowerCase();
      if (seenRu.has(ruNorm)) {
        reasons.push('duplicate_sense');
      } else {
        seenRu.add(ruNorm);
      }

      if (reasons.length === 0) {
        valid.push(sense);
      } else {
        rejected.push({ senseId: sense.senseId, lemma: sense.lemma, pos: sense.pos, reason: reasons.join(';') });
      }
    });
  }

  return { valid, rejected };
}

async function main() {
  const { readFileSync, writeFileSync } = await import('node:fs');
  const path = (await import('node:path')).default;
  const { parseCsvWithHeader } = await import('./csv');
  const { runDir, DATA_DIR } = await import('./lib/paths');
  const { loadTagList } = await import('./lib/tags');
  const { CefrSchema } = await import('@cards/contracts');
  const { DraftSenseSchema } = await import('./schema');

  const args = process.argv.slice(2);
  const runId = args.find((a) => a.startsWith('--run-id='))?.split('=')[1];
  if (!runId) {
    console.error('Использование: validate.ts --run-id=<id>');
    process.exit(1);
  }
  const dir = runDir(runId);
  const senses = (JSON.parse(readFileSync(path.join(dir, 'senses.json'), 'utf8')) as unknown[]).map((s) =>
    DraftSenseSchema.parse(s),
  );
  const seedCsv = readFileSync(path.join(DATA_DIR, 'cefr_seed.csv'), 'utf8');
  const seedLevelByLexeme = new Map<string, ReturnType<typeof CefrSchema.parse>>();
  for (const row of parseCsvWithHeader(seedCsv)) {
    seedLevelByLexeme.set(`${row.headword.toLowerCase()}::${row.pos.toLowerCase()}`, CefrSchema.parse(row.cefr));
  }
  const { valid, rejected } = validateSenses(senses, { seedLevelByLexeme, allowedTags: loadTagList() });
  writeFileSync(path.join(dir, 'senses.valid.json'), JSON.stringify(valid, null, 2), 'utf8');
  writeFileSync(path.join(dir, 'rejected.json'), JSON.stringify(rejected, null, 2), 'utf8');
  console.log(`Валидно: ${valid.length}, отклонено: ${rejected.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
