import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HttpError, NetworkError, TimeoutError } from '../../src/network/errors';
import { setAuthTokenProvider } from '../../src/network/auth-token';
import { request, type FetchLike, type FetchRequestInitLike } from '../../src/network/request';

process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test';

test('успешный запрос парсит JSON-тело', async () => {
  const fetchImpl: FetchLike = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ hello: 'world' }),
  });

  const result = await request<{ hello: string }>('/ping', { fetchImpl });
  assert.deepEqual(result, { hello: 'world' });
});

test('не-2xx кидает HttpError со статусом и распарсенным телом', async () => {
  const fetchImpl: FetchLike = async () => ({
    ok: false,
    status: 422,
    text: async () => JSON.stringify({ reason: 'invalid_payload' }),
  });

  await assert.rejects(
    () => request('/sync/push', { fetchImpl }),
    (error: unknown) => {
      assert.ok(error instanceof HttpError);
      assert.equal(error.status, 422);
      assert.deepEqual(error.body, { reason: 'invalid_payload' });
      return true;
    },
  );
});

test('отказ fetch кидает NetworkError', async () => {
  const fetchImpl: FetchLike = async () => {
    throw new TypeError('Failed to fetch');
  };

  await assert.rejects(
    () => request('/ping', { fetchImpl }),
    (error: unknown) => error instanceof NetworkError,
  );
});

test('таймаут кидает TimeoutError', async () => {
  // fetchImpl никогда не резолвится сам — только реагирует на AbortSignal,
  // как это делают реальные реализации fetch при отмене.
  const fetchImpl: FetchLike = (_url, init: FetchRequestInitLike) =>
    new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => {
        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';
        reject(abortError);
      });
    });

  await assert.rejects(
    () => request('/ping', { fetchImpl, timeoutMs: 10 }),
    (error: unknown) => error instanceof TimeoutError,
  );
});

test('провайдер токена добавляет Authorization: Bearer', async () => {
  setAuthTokenProvider(async () => 'token-123');
  let capturedHeaders: Record<string, string> | undefined;
  const fetchImpl: FetchLike = async (_url, init) => {
    capturedHeaders = init.headers;
    return { ok: true, status: 200, text: async () => '' };
  };

  try {
    await request('/ping', { fetchImpl });
    assert.equal(capturedHeaders?.Authorization, 'Bearer token-123');
  } finally {
    setAuthTokenProvider(null);
  }
});

test('без провайдера токена Authorization не добавляется', async () => {
  setAuthTokenProvider(null);
  let capturedHeaders: Record<string, string> | undefined;
  const fetchImpl: FetchLike = async (_url, init) => {
    capturedHeaders = init.headers;
    return { ok: true, status: 200, text: async () => '' };
  };

  await request('/ping', { fetchImpl });
  assert.equal(capturedHeaders?.Authorization, undefined);
});

test('без EXPO_PUBLIC_API_URL — понятная ошибка, а не фейковый адрес', async () => {
  const original = process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_API_URL;
  try {
    await assert.rejects(
      () => request('/ping', { fetchImpl: async () => ({ ok: true, status: 200, text: async () => '' }) }),
      /EXPO_PUBLIC_API_URL/,
    );
  } finally {
    process.env.EXPO_PUBLIC_API_URL = original;
  }
});
