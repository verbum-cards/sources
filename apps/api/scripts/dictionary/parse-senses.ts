// Шаг 2 конвейера: разбор слова на значения через LLM.
// Промпт — дословно .claude/skills/dictionary-pipeline/references/prompt.md
// (система + пользовательская часть, схема ответа). highlight вычисляется кодом
// (lib/word-match.ts), не моделью — так и написано в prompt.md.
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { RawLlmResponseSchema, type DraftExpression, type DraftSense, type RawLlmResponse } from './schema';
import type { Cefr } from '@cards/contracts';
import { callOpenAiChat, type ChatFn, type ChatUsage } from './lib/llm-client';
import { findHighlight } from './lib/word-match';
import { loadTagList } from './lib/tags';

export interface SeedEntry {
  headword: string;
  pos: string;
  cefr: Cefr;
}

// Схема ответа — дословно из references/prompt.md. Без неё response_format
// json_object гарантирует только валидный JSON, но не эти конкретные ключи —
// модель на пилоте вернула свой произвольный формат (word/meanings/definition/...)
// без этого блока в системном промпте.
const RESPONSE_SCHEMA_BLOCK = `Схема ответа (строго эти ключи, без вложенных переименований):
{
  "lemma": "string",
  "pos": "string",
  "ipa": "string",
  "senses": [
    { "level": "A1|A2|B1|B2|C1|C2", "tags": ["string"], "ru": "string", "example": "string", "example_ru": "string" }
  ],
  "expressions": [
    { "text": "string", "level": "A1|A2|B1|B2|C1|C2", "tags": ["string"], "ru": "string" }
  ]
}`;

function buildPrompt(entry: SeedEntry, tags: string[]): { system: string; user: string } {
  const system =
    'Ты — лексикограф, готовящий учебный англо-русский словарь для русскоязычных, изучающих английский. ' +
    'Отвечай только JSON по схеме, без пояснений.\n' +
    'Правила:\n' +
    '- Выдели основные значения слова для указанной части речи, не больше 4, от самого частотного к редкому. ' +
      'Тест на дробление: два значения — это два значения, только если пример одного нельзя описать переводом другого. ' +
      'Если один и тот же перевод (пусть и другими словами) годится для обоих примеров — это одно значение, оставь только его, с одним переводом и одним примером. При сомнении — объединяй, а не дроби.\n' +
    '  Пример «не дробить»: для "menu" не заводи отдельные значения «выбор блюд» / «список блюд» / «предложение блюд от шефа» — все три примера про один и тот же ресторанный список блюд, это один смысл, разными словами описанный.\n' +
    '  Пример «можно различать»: для "menu" отдельное значение — «список команд в компьютерной программе или на экране» (File menu) — другой предмет, друг друга не заменяют, оставь оба значения.\n' +
    `- Для каждого значения: уровень CEFR (не ниже ${entry.cefr}; самое частотное значение — ${entry.cefr}), 1–3 тега из списка ${tags.join(', ')}, русский перевод 1–4 слова, оригинальный пример 5–12 слов с этим значением и его естественный русский перевод.\n` +
    '- Пример должен звучать как живая речь, лексика не сложнее уровня значения + 1. Не используй и не пересказывай примеры из известных словарей.\n' +
    '- Перед ответом проверь: ru и example_ru должны переводить один и тот же смысл слова в примере — если ru не подходит к example, это ошибка, исправь ru, а не переписывай пример.\n' +
    '- Если слово — часть устойчивого выражения, которое важно для учащихся, добавь его в "expressions".\n\n' +
    RESPONSE_SCHEMA_BLOCK;
  const user = `Слово: ${entry.headword}\nЧасть речи: ${entry.pos}\nУровень из списка: ${entry.cefr}`;
  return { system, user };
}

function cacheFileName(entry: SeedEntry): string {
  const safe = `${entry.headword}-${entry.pos}`.toLowerCase().replace(/[^a-z0-9-]/g, '_');
  return `${safe}.json`;
}

export interface ParseOneOptions {
  model: string;
  tags: string[];
  chatFn?: ChatFn;
  cacheDir?: string;
}

export interface ParseOneResult {
  raw: RawLlmResponse;
  usage: ChatUsage;
  fromCache: boolean;
}

export async function parseOneWord(entry: SeedEntry, opts: ParseOneOptions): Promise<ParseOneResult> {
  const chat = opts.chatFn ?? callOpenAiChat;
  if (opts.cacheDir) {
    const cachePath = path.join(opts.cacheDir, cacheFileName(entry));
    if (existsSync(cachePath)) {
      const cached = JSON.parse(readFileSync(cachePath, 'utf8')) as RawLlmResponse;
      return { raw: RawLlmResponseSchema.parse(cached), usage: { promptTokens: 0, completionTokens: 0 }, fromCache: true };
    }
  }
  const { system, user } = buildPrompt(entry, opts.tags);
  const result = await chat({ model: opts.model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] });
  const parsedJson = JSON.parse(result.content);
  const raw = RawLlmResponseSchema.parse(parsedJson);
  if (opts.cacheDir) {
    mkdirSync(opts.cacheDir, { recursive: true });
    writeFileSync(path.join(opts.cacheDir, cacheFileName(entry)), JSON.stringify(raw, null, 2), 'utf8');
  }
  return { raw, usage: result.usage, fromCache: false };
}

