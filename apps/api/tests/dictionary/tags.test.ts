import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTagList } from '../../scripts/dictionary/lib/tags';

test('loadTagList reads tag codes from the skill reference file', () => {
  const tags = loadTagList();
  assert.ok(tags.includes('restaurant'));
  assert.ok(tags.includes('hotel'));
  assert.ok(tags.includes('airport'));
  assert.ok(tags.includes('directions'));
  assert.ok(tags.length >= 20);
});
