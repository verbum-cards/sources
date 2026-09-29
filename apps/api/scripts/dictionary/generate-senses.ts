import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { z } from 'zod';

import { CefrSchema, type Cefr } from '@cards/contracts';

import { parseLlmInputsCsv, type LlmInput } from './llm-inputs';

// Этап 2 конвейера словаря (skill dictionary-pipeline, references/prompt.md)
// — один вызов LLM на слово из data/cefr_seed_prepared.csv. Пишет:
// - data/senses/<batch>.json — полный ответ модели (все значения,
//   выражения, теги, токены) на будущее, без потерь;
// - apps/mobile/src/mocks/words.ts — только основное (самое частотное)
//   значение каждого слова, тем же MockWord-форматом, что уже есть в файле
//   (159 слов вручную). Второстепенные значения (полисемия) в mocks не
//   идут — сейчас там всегда одна лемма = одна запись (see WORDS_BY_LEMMA
//   в words.ts, бросает исключение на дубликате), заводить многозначность
//   в моках — задача настоящей модели данных (T1.6), не этого скрипта.
// "expressions" из ответа в mocks тоже не идут в этом проходе — не входили
// в задачу "по 100 слов", остаются в сыром JSON для отдельного шага;
// - apps/mobile/src/mocks/decks.ts — та же лемма добавляется в служебную
//   колоду «Проверка партий» (REVIEW_DECK_ID), чтобы владелец продукта мог
//   открыть партию на телефоне и проверить, не разбирая мок-файлы руками.

const MODEL_BY_LEVEL: Record<Cefr, string> = {
  A0: 'gpt-5.4-mini',
  A1: 'gpt-5.4-mini',
  A2: 'gpt-5.4-mini',
  B1: 'gpt-5.4-mini',
  B2: 'gpt-5.4-mini',
  C1: 'gpt-4o',
  C2: 'gpt-4o',
};

const CONCURRENCY = 5;

const ExampleZ = z.object({
  text: z.string().min(1),
  translation: z.string().min(1),
});

const SenseZ = z.object({
  level: CefrSchema,
  tags: z.array(z.string()).min(1).max(3),
  ru: z.string().min(1),
  definition: z.string().min(1),
  examples: z.array(ExampleZ).length(2),
});

const ExpressionZ = z.object({
  text: z.string().min(1),
  level: CefrSchema,
  tags: z.array(z.string()).min(1).max(3),
  ru: z.string().min(1),
  definition: z.string().min(1),
  examples: z.array(ExampleZ).length(2),
});

const ResponseZ = z.object({
  senses: z.array(SenseZ).min(1).max(4),
  expressions: z.array(ExpressionZ),
});
type LlmResponse = z.infer<typeof ResponseZ>;

interface MockWordDraft {
  itemId: string;
  itemType: 'sense';
  lemma: string;
  pos: string;
  ipa: string | undefined;
  translation: string;
  examples: readonly { text: string; translation: string }[];
  definition: string;
  cefr: Cefr;
}

interface WordResult {
  input: LlmInput;
  status: 'ok' | 'error';
  raw?: LlmResponse;
  tags?: readonly string[];
  draft?: MockWordDraft;
  error?: string;
  usage?: { model: string; promptTokens: number; completionTokens: number };
}

