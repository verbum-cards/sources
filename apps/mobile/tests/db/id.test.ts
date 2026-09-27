import assert from 'node:assert/strict';
import { test } from 'node:test';
import { uuidv7 } from '../../src/db/id';

const UUID_V7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test('uuidv7: формат соответствует RFC 4122 (версия 7, вариант 10)', () => {
  const id = uuidv7();
  assert.match(id, UUID_V7_RE);
});

test('uuidv7: два вызова дают разные идентификаторы', () => {
  assert.notEqual(uuidv7(), uuidv7());
});

test('uuidv7: лексикографический порядок совпадает с порядком времени', () => {
  const earlier = uuidv7(new Date('2026-01-01T00:00:00.000Z'));
  const later = uuidv7(new Date('2026-01-02T00:00:00.000Z'));
  assert.ok(earlier < later, `${earlier} должен быть лексикографически меньше ${later}`);
});
