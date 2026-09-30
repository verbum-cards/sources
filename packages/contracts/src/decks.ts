// Колоды: официальные (с обязательным контекстом, FR-49), пользовательские, общие.
import { z } from 'zod';

import { CefrSchema, ItemTypeSchema, LangSchema, UuidSchema } from './content';

export const DeckContextSchema = z.object({
  situation: z.string(),
  roles: z.object({
    learner: z.string(),
    partner: z.string(),
    learnerGoal: z.string(),
    partnerGoal: z.string().optional(),
  }),
  register: z.enum(['polite', 'neutral', 'casual']),
  branches: z.array(z.string()),
  cultureNotes: z.array(z.string()),
});
export type DeckContext = z.infer<typeof DeckContextSchema>;

export const DeckTypeSchema = z.enum(['official', 'user', 'shared']);
export type DeckType = z.infer<typeof DeckTypeSchema>;

// Категории каталога колод (ADR-35) — тема/ситуация, не цель изучения из
// онбординга (Goal, user.ts): «Первые шаги» — про уровень, остальные — про
// предметную область. Колода может быть в нескольких категориях сразу.
// Заменяет группировку по goalTags/Goal (ADR-24).
export const DeckCategorySchema = z.enum([
  'basics',
  'firstSteps',
  'workOffice',
  'businessCareer',
  'abroad',
  'health',
  'shopping',
  'cafeRestaurant',
  'travelLeisure',
  'transportCity',
  'opinion',
  'emotionsRelationships',
  'itTech',
  'sportsHobbies',
  'homeLife',
  'moviesBooks',
  'study',
  'socializing',
]);
export type DeckCategory = z.infer<typeof DeckCategorySchema>;

export const DeckSchema = z.object({
  id: UuidSchema,
  lang: LangSchema,
  nativeLang: LangSchema,
  title: z.string(),
  categories: z.array(DeckCategorySchema),
  type: DeckTypeSchema,
  // Обязателен для type: 'official' (FR-49) — проверяется на этапе публикации, не схемой.
  context: DeckContextSchema.optional(),
  // Порядок показа внутри категории (decks.screen.tsx::CategoryDetail
  // сортирует по убыванию) — та же шкала 1–3, что и у DeckItem.importance
  // (слово внутри колоды), просто уровнем выше: не «насколько важно слово в
  // колоде», а «насколько важна сама колода в категории».
  importance: z.literal([1, 2, 3]),
});
export type Deck = z.infer<typeof DeckSchema>;

export const DeckItemSchema = z.object({
  deckId: UuidSchema,
  itemType: ItemTypeSchema,
  itemId: UuidSchema,
  cefr: CefrSchema,
  position: z.number(),
  importance: z.literal([1, 2, 3]),
});
export type DeckItem = z.infer<typeof DeckItemSchema>;