// Порт apps/mobile/src/utilities/id.ts::uuidv7 — тот же алгоритм, отдельная
// копия: этот скрипт запускается через Node (не через мобильное приложение),
// а общих небиблиотечных утилит между apps/mobile и apps/api сейчас нет
// (правило 6 в CLAUDE.md — про типы в @cards/contracts, не про такие функции).
function uuidv7(): string {
  const timestamp = BigInt(Date.now());
  const bytes = new Uint8Array(16);
  for (let i = 5; i >= 0; i--) {
    bytes[i] = Number((timestamp >> BigInt((5 - i) * 8)) & 0xffn);
  }
  for (let i = 6; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function loadTags(tagsPath: string): string[] {
  const text = readFileSync(tagsPath, 'utf8');
  const tags: string[] = [];
  for (const match of text.matchAll(/^\|\s*`([a-z_]+)`/gm)) {
    tags.push(match[1]);
  }

  return tags;
}

function buildJsonSchema(tags: readonly string[]) {
  const exampleSchema = {
    type: 'object',
    properties: {
      text: { type: 'string' },
      translation: { type: 'string' },
    },
    required: ['text', 'translation'],
    additionalProperties: false,
  };
  const senseSchema = {
    type: 'object',
    properties: {
      level: { type: 'string', enum: ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
      tags: { type: 'array', items: { type: 'string', enum: tags }, minItems: 1, maxItems: 3 },
      ru: { type: 'string' },
      definition: { type: 'string' },
      examples: { type: 'array', items: exampleSchema, minItems: 2, maxItems: 2 },
    },
    required: ['level', 'tags', 'ru', 'definition', 'examples'],
    additionalProperties: false,
  };
  const expressionSchema = {
    ...senseSchema,
    properties: { text: { type: 'string' }, ...senseSchema.properties },
    required: ['text', ...senseSchema.required],
  };

  return {
    type: 'object',
    properties: {
      senses: { type: 'array', items: senseSchema, minItems: 1, maxItems: 4 },
      expressions: { type: 'array', items: expressionSchema },
    },
    required: ['senses', 'expressions'],
    additionalProperties: false,
  };
}

const SYSTEM_PROMPT = (
  tags: readonly string[]
) => `Ты — лексикограф, готовящий учебный англо-русский словарь для русскоязычных, изучающих английский. Отвечай только JSON по схеме, без пояснений.
Правила:
- Выдели основные значения слова для указанной части речи, не больше 4, от самого частотного к редкому. Тест на дробление: два значения — это два значения, только если пример одного нельзя описать переводом другого. Если один и тот же перевод (пусть и другими словами) годится для обоих примеров — это одно значение, оставь только его, с одним переводом и одним набором примеров. При сомнении — объединяй, а не дроби.
  Пример «не дробить»: для "menu" не заводи отдельные значения «выбор блюд» / «список блюд» / «предложение блюд от шефа» — все три примера про один и тот же ресторанный список блюд, это один смысл, разными словами описанный.
  Пример «можно различать»: для "menu" отдельное значение — «список команд в компьютерной программе или на экране» (File menu) — другой предмет, друг друга не заменяют, оставь оба значения.
- Для каждого значения: уровень CEFR, 1–3 тега из списка (${tags.join(', ')}), русский перевод 1–4 слова, короткое определение на английском (1 предложение, как в словаре для изучающих язык — не копируй и не пересказывай из закрытых источников), два оригинальных примера 5–12 слов каждый из разных контекстов (не перефразировка одного и того же предложения), у каждого свой естественный русский перевод.
- Примеры должны звучать как живая речь, лексика не сложнее уровня значения + 1. Не используй и не пересказывай примеры из известных словарей.
- Перед ответом проверь: \`ru\` и перевод каждого примера должны передавать один и тот же смысл слова — если \`ru\` не подходит к примеру, это ошибка, исправь \`ru\`, а не переписывай пример.
- Если слово — часть устойчивого выражения, которое важно для учащихся, добавь его в "expressions", с тем же набором полей плюс "text" — сама фраза.
- IPA не нужна.`;

function buildUserPrompt(input: LlmInput): string {
  return `Слово: ${input.lemma}
Часть речи: ${input.pos}
Уровень из списка: ${input.seedLevel}
Уровень самого частотного значения должен быть ровно ${input.seedLevel}; остальные значения — не ниже этого уровня.`;
}

async function callOpenAi(
  apiKey: string,
  model: string,
  system: string,
  user: string,
  schema: unknown
): Promise<{ parsed: LlmResponse; usage: { promptTokens: number; completionTokens: number } }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'word_senses', strict: true, schema },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
  }

  const body = (await response.json()) as {
    choices: readonly { message: { content: string } }[];
    usage: { prompt_tokens: number; completion_tokens: number };
  };
  const content = body.choices[0]?.message.content;
  if (!content) {
    throw new Error('OpenAI: пустой ответ');
  }

  const parsed = ResponseZ.parse(JSON.parse(content));

  return {
    parsed,
    usage: {
      promptTokens: body.usage.prompt_tokens,
      completionTokens: body.usage.completion_tokens,
    },
  };
}