export function mapRawToDrafts(
  raw: RawLlmResponse,
  ctx: { model: string; runId: string },
): { senses: DraftSense[]; expressions: DraftExpression[] } {
  const senses: DraftSense[] = raw.senses.map((s, i) => {
    const highlight = findHighlight(s.example, raw.lemma);
    return {
      senseId: randomUUID(),
      lemma: raw.lemma,
      pos: raw.pos,
      ipa: raw.ipa,
      cefr: s.level,
      cefrSource: i === 0 ? 'cefr-j' : 'llm',
      tags: s.tags,
      ru: s.ru,
      example: s.example,
      highlight,
      exampleRu: s.example_ru,
      source: 'llm',
      status: 'unverified',
      model: ctx.model,
      runId: ctx.runId,
    };
  });
  const expressions: DraftExpression[] = raw.expressions.map((e) => ({
    expressionId: randomUUID(),
    text: e.text,
    cefr: e.level,
    tags: e.tags,
    ru: e.ru,
    source: 'llm',
    status: 'unverified',
    model: ctx.model,
    runId: ctx.runId,
  }));
  return { senses, expressions };
}

export interface ParseWordsOptions {
  model: string;
  runId: string;
  chatFn?: ChatFn;
  cacheDir?: string;
  concurrency?: number;
  tags?: string[];
  retries?: number;
}

export interface ParseWordsResult {
  senses: DraftSense[];
  expressions: DraftExpression[];
  usage: ChatUsage[];
  errors: { headword: string; pos: string; reason: string; detail: string }[];
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
    }
  }
  throw lastErr;
}

export async function parseWords(entries: SeedEntry[], opts: ParseWordsOptions): Promise<ParseWordsResult> {
  const tags = opts.tags ?? loadTagList();
  const concurrency = opts.concurrency ?? 5;
  const senses: DraftSense[] = [];
  const expressions: DraftExpression[] = [];
  const usage: ChatUsage[] = [];
  const errors: ParseWordsResult['errors'] = [];

  let cursor = 0;
  async function worker() {
    while (cursor < entries.length) {
      const entry = entries[cursor++];
      try {
        const { raw, usage: u } = await withRetry(
          () => parseOneWord(entry, { model: opts.model, tags, chatFn: opts.chatFn, cacheDir: opts.cacheDir }),
          opts.retries ?? 2,
        );
        usage.push(u);
        const mapped = mapRawToDrafts(raw, { model: opts.model, runId: opts.runId });
        senses.push(...mapped.senses);
        expressions.push(...mapped.expressions);
      } catch (err) {
        errors.push({
          headword: entry.headword,
          pos: entry.pos,
          reason: 'llm_call_failed',
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, entries.length) }, () => worker()));
  return { senses, expressions, usage, errors };
}

async function main() {
  const { readFileSync: readFile, writeFileSync: writeFile, mkdirSync: mkdir } = await import('node:fs');
  const { parseCsvWithHeader } = await import('./csv');
  const { runDir } = await import('./lib/paths');
  const { CefrSchema } = await import('@cards/contracts');

  const args = process.argv.slice(2);
  const getArg = (name: string, fallback?: string) => {
    const found = args.find((a) => a.startsWith(`--${name}=`));
    return found ? found.split('=').slice(1).join('=') : fallback;
  };
  const model = getArg('model');
  const runId = getArg('run-id');
  if (!model || !runId) {
    console.error('Использование: parse-senses.ts --model=<model> --run-id=<id>');
    process.exit(1);
  }
  const dir = runDir(runId);
  const selectionCsv = readFile(path.join(dir, 'selection.csv'), 'utf8');
  const entries: SeedEntry[] = parseCsvWithHeader(selectionCsv)
    .filter((r) => r.in_seed === 'true')
    .map((r) => ({ headword: r.headword, pos: r.pos, cefr: CefrSchema.parse(r.cefr) }));

  const result = await parseWords(entries, { model, runId, cacheDir: path.join(dir, 'raw') });
  mkdir(dir, { recursive: true });
  writeFile(path.join(dir, 'senses.json'), JSON.stringify(result.senses, null, 2), 'utf8');
  writeFile(path.join(dir, 'expressions.json'), JSON.stringify(result.expressions, null, 2), 'utf8');
  writeFile(path.join(dir, 'parse-errors.json'), JSON.stringify(result.errors, null, 2), 'utf8');
  writeFile(path.join(dir, 'parse-usage.json'), JSON.stringify(result.usage, null, 2), 'utf8');
  console.log(
    `Разобрано слов: ${entries.length}, значений: ${result.senses.length}, выражений: ${result.expressions.length}, ошибок: ${result.errors.length}`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
