import assert from 'node:assert/strict';
import { test } from 'node:test';

import { HttpError, NetworkError, TimeoutError } from '../../src/network/errors';
import { withRetry } from '../../src/network/retry';

const noDelay = async () => {};

test('withRetry: повторяет при NetworkError и останавливается после maxAttempts', async () => {
  let calls = 0;
  const fn = async () => {
    calls += 1;
    throw new NetworkError('нет сети');
  };

  await assert.rejects(() => withRetry(fn, { maxAttempts: 3, delay: noDelay }), NetworkError);
  assert.equal(calls, 3);
});

test('withRetry: повторяет при TimeoutError и возвращает результат, если попытка удалась', async () => {
  let calls = 0;
  const fn = async () => {
    calls += 1;
    if (calls < 3) throw new TimeoutError('таймаут');

    return 'ok';
  };

  const result = await withRetry(fn, { maxAttempts: 5, delay: noDelay });
  assert.equal(result, 'ok');
  assert.equal(calls, 3);
});

test('withRetry: НЕ повторяет при HttpError — ошибку сервера нельзя ретраить вслепую', async () => {
  let calls = 0;
  const fn = async () => {
    calls += 1;
    throw new HttpError(500, { reason: 'internal' });
  };

  await assert.rejects(() => withRetry(fn, { maxAttempts: 3, delay: noDelay }), HttpError);
  assert.equal(calls, 1);
});

test('withRetry: успех с первой попытки не вызывает delay', async () => {
  let delayCalls = 0;
  const result = await withRetry(async () => 'immediate', {
    maxAttempts: 3,
    delay: async () => {
      delayCalls += 1;
    },
  });
  assert.equal(result, 'immediate');
  assert.equal(delayCalls, 0);
});
