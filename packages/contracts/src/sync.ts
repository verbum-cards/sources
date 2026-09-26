// Синхронизация по журналу операций (docs/sync-protocol.md).
// Найденные противоречия протокола (entity_id для user_profile/user_deck,
// kind=delete для review_log, deck.type=user и т.п.) — предмет T1.5, не этого файла.
import { z } from 'zod';
import { IsoDateSchema, UuidSchema } from './content';
import { CardPatchSchema, ReviewLogPayloadSchema, UserDeckPatchSchema, UserProfilePatchSchema } from './user';

export const SYNC_SCHEMA_VERSION = 1;

export const SyncEntitySchema = z.enum(['card', 'review_log', 'user_profile', 'user_deck']);
export type SyncEntity = z.infer<typeof SyncEntitySchema>;

// Метаданные «последняя правка по полю» — для разрешения конфликтов last-write-wins
// на уровне поля, а не всей записи. Ключи для личных правок карточки — плоские:
// overrides.translation, overrides.example, overrides.note.
export const FieldRevisionsSchema = z.record(z.string(), z.object({ ts: IsoDateSchema, deviceId: z.string() }));
export type FieldRevisions = z.infer<typeof FieldRevisionsSchema>;

const SyncOpKindSchema = z.enum(['upsert', 'delete']);
export type SyncOpKind = z.infer<typeof SyncOpKindSchema>;

const syncOpBase = {
  opId: UuidSchema,
  schemaVersion: z.number(),
  deviceId: z.string(),
  userId: UuidSchema,
  entityId: UuidSchema,
  clientTs: IsoDateSchema,
};

export const CardSyncOpSchema = z.object({
  ...syncOpBase,
  entity: z.literal('card'),
  kind: SyncOpKindSchema,
  fields: CardPatchSchema.nullable(),
});
export type CardSyncOp = z.infer<typeof CardSyncOpSchema>;

export const ReviewLogSyncOpSchema = z.object({
  ...syncOpBase,
  entity: z.literal('review_log'),
  kind: z.literal('upsert'), // журнал только добавляется, delete недопустим
  fields: ReviewLogPayloadSchema,
});
export type ReviewLogSyncOp = z.infer<typeof ReviewLogSyncOpSchema>;

export const UserProfileSyncOpSchema = z.object({
  ...syncOpBase,
  entity: z.literal('user_profile'),
  kind: z.literal('upsert'),
  fields: UserProfilePatchSchema,
});
export type UserProfileSyncOp = z.infer<typeof UserProfileSyncOpSchema>;

export const UserDeckSyncOpSchema = z.object({
  ...syncOpBase,
  entity: z.literal('user_deck'),
  kind: SyncOpKindSchema,
  fields: UserDeckPatchSchema.nullable(),
});
export type UserDeckSyncOp = z.infer<typeof UserDeckSyncOpSchema>;

export const SyncOpTypedSchema = z.discriminatedUnion('entity', [
  CardSyncOpSchema,
  ReviewLogSyncOpSchema,
  UserProfileSyncOpSchema,
  UserDeckSyncOpSchema,
]);
export type SyncOpTyped = z.infer<typeof SyncOpTypedSchema>;

// Рантайм-список разрешённых полей операции по сущности — выводится из тех же
// схем, что и патчи, поэтому не может разойтись с типами.
export const SYNCED_FIELDS: Record<SyncEntity, readonly string[]> = {
  card: Object.keys(CardPatchSchema.shape),
  review_log: Object.keys(ReviewLogPayloadSchema.shape),
  user_profile: Object.keys(UserProfilePatchSchema.shape),
  user_deck: Object.keys(UserDeckPatchSchema.shape),
};

export const SyncPushRequestSchema = z.object({
  deviceId: z.string(),
  ops: z.array(SyncOpTypedSchema),
});
export type SyncPushRequest = z.infer<typeof SyncPushRequestSchema>;

export const SyncPushResponseSchema = z.object({
  accepted: z.array(UuidSchema),
  cursor: z.number(),
});
export type SyncPushResponse = z.infer<typeof SyncPushResponseSchema>;

export const SyncPullResponseSchema = z.object({
  ops: z.array(z.intersection(SyncOpTypedSchema, z.object({ serverSeq: z.number() }))),
  nextCursor: z.number(),
  hasMore: z.boolean(),
});
export type SyncPullResponse = z.infer<typeof SyncPullResponseSchema>;
