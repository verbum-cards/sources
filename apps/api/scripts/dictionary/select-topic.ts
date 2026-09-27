// Отбор слов по темам — шаг, которого нет в исходном списке CEFR-J (там нет
// колонки темы). LLM предлагает ситуативные кандидаты по теме, дальше они
// пересекаются с data/cefr_seed.csv: у слова уже есть лицензированный уровень —
// оно идёт дальше по конвейеру; слова вне seed фиксируются отдельно (in_seed=false)
// для будущей ручной проверки источника уровня, дальше по конвейеру не идут.
// Промпт этого шага — не из references/prompt.md (тот про разбор на значения),
// это отдельный, специально для отбора кандидатов.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { parseCsvWithHeader, toCsv } from './csv';
import { SeedRowSchema, type SeedRow, type SelectionRow } from './schema';
import { callOpenAiChat, type ChatFn } from './lib/llm-client';
import { DATA_DIR, runDir } from './lib/paths';

export function loadSeed(csvText: string): SeedRow[] {
  return parseCsvWithHeader(csvText)
    .map((r) => SeedRowSchema.safeParse(r))
    .filter((r): r is { success: true; data: SeedRow } => r.success)
    .map((r) => r.data);
}

function buildPrompt(topic: string, count: number): { system: string; user: string } {
  return {
    system:
      'Ты — методист учебного англо-русского словаря. Отвечай только JSON вида ' +
      '{"words": ["word1", "word2", ...]}, без пояснений.',
    user:
      `Перечисли ${count} английских слов и коротких словосочетаний уровня A1–B2, ` +
      `которые реально нужны русскоязычному туристу/путешественнику в ситуации «${topic}». ` +
      'От самого важного к менее важному, без дублей, только базовая форма слова (для существительных — ' +
      'единственное число, для глаголов — инфинитив без "to").',
  };
}

export function parseCandidateWords(llmContent: string): string[] {
  const data = JSON.parse(llmContent) as unknown;
  if (Array.isArray(data)) return data.filter((w): w is string => typeof w === 'string');
  if (data && typeof data === 'object' && Array.isArray((data as { words?: unknown }).words)) {
    return ((data as { words: unknown[] }).words).filter((w): w is string => typeof w === 'string');
  }
  throw new Error('Не удалось разобрать ответ LLM с кандидатами слов: ожидался {"words": [...]}');
}

// Пересечение кандидатов темы с seed. Слово может иметь несколько строк в seed
// (разные части речи) — каждая становится отдельной строкой отбора.
export function intersectWithSeed(topic: string, candidates: string[], seed: SeedRow[]): SelectionRow[] {
  const seedByHeadword = new Map<string, SeedRow[]>();
  for (const row of seed) {
    const key = row.headword.toLowerCase();
    const list = seedByHeadword.get(key) ?? [];
    list.push(row);
    seedByHeadword.set(key, list);
  }
  const rows: SelectionRow[] = [];
  const seenOutOfSeed = new Set<string>();
  for (const candidate of candidates) {
    const key = candidate.trim().toLowerCase();
    if (!key) continue;
    const matches = seedByHeadword.get(key);
    if (matches && matches.length > 0) {
      for (const m of matches) {
        rows.push({ headword: m.headword, pos: m.pos, cefr: m.cefr, topic, inSeed: true });
      }
    } else if (!seenOutOfSeed.has(key)) {
      seenOutOfSeed.add(key);
      rows.push({ headword: candidate.trim(), pos: '', topic, inSeed: false });
    }
  }
  return rows;
}

// Объединяет отбор по нескольким темам: дедуп по (headword,pos), темы через запятую.
export function mergeSelections(perTopic: SelectionRow[][]): SelectionRow[] {
  const byKey = new Map<string, SelectionRow>();
  for (const rows of perTopic) {
    for (const row of rows) {
      const key = `${row.headword.toLowerCase()}::${row.pos.toLowerCase()}`;
      const existing = byKey.get(key);
      if (existing) {
        const topics = new Set(existing.topic.split(',').map((t) => t.trim()));
        topics.add(row.topic);
        existing.topic = Array.from(topics).join(',');
      } else {
        byKey.set(key, { ...row });
      }
    }
  }
  return Array.from(byKey.values());
}

