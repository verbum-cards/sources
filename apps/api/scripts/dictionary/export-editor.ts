// Шаг 4 конвейера: выгрузка для редактора. Колонки — как в
// .claude/skills/dictionary-pipeline/SKILL.md: редактор меняет ru, example,
// example_ru, cefr, tags, status (verified/rejected) и пишет editor_note.
import { toCsv } from './csv';
import type { DraftSense } from './schema';

export function draftsToEditorCsv(senses: DraftSense[]): string {
  return toCsv(
    ['sense_id', 'lemma', 'pos', 'cefr', 'tags', 'ru', 'example', 'example_ru', 'source', 'status', 'editor_note'],
    senses.map((s) => [
      s.senseId,
      s.lemma,
      s.pos,
      s.cefr,
      s.tags.join('|'),
      s.ru,
      s.example,
      s.exampleRu,
      s.source,
      s.status,
      '',
    ]),
  );
}

async function main() {
  const { readFileSync, writeFileSync } = await import('node:fs');
  const path = (await import('node:path')).default;
  const { runDir } = await import('./lib/paths');
  const { DraftSenseSchema } = await import('./schema');

  const runId = process.argv.slice(2).find((a) => a.startsWith('--run-id='))?.split('=')[1];
  if (!runId) {
    console.error('Использование: export-editor.ts --run-id=<id>');
    process.exit(1);
  }
  const dir = runDir(runId);
  const senses = (JSON.parse(readFileSync(path.join(dir, 'senses.valid.json'), 'utf8')) as unknown[]).map((s) =>
    DraftSenseSchema.parse(s),
  );
  writeFileSync(path.join(dir, 'editor.csv'), draftsToEditorCsv(senses), 'utf8');
  console.log(`editor.csv: ${senses.length} значений для проверки`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
