import assert from 'node:assert/strict';
import { test } from 'node:test';

import { splitAroundWord } from '../../src/utilities/highlight-word';

test('splitAroundWord: находит слово без учёта регистра, режет текст на 3 части', () => {
  const result = splitAroundWord('Time is a valuable resource.', 'valuable');
  assert.deepEqual(result, { before: 'Time is a ', match: 'valuable', after: ' resource.' });
});

test('splitAroundWord: регистр слова в примере может отличаться от регистра запроса', () => {
  const result = splitAroundWord('Try to Connect to the Wi-Fi.', 'connect');
  assert.deepEqual(result, { before: 'Try to ', match: 'Connect', after: ' to the Wi-Fi.' });
});

test('splitAroundWord: слово не встречается в примере -> весь текст в before, match пустой', () => {
  const result = splitAroundWord('It was pure luck.', 'serendipity');
  assert.deepEqual(result, { before: 'It was pure luck.', match: '', after: '' });
});
