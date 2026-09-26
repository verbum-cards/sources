// Пользовательские данные (на устройстве, синхронизируются; всё с user_id).
import { z } from 'zod';
import { CefrSchema, IsoDateSchema, ItemTypeSchema, LangSchema, UuidSchema } from './content';

export const GoalSchema = z.enum(['travel', 'work', 'move', 'exam', 'media', 'self']);
export type Goal = z.infer<typeof GoalSchema>;

export const UserLevelSchema = z.union([CefrSchema, z.literal('unknown')]);
export type UserLevel = z.infer<typeof UserLevelSchema>;

export const UserProfileSchema = z.object({
  userId: UuidSchema,
  nativeLang: LangSchema,
  targetLang: LangSchema,
  level: UserLevelSchema,
  goals: z.array(GoalSchema),
  dailyMinutes: z.literal([5, 10, 15]),
  newPerDay: z.number(),
  waitlistLangs: z.array(z.string()),
  updatedAt: IsoDateSchema,
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const CardStateSchema = z.enum(['new', 'learning', 'review', 'suspended', 'known']);
export type CardState = z.infer<typeof CardStateSchema>;

// Личные правки полей карточки. Ключи для FieldRevisions (src/sync.ts) — плоские:
// overrides.translation, overrides.example, overrides.note.
export const CardOverridesSchema = z.object({
  translation: z.string().optional(),
  example: z.string().optional(),
  note: z.string().optional(),
});
export type CardOverrides = z.infer<typeof CardOverridesSchema>;

export const CardSchema = z.object({
  id: UuidSchema, // UUID v7, создаёт клиент
  userId: UuidSchema,
  itemType: ItemTypeSchema,
  itemId: UuidSchema,
  sourceDeckId: UuidSchema.optional(),
  overrides: CardOverridesSchema.optional(),
  state: CardStateSchema,
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
  deletedAt: IsoDateSchema.optional(),
});
export type Card = z.infer<typeof CardSchema>;

export const RatingSchema = z.enum(['again', 'hard', 'good', 'easy']);
export type Rating = z.infer<typeof RatingSchema>;

export const ReviewLogSchema = z.object({
  id: UuidSchema, // UUID v7, = op_id операции синхронизации
  cardId: UuidSchema,
  userId: UuidSchema,
  rating: RatingSchema,
  reviewedAt: IsoDateSchema,
  elapsedMs: z.number(),
  deviceId: z.string(),
  tzOffsetMin: z.number(),
});
export type ReviewLog = z.infer<typeof ReviewLogSchema>;

export const UserDeckSchema = z.object({
  userId: UuidSchema,
  deckId: UuidSchema,
  addedAt: IsoDateSchema,
  fastMode: z.boolean(),
  updatedAt: IsoDateSchema,
  deletedAt: IsoDateSchema.optional(),
});
export type UserDeck = z.infer<typeof UserDeckSchema>;

// ---------- Типизированные патчи для операций синхронизации (см. sync.ts) ----------

export const CardPatchSchema = CardSchema.omit({ id: true, userId: true }).partial();
export type CardPatch = z.infer<typeof CardPatchSchema>;

export const UserProfilePatchSchema = UserProfileSchema.omit({ userId: true }).partial();
export type UserProfilePatch = z.infer<typeof UserProfilePatchSchema>;

export const UserDeckPatchSchema = UserDeckSchema.omit({ userId: true, deckId: true }).partial();
export type UserDeckPatch = z.infer<typeof UserDeckPatchSchema>;

// review_log — только добавление (см. docs/data-model.md), патч не нужен: полезная
// нагрузка операции — весь журнал без id/userId (они уже есть в самой операции).
export const ReviewLogPayloadSchema = ReviewLogSchema.omit({ id: true, userId: true });
export type ReviewLogPayload = z.infer<typeof ReviewLogPayloadSchema>;
