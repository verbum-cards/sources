// Пользовательские данные (на устройстве, синхронизируются; всё с user_id).
// Источник правды по протоколу — docs/sync-protocol.md (ADR-14).
import { z } from 'zod';

import { CefrSchema, IsoDateSchema, ItemTypeSchema, LangSchema, UuidSchema } from './content';
// FieldRevisions живёт в sync.ts; здесь нужен только как тип (см. CardStored
// и др. ниже) — type-only импорт не создаёт рантайм-цикл user.ts <-> sync.ts.
import type { FieldRevisions } from './sync';

export const GoalSchema = z.enum(['travel', 'work', 'move', 'exam', 'media', 'self']);
export type Goal = z.infer<typeof GoalSchema>;

export const UserLevelSchema = z.union([CefrSchema, z.literal('unknown')]);
export type UserLevel = z.infer<typeof UserLevelSchema>;

// updatedAt — производное (max(ts) по fieldRevisions записи), в контракте
// сущности остаётся для локального чтения, но не входит в патчи синхронизации
// (см. UserProfilePatchSchema ниже) — по журналу оно не едет.
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

// Намерение пользователя — синхронизируется. Фаза обучения (new/learning/review)
// — производное от card_schedule/журнала, не синхронизируется и не описывается
// здесь (см. apps/mobile/src/db/types.ts: CardScheduleRow.fsrs_state).
export const CardStatusSchema = z.enum(['active', 'suspended', 'known']);
export type CardStatus = z.infer<typeof CardStatusSchema>;

// Личные правки полей карточки. Ключи для FieldRevisions (src/sync.ts) — плоские:
// overrides.translation, overrides.example, overrides.note. Каждый ключ nullable,
// чтобы отличить «не менялось» (ключ отсутствует в патче) от «стёрто» (null).
export const CardOverridesSchema = z.object({
  translation: z.string().nullable().optional(),
  example: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});
export type CardOverrides = z.infer<typeof CardOverridesSchema>;

// Поля, у которых «нет значения» — валидное постоянное состояние записи (не
// «отсутствует в объекте»), поэтому они nullable, а не optional: это то же самое
// различие, что и в overrides, но на уровне всей карточки (sourceDeckId,
// mergedIntoCardId, deletedAt).
export const CardSchema = z.object({
  id: UuidSchema, // UUID v7, создаёт клиент
  userId: UuidSchema,
  itemType: ItemTypeSchema,
  itemId: UuidSchema,
  sourceDeckId: UuidSchema.nullable(),
  overrides: CardOverridesSchema.nullable(),
  status: CardStatusSchema,
  // Слияние дублей (docs/sync-protocol.md → «Дубли карточек»): проигравшая
  // карточка получает deletedAt (через kind='delete') и mergedIntoCardId
  // победителя (через отдельный upsert, т.к. delete не несёт fields).
  mergedIntoCardId: UuidSchema.nullable(),
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
  deletedAt: IsoDateSchema.nullable(),
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

// deletedAt — обычное синхронизируемое поле (не как у card): «убрал колоду →
// добавил снова» выражается upsert'ом с deletedAt = null, потому что entityId
// user_deck — это deckId, он не меняется и должен уметь «воскреснуть».
export const UserDeckSchema = z.object({
  userId: UuidSchema,
  deckId: UuidSchema,
  addedAt: IsoDateSchema,
  fastMode: z.boolean(),
  updatedAt: IsoDateSchema,
  deletedAt: IsoDateSchema.nullable(),
});
export type UserDeck = z.infer<typeof UserDeckSchema>;

// ---------- Типы хранения: сущность + локальные метаданные конфликтов ----------
// FieldRevisions не является полем XSchema/патчей — это только тип для локальной
// колонки field_meta (apps/mobile/src/db). Если добавить его в саму XSchema, он
// случайно попадёт в SYNCED_FIELDS и начнёт валидироваться как синхронизируемое
// поле, а это не так: метаданные правок сами по журналу не едут.
export type CardStored = Card & { fieldRevisions: FieldRevisions };
export type UserProfileStored = UserProfile & { fieldRevisions: FieldRevisions };
export type UserDeckStored = UserDeck & { fieldRevisions: FieldRevisions };

// ---------- Типизированные патчи для операций синхронизации (см. sync.ts) ----------

// Полный набор обязательных полей для первого появления записи (kind='create').
// updatedAt (производное), deletedAt и mergedIntoCardId (недостижимы в момент
// создания — появляются только последующими операциями) в CardCreate нет.
export const CardCreateSchema = CardSchema.omit({
  id: true,
  userId: true,
  updatedAt: true,
  deletedAt: true,
  mergedIntoCardId: true,
});
export type CardCreate = z.infer<typeof CardCreateSchema>;

// Частичный патч (kind='upsert'): только изменённые поля. itemType/itemId/
// createdAt неизменяемы после создания — в патче их нет вовсе. updatedAt
// (производное) и deletedAt (только через kind='delete') тоже исключены.
export const CardPatchSchema = CardSchema.omit({
  id: true,
  userId: true,
  itemType: true,
  itemId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
}).partial();
export type CardPatch = z.infer<typeof CardPatchSchema>;

// updatedAt — производное везде, поэтому его нет ни в одном патче синхронизации.
export const UserProfilePatchSchema = UserProfileSchema.omit({
  userId: true,
  updatedAt: true,
}).partial();
export type UserProfilePatch = z.infer<typeof UserProfilePatchSchema>;

export const UserDeckPatchSchema = UserDeckSchema.omit({
  userId: true,
  deckId: true,
  updatedAt: true,
}).partial();
export type UserDeckPatch = z.infer<typeof UserDeckPatchSchema>;

// review_log — только добавление (kind='create', см. sync.ts), патч не нужен:
// полезная нагрузка операции — весь журнал без id/userId (они уже есть в самой
// операции).
export const ReviewLogPayloadSchema = ReviewLogSchema.omit({ id: true, userId: true });
export type ReviewLogPayload = z.infer<typeof ReviewLogPayloadSchema>;
