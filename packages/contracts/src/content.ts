// Общий контент словаря (сервер и пакет словаря на устройстве, пользователи не меняют).
// Источник правды по смыслу — docs/data-model.md.
import { z } from 'zod';

export const LangSchema = z.enum(['en', 'ru', 'tr']);
export type Lang = z.infer<typeof LangSchema>;

export const CefrSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
export type Cefr = z.infer<typeof CefrSchema>;

// UUID и ISO-дата валидируются структурно (строка), без формата: строгая
// проверка формата откладывается до появления реальных данных с бэкенда,
// чтобы не отбрасывать валидные тестовые фикстуры на неточном regexp.
export const UuidSchema = z.string();
export type Uuid = z.infer<typeof UuidSchema>;

export const IsoDateSchema = z.string();
export type IsoDate = z.infer<typeof IsoDateSchema>;

export const LexemeSchema = z.object({
  id: UuidSchema,
  lang: LangSchema,
  lemma: z.string(),
  pos: z.string(),
  ipa: z.string().optional(),
  audioUrl: z.string().optional(),
  frequencyRank: z.number().optional(),
});
export type Lexeme = z.infer<typeof LexemeSchema>;

export const ReviewStatusSchema = z.enum(['unverified', 'verified', 'rejected']);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const SenseSchema = z.object({
  id: UuidSchema,
  lexemeId: UuidSchema,
  conceptId: UuidSchema,
  cefr: CefrSchema,
  tags: z.array(z.string()),
  frequencyRank: z.number().optional(),
  status: ReviewStatusSchema,
});
export type Sense = z.infer<typeof SenseSchema>;

export const ExpressionSchema = z.object({
  id: UuidSchema,
  lang: LangSchema,
  text: z.string(),
  cefr: CefrSchema,
  tags: z.array(z.string()),
  audioUrl: z.string().optional(),
  conceptIds: z.array(UuidSchema),
  status: ReviewStatusSchema,
});
export type Expression = z.infer<typeof ExpressionSchema>;

// Карточка ссылается на значение (sense) или выражение — никогда на лемму.
export const ItemTypeSchema = z.enum(['sense', 'expression']);
export type ItemType = z.infer<typeof ItemTypeSchema>;

export const ItemRefSchema = z.object({
  itemType: ItemTypeSchema,
  itemId: UuidSchema,
});
export type ItemRef = z.infer<typeof ItemRefSchema>;

export const TranslationSourceSchema = z.enum(['dictionary', 'llm', 'via_concept']);
export type TranslationSource = z.infer<typeof TranslationSourceSchema>;

export const TranslationSchema = z.object({
  id: UuidSchema,
  targetType: ItemTypeSchema,
  targetId: UuidSchema,
  lang: LangSchema,
  text: z.string(),
  source: TranslationSourceSchema,
  verified: z.boolean(),
});
export type Translation = z.infer<typeof TranslationSchema>;

export const ExampleSchema = z.object({
  id: UuidSchema,
  targetType: ItemTypeSchema,
  targetId: UuidSchema,
  lang: LangSchema,
  text: z.string(),
  highlight: z.tuple([z.number(), z.number()]).optional(),
  audioUrl: z.string().optional(),
  translations: z.partialRecord(LangSchema, z.string()),
});
export type Example = z.infer<typeof ExampleSchema>;

// Общий тип превью для локального поиска в mobile и будущего API редких слов.
export const ItemPreviewSchema = z.object({
  itemType: ItemTypeSchema,
  itemId: UuidSchema,
  lemma: z.string(),
  pos: z.string(),
  ipa: z.string().optional(),
  audioUrl: z.string().optional(),
  cefr: CefrSchema,
  translation: z.string(),
  example: z.string().optional(),
  exampleHighlight: z.tuple([z.number(), z.number()]).optional(),
  exampleTranslation: z.string().optional(),
});
export type ItemPreview = z.infer<typeof ItemPreviewSchema>;