async function processWord(
  apiKey: string,
  tags: readonly string[],
  input: LlmInput
): Promise<WordResult> {
  const model = MODEL_BY_LEVEL[input.seedLevel];
  try {
    const schema = buildJsonSchema(tags);
    const { parsed, usage } = await callOpenAi(
      apiKey,
      model,
      SYSTEM_PROMPT(tags),
      buildUserPrompt(input),
      schema
    );

    const primary =
      parsed.senses.find((sense) => sense.level === input.seedLevel) ?? parsed.senses[0];
    const draft: MockWordDraft = {
      itemId: uuidv7(),
      itemType: 'sense',
      lemma: input.lemma,
      pos: input.pos,
      ipa: input.ipaUk ?? input.ipaUs,
      translation: primary.ru,
      examples: primary.examples,
      definition: primary.definition,
      cefr: primary.level,
    };

    return {
      input,
      status: 'ok',
      raw: parsed,
      tags,
      draft,
      usage: { model, ...usage },
    };
  } catch (error) {
    return {
      input,
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runPool<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
) {
  const results = new Array<R>(items.length);
  let next = 0;
  async function lane(): Promise<void> {
    for (;;) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, lane));

  return results;
}

function serializeMockWord(draft: MockWordDraft): string {
  const exampleLines = draft.examples
    .map(
      (example) =>
        `      { text: ${JSON.stringify(example.text)}, translation: ${JSON.stringify(example.translation)} },`
    )
    .join('\n');

  const ipaLine = draft.ipa ? `\n    ipa: ${JSON.stringify(draft.ipa)},` : '';

  return `  {
    itemId: ${JSON.stringify(draft.itemId)},
    itemType: 'sense',
    lemma: ${JSON.stringify(draft.lemma)},
    pos: ${JSON.stringify(draft.pos)},${ipaLine}
    translation: ${JSON.stringify(draft.translation)},
    examples: [
${exampleLines}
    ],
    definition: ${JSON.stringify(draft.definition)},
    cefr: ${JSON.stringify(draft.cefr)},
  },`;
}

function appendToMocks(mocksPath: string, drafts: readonly MockWordDraft[]): void {
  if (drafts.length === 0) return;

  const source = readFileSync(mocksPath, 'utf8');
  const marker = '\n];';
  const insertAt = source.lastIndexOf(marker);
  if (insertAt === -1) {
    throw new Error(`appendToMocks: не нашёл конец массива WORDS в ${mocksPath}`);
  }

  const block = drafts.map(serializeMockWord).join('\n');
  const updated = `${source.slice(0, insertAt)}\n${block}${source.slice(insertAt)}`;
  writeFileSync(mocksPath, updated, 'utf8');
}

// Служебная колода «Проверка партий» (mocks/decks.ts, REVIEW_DECK_ID) —
// последняя запись в DECKS, единственная с таким закрытием (items массива +
// объекта колоды + самого DECKS подряд) — этим и находим место вставки.
function appendToReviewDeck(decksPath: string, drafts: readonly MockWordDraft[]): void {
  if (drafts.length === 0) return;

  const source = readFileSync(decksPath, 'utf8');
  const closing = '\n    ]),\n  },\n];';
  const insertAt = source.lastIndexOf(closing);
  if (insertAt === -1) {
    throw new Error(`appendToReviewDeck: не нашёл конец items служебной колоды в ${decksPath}`);
  }

  const lines = drafts
    .map((draft) => `      { lemma: ${JSON.stringify(draft.lemma)}, importance: 2 },`)
    .join('\n');
  const updated = `${source.slice(0, insertAt)}\n${lines}${source.slice(insertAt)}`;
  writeFileSync(decksPath, updated, 'utf8');
}

async function main(): Promise<void> {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const apiDir = join(scriptDir, '..', '..');
  const repoRoot = join(apiDir, '..', '..');

  try {
    process.loadEnvFile(join(repoRoot, '.env'));
  } catch {
    // .env нет — например, ключ уже в окружении процесса.
  }

  const apiKey = process.env.OPENAI_WORDS_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_WORDS_API_KEY не найден — добавь его в .env в корне репозитория');
  }

  const countArg = process.argv.find((arg) => arg.startsWith('--count='));
  const batchSize = countArg ? Number(countArg.slice('--count='.length)) : 100;

  const dataDir = join(repoRoot, 'data');
  const preparedPath = join(dataDir, 'cefr_seed_prepared.csv');
  const mocksPath = join(repoRoot, 'apps', 'mobile', 'src', 'mocks', 'words.ts');
  const decksPath = join(repoRoot, 'apps', 'mobile', 'src', 'mocks', 'decks.ts');
  const tagsPath = join(
    repoRoot,
    '.claude',
    'skills',
    'dictionary-pipeline',
    'references',
    'tags.md'
  );

  const tags = loadTags(tagsPath);
  const preparedRows = parseLlmInputsCsv(readFileSync(preparedPath, 'utf8'));

  const mocksModule = (await import(pathToFileURL(mocksPath).href)) as {
    WORDS: readonly { lemma: string }[];
  };
  const existingLemmas = new Set(mocksModule.WORDS.map((word) => word.lemma));

  // MockWord.lemma уникальна во всём WORDS независимо от pos (см.
  // WORDS_BY_LEMMA в words.ts) — а data/cefr_seed_prepared.csv группирует по
  // (lemma, pos), поэтому одна и та же лемма может встретиться двумя
  // строками с разными pos ("about" как preposition и как adverb). Берём
  // только первую строку на лемму — первая по файлу, то есть с более
  // частотным/ранним уровнем CEFR.
  const seenLemmas = new Set<string>();
  const prepared = preparedRows.filter((input) => {
    if (seenLemmas.has(input.lemma)) return false;
    seenLemmas.add(input.lemma);

    return true;
  });

  const candidates = prepared
    .filter((input) => !existingLemmas.has(input.lemma))
    .slice(0, batchSize);
  if (candidates.length === 0) {
    console.log(
      'Нечего генерировать — все слова из cefr_seed_prepared.csv уже есть в mocks/words.ts.'
    );

    return;
  }

  console.log(`Беру ${candidates.length} слов (запрошено ${batchSize})...`);
  const results = await runPool(candidates, CONCURRENCY, (input) =>
    processWord(apiKey, tags, input)
  );

  const ok = results.filter((result) => result.status === 'ok');
  const failed = results.filter((result) => result.status === 'error');

  const drafts = ok.map((result) => result.draft!);
  appendToMocks(mocksPath, drafts);
  appendToReviewDeck(decksPath, drafts);

  const batchStamp = new Date().toISOString().replace(/[:.]/g, '-');
  const rawDir = join(dataDir, 'senses');
  writeFileSync(
    join(rawDir, `${batchStamp}.json`),
    JSON.stringify(
      results.map((result) => ({
        lemma: result.input.lemma,
        pos: result.input.pos,
        seedLevel: result.input.seedLevel,
        status: result.status,
        raw: result.raw,
        error: result.error,
        usage: result.usage,
      })),
      null,
      2
    ),
    'utf8'
  );

  const usageByModel = new Map<
    string,
    { promptTokens: number; completionTokens: number; count: number }
  >();
  for (const result of ok) {
    if (!result.usage) continue;
    const acc = usageByModel.get(result.usage.model) ?? {
      promptTokens: 0,
      completionTokens: 0,
      count: 0,
    };
    acc.promptTokens += result.usage.promptTokens;
    acc.completionTokens += result.usage.completionTokens;
    acc.count += 1;
    usageByModel.set(result.usage.model, acc);
  }

  console.log(`Готово: ${ok.length} успешно, ${failed.length} с ошибкой.`);
  console.log(`Добавлено в ${mocksPath}: ${drafts.length} слов.`);
  console.log(
    `Добавлено в служебную колоду «Проверка партий» (${decksPath}): ${drafts.length} слов.`
  );
  console.log(`Полный ответ модели: ${join(rawDir, `${batchStamp}.json`)}`);
  for (const [model, usage] of usageByModel) {
    console.log(
      `  ${model}: ${usage.count} слов, ${usage.promptTokens} input-токенов, ${usage.completionTokens} output-токенов`
    );
  }
  if (failed.length > 0) {
    console.log('Ошибки:');
    for (const result of failed) {
      console.log(`  ${result.input.lemma} (${result.input.pos}): ${result.error}`);
    }
  }
}

void main();
