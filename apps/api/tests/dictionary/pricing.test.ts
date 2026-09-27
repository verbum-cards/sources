import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcCostUsd, getModelPricing, MissingPriceError, sumUsage } from '../../scripts/dictionary/lib/pricing';

test('calcCostUsd computes cost from token usage and per-1M prices', () => {
  const cost = calcCostUsd({ promptTokens: 1_000_000, completionTokens: 500_000 }, { inputPer1M: 0.15, outputPer1M: 0.6 });
  assert.equal(cost, 0.15 + 0.3);
});

test('sumUsage adds up prompt and completion tokens across calls', () => {
  const total = sumUsage([
    { promptTokens: 100, completionTokens: 50 },
    { promptTokens: 200, completionTokens: 75 },
  ]);
  assert.deepEqual(total, { promptTokens: 300, completionTokens: 125 });
});

test('getModelPricing throws MissingPriceError for an unknown model', () => {
  assert.throws(() => getModelPricing({}, 'unknown-model'), MissingPriceError);
});

test('getModelPricing returns the entry when present', () => {
  const table = { 'gpt-x': { inputPer1M: 1, outputPer1M: 2 } };
  assert.deepEqual(getModelPricing(table, 'gpt-x'), { inputPer1M: 1, outputPer1M: 2 });
});
