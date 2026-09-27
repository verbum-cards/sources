import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildReport, reportToMarkdown } from '../../scripts/dictionary/report';

test('buildReport computes total tokens, cost and cost per 1000 words', () => {
  const report = buildReport({
    runId: 'r1',
    model: 'fake-model',
    wordsIn: 500,
    sensesOut: 900,
    expressionsOut: 40,
    rejectedByReason: { example_length: 3, word_not_in_example: 2 },
    parseErrorsCount: 1,
    startedAt: '2026-09-27T10:00:00.000Z',
    finishedAt: '2026-09-27T10:05:00.000Z',
    usage: [
      { promptTokens: 1_000_000, completionTokens: 200_000 },
      { promptTokens: 500_000, completionTokens: 100_000 },
    ],
    pricing: { inputPer1M: 0.15, outputPer1M: 0.6 },
  });
  assert.equal(report.durationMs, 5 * 60 * 1000);
  assert.equal(report.totalTokens.promptTokens, 1_500_000);
  assert.equal(report.totalTokens.completionTokens, 300_000);
  assert.equal(report.rejectedTotal, 5);
  const expectedCost = (1.5 * 0.15) + (0.3 * 0.6);
  assert.ok(Math.abs(report.costUsd - expectedCost) < 1e-9);
  assert.ok(Math.abs(report.costPer1000WordsUsd - (expectedCost / 500) * 1000) < 1e-9);
});

test('buildReport extrapolates cost to 5000 and 20000 words', () => {
  const report = buildReport({
    runId: 'r1',
    model: 'fake-model',
    wordsIn: 500,
    sensesOut: 900,
    expressionsOut: 40,
    rejectedByReason: {},
    parseErrorsCount: 0,
    startedAt: '2026-09-27T10:00:00.000Z',
    finishedAt: '2026-09-27T10:05:00.000Z',
    usage: [{ promptTokens: 1_000_000, completionTokens: 0 }],
    pricing: { inputPer1M: 1, outputPer1M: 0 },
  });
  assert.deepEqual(
    report.extrapolation.map((e) => e.words),
    [5000, 20000],
  );
  const per1000 = report.costPer1000WordsUsd;
  assert.ok(Math.abs(report.extrapolation[0].estimatedCostUsd - (per1000 / 1000) * 5000) < 1e-9);
  assert.ok(Math.abs(report.extrapolation[1].estimatedCostUsd - (per1000 / 1000) * 20000) < 1e-9);
});

test('reportToMarkdown includes the key numbers and handles an empty rejection map', () => {
  const report = buildReport({
    runId: 'pilot-1',
    model: 'fake-model',
    wordsIn: 20,
    sensesOut: 35,
    expressionsOut: 2,
    rejectedByReason: {},
    parseErrorsCount: 0,
    startedAt: '2026-09-27T10:00:00.000Z',
    finishedAt: '2026-09-27T10:00:30.000Z',
    usage: [{ promptTokens: 1000, completionTokens: 200 }],
    pricing: { inputPer1M: 1, outputPer1M: 1 },
  });
  const md = reportToMarkdown(report);
  assert.match(md, /pilot-1/);
  assert.match(md, /нет отклонённых записей/);
  assert.match(md, /Значений на выходе: 35/);
});
