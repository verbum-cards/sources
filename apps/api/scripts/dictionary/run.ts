// Оркестратор конвейера: select-topic -> parse-senses -> validate -> export-editor -> report.
// data/cefr_seed.csv собирается отдельно (build-seed.ts) — редко и вручную,
// не на каждый прогон.
//
// Пример: tsx scripts/dictionary/run.ts --topics=restaurant,hotel,airport,directions \
//   --model=gpt-4o-mini --run-id=2026-w1-pilot --limit=500 --candidates-per-topic=150
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseCsvWithHeader } from './csv';
import { CefrSchema } from '@cards/contracts';
import { loadSeed, selectForTopics, selectionToCsv } from './select-topic';
import { parseWords, type SeedEntry } from './parse-senses';
import { validateSenses } from './validate';
import { draftsToEditorCsv } from './export-editor';
import { buildReport, reportToMarkdown } from './report';
import { hasApiKey } from './lib/llm-client';
import { getModelPricing, type ModelPricing, type Usage } from './lib/pricing';
import { loadTagList } from './lib/tags';
import { DATA_DIR, runDir } from './lib/paths';

function getArg(args: string[], name: string, fallback?: string): string | undefined {
  const found = args.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split('=').slice(1).join('=') : fallback;
}

async function main() {
  const args = process.argv.slice(2);
  const topicsArg = getArg(args, 'topics');
  const model = getArg(args, 'model');
  const runId = getArg(args, 'run-id');
  const limitArg = getArg(args, 'limit');
  const candidatesPerTopicArg = getArg(args, 'candidates-per-topic', '150');

  if (!topicsArg || !model || !runId) {
    console.error(
      'Использование: run.ts --topics=restaurant,hotel,airport,directions --model=<model> --run-id=<id> [--limit=500]',
    );
    process.exit(1);
  }

  // Явная остановка ДО любых трат: без ключа конвейер не может позвать LLM
  // ни на шаге отбора слов, ни на шаге разбора значений.
  if (!hasApiKey()) {
    console.error(
      'OPENAI_API_KEY не задан — прогон остановлен до вызова LLM.\n' +
        'Добавьте ключ в .env (переменная OPENAI_API_KEY, см. .env.example) и запустите снова.',
    );
    process.exit(1);
  }

  const pricingTable = (await import('./pricing.json', { with: { type: 'json' } })).default as Record<
    string,
    ModelPricing
  >;
  let pricing: ModelPricing;
  try {
    pricing = getModelPricing(pricingTable, model);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
    return;
  }

  const startedAt = new Date().toISOString();
  const dir = runDir(runId);
  mkdirSync(dir, { recursive: true });

  const seed = loadSeed(readFileSync(path.join(DATA_DIR, 'cefr_seed.csv'), 'utf8'));
  const topics = topicsArg.split(',').map((t) => t.trim());
  const limit = limitArg ? Number(limitArg) : undefined;

  console.log(`[1/5] Отбор слов по темам: ${topics.join(', ')}`);
  const selectResult = await selectForTopics({
    topics,
    seed,
    candidatesPerTopic: Number(candidatesPerTopicArg),
    limit,
    model,
  });
  writeFileSync(path.join(dir, 'selection.csv'), selectionToCsv(selectResult.selection), 'utf8');
  writeFileSync(path.join(dir, 'select-usage.json'), JSON.stringify(selectResult.usage, null, 2), 'utf8');
  const entries: SeedEntry[] = selectResult.selection
    .filter((r) => r.inSeed && r.cefr)
    .map((r) => ({ headword: r.headword, pos: r.pos, cefr: CefrSchema.parse(r.cefr) }));
  console.log(`  -> ${entries.length} слов из seed, ${selectResult.selection.length - entries.length} вне seed`);

  console.log(`[2/5] Разбор на значения через LLM (${entries.length} слов)`);
  const tags = loadTagList();
  const parseResult = await parseWords(entries, { model, runId, cacheDir: path.join(dir, 'raw'), tags });
  writeFileSync(path.join(dir, 'senses.json'), JSON.stringify(parseResult.senses, null, 2), 'utf8');
  writeFileSync(path.join(dir, 'expressions.json'), JSON.stringify(parseResult.expressions, null, 2), 'utf8');
  writeFileSync(path.join(dir, 'parse-errors.json'), JSON.stringify(parseResult.errors, null, 2), 'utf8');
  writeFileSync(path.join(dir, 'parse-usage.json'), JSON.stringify(parseResult.usage, null, 2), 'utf8');
  console.log(`  -> ${parseResult.senses.length} значений, ${parseResult.errors.length} ошибок вызова LLM`);

  console.log('[3/5] Валидация');
  const seedLevelByLexeme = new Map<string, ReturnType<typeof CefrSchema.parse>>();
  for (const row of parseCsvWithHeader(readFileSync(path.join(DATA_DIR, 'cefr_seed.csv'), 'utf8'))) {
    seedLevelByLexeme.set(`${row.headword.toLowerCase()}::${row.pos.toLowerCase()}`, CefrSchema.parse(row.cefr));
  }
  const { valid, rejected } = validateSenses(parseResult.senses, { seedLevelByLexeme, allowedTags: tags });
  writeFileSync(path.join(dir, 'senses.valid.json'), JSON.stringify(valid, null, 2), 'utf8');
  writeFileSync(path.join(dir, 'rejected.json'), JSON.stringify(rejected, null, 2), 'utf8');
  console.log(`  -> валидно: ${valid.length}, отклонено: ${rejected.length}`);

  console.log('[4/5] Выгрузка для редактора');
  writeFileSync(path.join(dir, 'editor.csv'), draftsToEditorCsv(valid), 'utf8');

  console.log('[5/5] Отчёт');
  const rejectedByReason: Record<string, number> = {};
  for (const r of rejected) {
    for (const reason of r.reason.split(';')) {
      rejectedByReason[reason] = (rejectedByReason[reason] ?? 0) + 1;
    }
  }
  const finishedAt = new Date().toISOString();
  const usage: Usage[] = [...selectResult.usage, ...parseResult.usage];
  const report = buildReport({
    runId,
    model,
    wordsIn: entries.length,
    sensesOut: valid.length,
    expressionsOut: parseResult.expressions.length,
    rejectedByReason,
    parseErrorsCount: parseResult.errors.length,
    startedAt,
    finishedAt,
    usage,
    pricing,
  });
  writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
  writeFileSync(path.join(dir, 'report.md'), reportToMarkdown(report), 'utf8');
  console.log(reportToMarkdown(report));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