// Round-robin по темам, а не плоский slice: иначе тема, обработанная первой
// (и давшая много совпадений с seed), вытесняет остальные темы из лимита —
// ровно это произошло на пилоте (все 25 слов оказались из "restaurant").
export function roundRobinByTopic(perTopic: SelectionRow[][], limit: number, mergedByKey: Map<string, SelectionRow>): SelectionRow[] {
  const inSeedPerTopic = perTopic.map((rows) => rows.filter((r) => r.inSeed));
  const cursors = inSeedPerTopic.map(() => 0);
  const seen = new Set<string>();
  const picked: SelectionRow[] = [];
  let progressed = true;
  while (picked.length < limit && progressed) {
    progressed = false;
    for (let i = 0; i < inSeedPerTopic.length; i++) {
      if (picked.length >= limit) break;
      const list = inSeedPerTopic[i];
      while (cursors[i] < list.length) {
        const row = list[cursors[i]++];
        const key = `${row.headword.toLowerCase()}::${row.pos.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        picked.push(mergedByKey.get(key) ?? row);
        progressed = true;
        break;
      }
    }
  }
  return picked;
}

export interface SelectForTopicsOptions {
  topics: string[];
  seed: SeedRow[];
  candidatesPerTopic: number;
  limit?: number;
  model: string;
  chatFn?: ChatFn;
}

export interface SelectForTopicsResult {
  selection: SelectionRow[];
  usage: { promptTokens: number; completionTokens: number }[];
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

export async function selectForTopics(opts: SelectForTopicsOptions): Promise<SelectForTopicsResult> {
  const chat = opts.chatFn ?? callOpenAiChat;
  const perTopic: SelectionRow[][] = [];
  const usage: { promptTokens: number; completionTokens: number }[] = [];
  for (const topic of opts.topics) {
    const { system, user } = buildPrompt(topic, opts.candidatesPerTopic);
    const words = await withRetry(async () => {
      const result = await chat({
        model: opts.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      usage.push(result.usage);
      return parseCandidateWords(result.content);
    });
    perTopic.push(intersectWithSeed(topic, words, opts.seed));
  }
  const merged = mergeSelections(perTopic);
  let result = merged;
  if (opts.limit !== undefined) {
    const mergedByKey = new Map(merged.map((r) => [`${r.headword.toLowerCase()}::${r.pos.toLowerCase()}`, r]));
    const inSeed = roundRobinByTopic(perTopic, opts.limit, mergedByKey);
    const outOfSeed = merged.filter((r) => !r.inSeed);
    result = [...inSeed, ...outOfSeed];
  }
  return { selection: result, usage };
}

export function selectionToCsv(rows: SelectionRow[]): string {
  return toCsv(
    ['headword', 'pos', 'cefr', 'topic', 'in_seed'],
    rows.map((r) => [r.headword, r.pos, r.cefr ?? '', r.topic, r.inSeed ? 'true' : 'false']),
  );
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string, fallback?: string) => {
    const found = args.find((a) => a.startsWith(`--${name}=`));
    return found ? found.split('=').slice(1).join('=') : fallback;
  };
  const topicsArg = getArg('topics');
  const model = getArg('model');
  const runId = getArg('run-id');
  const limitArg = getArg('limit');
  const candidatesPerTopicArg = getArg('candidates-per-topic', '150');
  if (!topicsArg || !model || !runId) {
    console.error('Использование: select-topic.ts --topics=restaurant,hotel --model=<model> --run-id=<id> [--limit=500]');
    process.exit(1);
  }
  const seedCsv = readFileSync(path.join(DATA_DIR, 'cefr_seed.csv'), 'utf8');
  const seed = loadSeed(seedCsv);
  const result = await selectForTopics({
    topics: topicsArg.split(',').map((t) => t.trim()),
    seed,
    candidatesPerTopic: Number(candidatesPerTopicArg),
    limit: limitArg ? Number(limitArg) : undefined,
    model,
  });
  const dir = runDir(runId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'selection.csv'), selectionToCsv(result.selection), 'utf8');
  writeFileSync(path.join(dir, 'select-usage.json'), JSON.stringify(result.usage, null, 2), 'utf8');
  const inSeedCount = result.selection.filter((r) => r.inSeed).length;
  console.log(`selection.csv: ${result.selection.length} строк (${inSeedCount} из seed)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
