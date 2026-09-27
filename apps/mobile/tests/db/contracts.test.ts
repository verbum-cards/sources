import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  IsoDateSchema,
  SyncOpTypedSchema,
  SyncPushResponseSchema,
  UuidSchema,
} from '@cards/contracts';
import { FIXED_ISO, FIXED_UUID_1, FIXED_UUID_2 } from '../support/fixtures';

// Item 7 code-debt T1.5a: UuidSchema -> z.uuid(), IsoDateSchema -> z.iso.datetime()
// (по умолчанию требует Z, запрещает смещение — наш формат, см. docs/sync-protocol.md
// «Часы устройства»).

test('UuidSchema отклоняет не-UUID строки', () => {
  assert.equal(UuidSchema.safeParse('not-a-uuid').success, false);
  assert.equal(UuidSchema.safeParse(FIXED_UUID_1).success, true);
});

test('IsoDateSchema требует Z и запрещает смещение часового пояса', () => {
  assert.equal(IsoDateSchema.safeParse('2026-09-27').success, false, 'дата без времени должна быть отклонена');
  assert.equal(
    IsoDateSchema.safeParse('2026-09-27T10:00:00+03:00').success,
    false,
    'смещение вместо Z должно быть отклонено',
  );
  assert.equal(IsoDateSchema.safeParse(FIXED_ISO).success, true);
});

test('SyncOpTypedSchema: card create с полным набором обязательных полей', () => {
  const result = SyncOpTypedSchema.safeParse({
    opId: FIXED_UUID_1,
    schemaVersion: 1,
    deviceId: 'device-1',
    userId: FIXED_UUID_2,
    entity: 'card',
    entityId: FIXED_UUID_1,
    kind: 'create',
    clientTs: FIXED_ISO,
    fields: {
      itemType: 'sense',
      itemId: FIXED_UUID_2,
      sourceDeckId: null,
      overrides: null,
      status: 'active',
      createdAt: FIXED_ISO,
    },
  });
  assert.equal(result.success, true);
});

test('SyncOpTypedSchema: card upsert различает "не менялось" и "стёрто" (null)', () => {
  const result = SyncOpTypedSchema.safeParse({
    opId: FIXED_UUID_1,
    schemaVersion: 1,
    deviceId: 'device-1',
    userId: FIXED_UUID_2,
    entity: 'card',
    entityId: FIXED_UUID_1,
    kind: 'upsert',
    clientTs: FIXED_ISO,
    fields: {
      sourceDeckId: null, // стёрто явным null
      overrides: { translation: null, example: 'a new example' }, // note не упомянут — не менялось
    },
  });
  assert.equal(result.success, true);

  // itemType/itemId/createdAt неизменяемы после создания — в CardPatch их нет
  // вовсе как ключей схемы, поэтому zod молча отбрасывает их при парсинге
  // upsert'а (это и есть «игнорируются при применении» из брифа T1.5a).
  const withImmutableField = SyncOpTypedSchema.safeParse({
    opId: FIXED_UUID_1,
    schemaVersion: 1,
    deviceId: 'device-1',
    userId: FIXED_UUID_2,
    entity: 'card',
    entityId: FIXED_UUID_1,
    kind: 'upsert',
    clientTs: FIXED_ISO,
    fields: { itemType: 'sense', status: 'known' },
  });
  assert.equal(withImmutableField.success, true);
  if (withImmutableField.success && withImmutableField.data.entity === 'card' && withImmutableField.data.kind === 'upsert') {
    assert.equal((withImmutableField.data.fields as Record<string, unknown>).itemType, undefined);
    assert.equal(withImmutableField.data.fields?.status, 'known');
  }
});

test('SyncOpTypedSchema: card delete не несёт fields', () => {
  const result = SyncOpTypedSchema.safeParse({
    opId: FIXED_UUID_1,
    schemaVersion: 1,
    deviceId: 'device-1',
    userId: FIXED_UUID_2,
    entity: 'card',
    entityId: FIXED_UUID_1,
    kind: 'delete',
    clientTs: FIXED_ISO,
    fields: null,
  });
  assert.equal(result.success, true);
});

test('SyncOpTypedSchema: review_log только create', () => {
  const created = SyncOpTypedSchema.safeParse({
    opId: FIXED_UUID_1,
    schemaVersion: 1,
    deviceId: 'device-1',
    userId: FIXED_UUID_2,
    entity: 'review_log',
    entityId: FIXED_UUID_1,
    kind: 'create',
    clientTs: FIXED_ISO,
    fields: {
      cardId: FIXED_UUID_2,
      rating: 'good',
      reviewedAt: FIXED_ISO,
      elapsedMs: 1500,
      deviceId: 'device-1',
      tzOffsetMin: 180,
    },
  });
  assert.equal(created.success, true);

  const deleted = SyncOpTypedSchema.safeParse({
    opId: FIXED_UUID_1,
    schemaVersion: 1,
    deviceId: 'device-1',
    userId: FIXED_UUID_2,
    entity: 'review_log',
    entityId: FIXED_UUID_1,
    kind: 'delete',
    clientTs: FIXED_ISO,
    fields: null,
  });
  assert.equal(deleted.success, false); // review_log_immutable — delete недопустим схемой
});

test('SyncPushResponseSchema: rejected[] с закрытым перечнем причин, без cursor', () => {
  const result = SyncPushResponseSchema.safeParse({
    accepted: [FIXED_UUID_1],
    rejected: [{ opId: FIXED_UUID_2, reason: 'clock_skew', retryable: true }],
    serverSchemaVersion: 1,
    serverSeqMax: 42,
  });
  assert.equal(result.success, true);

  const withUnknownReason = SyncPushResponseSchema.safeParse({
    accepted: [],
    rejected: [{ opId: FIXED_UUID_2, reason: 'not_a_real_reason', retryable: true }],
    serverSchemaVersion: 1,
    serverSeqMax: 42,
  });
  assert.equal(withUnknownReason.success, false);

  const withCursor = SyncPushResponseSchema.safeParse({
    accepted: [],
    rejected: [],
    cursor: 5, // курсора в ответе push быть не должно (лишнее поле)
    serverSchemaVersion: 1,
    serverSeqMax: 42,
  });
  // лишнее поле не входит в вывод .parse(), но сама форма без cursor обязана быть валидной:
  assert.equal(withCursor.success, true);
  assert.equal((withCursor.data as { cursor?: number }).cursor, undefined);
});
