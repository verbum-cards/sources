// Синхронизация по журналу операций (docs/sync-protocol.md, согласовано ADR-14).
// Найденные противоречия протокола, ушедшие в отдельные задачи, здесь не решаются.
import { z } from 'zod';
import { IsoDateSchema, UuidSchema } from './content';
import {
  CardCreateSchema,
  CardPatchSchema,
  ReviewLogPayloadSchema,
  UserDeckPatchSchema,
  UserProfilePatchSchema,
} from './user';

export const SYNC_SCHEMA_VERSION = 1;

export const SyncEntitySchema = z.enum(['card', 'review_log', 'user_profile', 'user_deck']);
export type SyncEntity = z.infer<typeof SyncEntitySchema>;

// Метаданные «последняя правка по полю» — для разрешения конфликтов last-write-wins
// на уровне поля, а не всей записи. Ключи для личных правок карточки — плоские:
// overrides.translation, overrides.example, overrides.note. Это не поле XSchema —
// см. CardStored/UserProfileStored/UserDeckStored в user.ts.
export const FieldRevisionsSchema = z.record(z.string(), z.object({ ts: IsoDateSchema, deviceId: z.string() }));
export type FieldRevisions = z.infer<typeof FieldRevisionsSchema>;

// Виды операций, по сущностям (docs/sync-protocol.md → «Виды операций»):
//   card         — create | upsert | delete
//   review_log   — create (журнал только добавляется)
//   user_profile — create | upsert (профиль никогда не удаляется отдельной операцией)
//   user_deck    — create | upsert | delete
export type SyncOpKind = 'create' | 'upsert' | 'delete';

const syncOpBase = {
  opId: UuidSchema,
  schemaVersion: z.number(),
  deviceId: z.string(),
  userId: UuidSchema,
  entityId: UuidSchema,
  clientTs: IsoDateSchema,
};

// card — единственная сущность, где форма fields зависит от kind: create несёт
// полный CardCreate, upsert — частичный CardPatch, delete — null (удаление
// ставится по kind, а не по полю; см. docs/sync-protocol.md → «Виды операций»).
export const CardCreateOpSchema = z.object({ ...syncOpBase, entity: z.literal('card'), kind: z.literal('create'), fields: CardCreateSchema });
export const CardUpsertOpSchema = z.object({ ...syncOpBase, entity: z.literal('card'), kind: z.literal('upsert'), fields: CardPatchSchema });
export const CardDeleteOpSchema = z.object({ ...syncOpBase, entity: z.literal('card'), kind: z.literal('delete'), fields: z.null() });

export const CardSyncOpSchema = z.discriminatedUnion('kind', [CardCreateOpSchema, CardUpsertOpSchema, CardDeleteOpSchema]);
export type CardSyncOp = z.infer<typeof CardSyncOpSchema>;

export const ReviewLogSyncOpSchema = z.object({
  ...syncOpBase,
  entity: z.literal('review_log'),
  kind: z.literal('create'), // журнал только добавляется, upsert/delete недопустимы
  fields: ReviewLogPayloadSchema,
});
export type ReviewLogSyncOp = z.infer<typeof ReviewLogSyncOpSchema>;

// У user_profile нет отдельного Create-типа: create и upsert несут один и тот же
// UserProfilePatch (профиль — одна запись, «создание» это просто первый upsert).
export const UserProfileSyncOpSchema = z.object({
  ...syncOpBase,
  entity: z.literal('user_profile'),
  kind: z.enum(['create', 'upsert']),
  fields: UserProfilePatchSchema,
});
export type UserProfileSyncOp = z.infer<typeof UserProfileSyncOpSchema>;

export const UserDeckSyncOpSchema = z.object({
  ...syncOpBase,
  entity: z.literal('user_deck'),
  kind: z.enum(['create', 'upsert', 'delete']),
  fields: UserDeckPatchSchema.nullable(),
});
export type UserDeckSyncOp = z.infer<typeof UserDeckSyncOpSchema>;

// Плоское объединение (не discriminatedUnion): card сам по себе уже размечен по
// kind и делит значение entity='card' на три варианта, поэтому единый дискриминант
// entity здесь не был бы уникален по всем веткам.
export const SyncOpTypedSchema = z.union([
  CardCreateOpSchema,
  CardUpsertOpSchema,
  CardDeleteOpSchema,
  ReviewLogSyncOpSchema,
  UserProfileSyncOpSchema,
  UserDeckSyncOpSchema,
]);
export type SyncOpTyped = z.infer<typeof SyncOpTypedSchema>;

// Рантайм-список разрешённых полей операции по сущности — выводится из тех же
// схем, что и патчи, поэтому не может разойтись с типами. Для card — объединение
// полей create и patch (upsert может прислать любое из них, кроме неизменяемых).
export const SYNCED_FIELDS: Record<SyncEntity, readonly string[]> = {
  card: Array.from(new Set([...Object.keys(CardCreateSchema.shape), ...Object.keys(CardPatchSchema.shape)])),
  review_log: Object.keys(ReviewLogPayloadSchema.shape),
  user_profile: Object.keys(UserProfilePatchSchema.shape),
  user_deck: Object.keys(UserDeckPatchSchema.shape),
};

// Закрытый перечень причин отказа push (docs/sync-protocol.md → «Обмен → push»).
export const SyncRejectReasonSchema = z.enum([
  'invalid_payload',
  'foreign_user',
  'review_log_immutable',
  'account_deleted',
  'schema_too_new',
  'clock_skew',
  'rate_limited',
]);
export type SyncRejectReason = z.infer<typeof SyncRejectReasonSchema>;

export const SyncRejectedOpSchema = z.object({
  opId: UuidSchema,
  reason: SyncRejectReasonSchema,
  retryable: z.boolean(),
});
export type SyncRejectedOp = z.infer<typeof SyncRejectedOpSchema>;

export const SyncPushRequestSchema = z.object({
  deviceId: z.string(),
  ops: z.array(SyncOpTypedSchema),
});
export type SyncPushRequest = z.infer<typeof SyncPushRequestSchema>;

// Курсора в ответе push намеренно нет: двигать его может только pull — иначе
// клиент перескочил бы операции других устройств с меньшим serverSeq и молча
// потерял бы их (docs/sync-protocol.md → «Обмен → push»). serverSeqMax — только
// диагностика.
export const SyncPushResponseSchema = z.object({
  accepted: z.array(UuidSchema),
  rejected: z.array(SyncRejectedOpSchema),
  serverSchemaVersion: z.number(),
  serverSeqMax: z.number(),
});
export type SyncPushResponse = z.infer<typeof SyncPushResponseSchema>;

export const SyncPullResponseSchema = z.object({
  ops: z.array(z.intersection(SyncOpTypedSchema, z.object({ serverSeq: z.number() }))),
  nextCursor: z.number(),
  hasMore: z.boolean(),
});
export type SyncPullResponse = z.infer<typeof SyncPullResponseSchema>;
