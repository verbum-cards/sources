// Внутренние схемы конвейера словаря. Это НЕ @cards/contracts: формат черновика
// значения ещё не устоялся (нет ru/example в контрактном Sense, нет concept_id
// на этом этапе) и пока не нужен ни mobile, ни будущему API-рантайму.
// Как только значение проходит проверку редактором и импортируется в пакет
// словаря, оно превращается в записи lexeme/sense/translation/example из
// packages/contracts/src/dictionary.ts — это отдельный, ещё не реализованный шаг.
import { z } from 'zod';
import { CefrSchema } from '@cards/contracts';

// Строка исходного списка (data/cefr_seed.csv).
export const SeedRowSchema = z.object({
  headword: z.string().min(1),
  pos: z.string().min(1),
  cefr: CefrSchema,
  source: z.literal('cefr-j'),
  license: z.literal('cefr-j-free-cite'),
});
export type SeedRow = z.infer<typeof SeedRowSchema>;

// Строка отбора по темам (data/runs/<runId>/selection.csv).
export const SelectionRowSchema = z.object({
  headword: z.string(),
  pos: z.string(),
  cefr: CefrSchema.optional(),
  topic: z.string(),
  inSeed: z.boolean(),
});
export type SelectionRow = z.infer<typeof SelectionRowSchema>;

// Сырой ответ LLM — ровно схема из references/prompt.md.
export const RawSenseSchema = z.object({
  level: CefrSchema,
  tags: z.array(z.string()),
  ru: z.string(),
  example: z.string(),
  example_ru: z.string(),
});

export const RawExpressionSchema = z.object({
  text: z.string(),
  level: CefrSchema,
  tags: z.array(z.string()),
  ru: z.string(),
});

export const RawLlmResponseSchema = z.object({
  lemma: z.string(),
  pos: z.string(),
  ipa: z.string().optional().default(''),
  senses: z.array(RawSenseSchema),
  expressions: z.array(RawExpressionSchema).optional().default([]),
});
export type RawLlmResponse = z.infer<typeof RawLlmResponseSchema>;

// Денормализованный черновик значения — формат data/senses_sample.json
// и data/runs/<runId>/senses.json. Источник данных о значении всегда 'llm'
// (пилот T1.6), но cefrSource различает: уровень из лицензированного seed-списка
// у самого частотного значения или размеченный LLM у остальных.
export const CefrSourceSchema = z.enum(['cefr-j', 'llm']);

export const DraftSenseSchema = z.object({
  senseId: z.string(),
  lemma: z.string(),
  pos: z.string(),
  ipa: z.string().optional(),
  cefr: CefrSchema,
  cefrSource: CefrSourceSchema,
  tags: z.array(z.string()),
  ru: z.string(),
  example: z.string(),
  highlight: z.tuple([z.number(), z.number()]).nullable(),
  exampleRu: z.string(),
  source: z.literal('llm'),
  status: z.literal('unverified'),
  model: z.string(),
  runId: z.string(),
});
export type DraftSense = z.infer<typeof DraftSenseSchema>;

export const DraftExpressionSchema = z.object({
  expressionId: z.string(),
  text: z.string(),
  cefr: CefrSchema,
  tags: z.array(z.string()),
  ru: z.string(),
  source: z.literal('llm'),
  status: z.literal('unverified'),
  model: z.string(),
  runId: z.string(),
});
export type DraftExpression = z.infer<typeof DraftExpressionSchema>;

export const RejectedRecordSchema = z.object({
  senseId: z.string().optional(),
  lemma: z.string(),
  pos: z.string(),
  reason: z.string(),
  detail: z.string().optional(),
});
export type RejectedRecord = z.infer<typeof RejectedRecordSchema>;
