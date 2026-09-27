// Шаг «отчёт»: число слов/значений, ошибки по типам, время, токены, стоимость,
// стоимость на 1000 слов и экстраполяция на 5000/20000 (этап 6 SKILL.md).
import { calcCostUsd, getModelPricing, sumUsage, type ModelPricing, type Usage } from './lib/pricing';

export interface ReportInput {
  runId: string;
  model: string;
  wordsIn: number;
  sensesOut: number;
  expressionsOut: number;
  rejectedByReason: Record<string, number>;
  parseErrorsCount: number;
  startedAt: string; // ISO
  finishedAt: string; // ISO
  usage: Usage[];
  pricing: ModelPricing;
}

export interface Report {
  runId: string;
  model: string;
  wordsIn: number;
  sensesOut: number;
  expressionsOut: number;
  rejectedTotal: number;
  rejectedByReason: Record<string, number>;
  parseErrorsCount: number;
  durationMs: number;
  totalTokens: { promptTokens: number; completionTokens: number };
  costUsd: number;
  costPer1000WordsUsd: number;
  extrapolation: { words: number; estimatedCostUsd: number }[];
}

export function buildReport(input: ReportInput): Report {
  const totalTokens = sumUsage(input.usage);
  const costUsd = calcCostUsd(totalTokens, input.pricing);
  const costPer1000WordsUsd = input.wordsIn > 0 ? (costUsd / input.wordsIn) * 1000 : 0;
  const durationMs = new Date(input.finishedAt).getTime() - new Date(input.startedAt).getTime();
  const rejectedTotal = Object.values(input.rejectedByReason).reduce((a, b) => a + b, 0);
  return {
    runId: input.runId,
    model: input.model,
    wordsIn: input.wordsIn,
    sensesOut: input.sensesOut,
    expressionsOut: input.expressionsOut,
    rejectedTotal,
    rejectedByReason: input.rejectedByReason,
    parseErrorsCount: input.parseErrorsCount,
    durationMs,
    totalTokens,
    costUsd,
    costPer1000WordsUsd,
    extrapolation: [5000, 20000].map((words) => ({
      words,
      estimatedCostUsd: (costPer1000WordsUsd / 1000) * words,
    })),
  };
}

export function reportToMarkdown(r: Report): string {
  const reasons = Object.entries(r.rejectedByReason)
    .map(([reason, count]) => `- \`${reason}\`: ${count}`)
    .join('\n') || '- нет отклонённых записей';
  const extrapolation = r.extrapolation.map((e) => `- ${e.words}: $${e.estimatedCostUsd.toFixed(2)}`).join('\n');
  return `# Отчёт о прогоне ${r.runId}

- Модель: ${r.model}
- Слов на входе: ${r.wordsIn}
- Значений на выходе: ${r.sensesOut}
- Выражений на выходе: ${r.expressionsOut}
- Отклонено валидацией: ${r.rejectedTotal}
- Ошибок вызова LLM: ${r.parseErrorsCount}
- Время: ${(r.durationMs / 1000).toFixed(1)} с
- Токены: ${r.totalTokens.promptTokens} input / ${r.totalTokens.completionTokens} output
- Стоимость: $${r.costUsd.toFixed(4)}
- Стоимость на 1000 слов: $${r.costPer1000WordsUsd.toFixed(2)}

## Ошибки валидации по причинам

${reasons}

## Экстраполяция стоимости на полный словарь

${extrapolation}
`;
}

async function main() {
  const { readFileSync, writeFileSync, existsSync } = await import('node:fs');
  const path = (await import('node:path')).default;
  const { parseCsvWithHeader } = await import('./csv');
  const { runDir } = await import('./lib/paths');
  const pricingTable = (await import('./pricing.json', { with: { type: 'json' } })).default as Record<
    string,
    ModelPricing
  >;

  const args = process.argv.slice(2);
  const getArg = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
  const runId = getArg('run-id');
  const model = getArg('model');
  const startedAt = getArg('started-at');
  const finishedAt = getArg('finished-at') ?? new Date().toISOString();
  if (!runId || !model || !startedAt) {
    console.error('Использование: report.ts --run-id=<id> --model=<model> --started-at=<iso> [--finished-at=<iso>]');
    process.exit(1);
  }
  const dir = runDir(runId);
  const readJson = <T>(file: string, fallback: T): T =>
    existsSync(path.join(dir, file)) ? (JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as T) : fallback;

  const selection = parseCsvWithHeader(readFileSync(path.join(dir, 'selection.csv'), 'utf8'));
  const wordsIn = selection.filter((r) => r.in_seed === 'true').length;
  const senses = readJson<unknown[]>('senses.valid.json', []);
  const expressions = readJson<unknown[]>('expressions.json', []);
  const rejected = readJson<{ reason: string }[]>('rejected.json', []);
  const parseErrors = readJson<unknown[]>('parse-errors.json', []);
  const selectUsage = readJson<Usage[]>('select-usage.json', []);
  const parseUsage = readJson<Usage[]>('parse-usage.json', []);

  const rejectedByReason: Record<string, number> = {};
  for (const r of rejected) {
    for (const reason of r.reason.split(';')) {
      rejectedByReason[reason] = (rejectedByReason[reason] ?? 0) + 1;
    }
  }

  const pricing = getModelPricing(pricingTable, model);
  const report = buildReport({
    runId,
    model,
    wordsIn,
    sensesOut: senses.length,
    expressionsOut: expressions.length,
    rejectedByReason,
    parseErrorsCount: parseErrors.length,
    startedAt,
    finishedAt,
    usage: [...selectUsage, ...parseUsage],
    pricing,
  });
  writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
  writeFileSync(path.join(dir, 'report.md'), reportToMarkdown(report), 'utf8');
  console.log(reportToMarkdown(report));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
