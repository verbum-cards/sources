import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatPos } from '../../src/utilities/format-pos';

test('formatPos: часть речи отдаётся как есть, без перевода и сокращения', () => {
  assert.equal(formatPos('noun'), 'noun');
  assert.equal(formatPos('verb'), 'verb');
  assert.equal(formatPos('adjective'), 'adjective');
  assert.equal(formatPos('adverb'), 'adverb');
  assert.equal(formatPos('noun phrase'), 'noun phrase');
});

test('formatPos: пусто/null/undefined -> undefined', () => {
  assert.equal(formatPos(''), undefined);
  assert.equal(formatPos(null), undefined);
  assert.equal(formatPos(undefined), undefined);
});
