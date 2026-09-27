import assert from 'node:assert/strict';
import { test } from 'node:test';
import { callOpenAiChat, hasApiKey, MissingApiKeyError } from '../../scripts/dictionary/lib/llm-client';

test('hasApiKey reflects OPENAI_API_KEY presence', () => {
  const original = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  assert.equal(hasApiKey(), false);
  process.env.OPENAI_API_KEY = 'test-key';
  assert.equal(hasApiKey(), true);
  if (original === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = original;
});

test('callOpenAiChat throws MissingApiKeyError without a key, before any network call', async () => {
  const original = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  await assert.rejects(
    () => callOpenAiChat({ model: 'fake-model', messages: [{ role: 'user', content: 'hi' }] }),
    MissingApiKeyError,
  );
  if (original === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = original;
});
