import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DEBUG_WORDS } from '../../src/mocks/fsrs-debug-words';
import {
  missingWords,
  orderCardsByWordList,
  type DebugCardRow,
} from '../../src/screens/fsrsDebugDeck';

test('DEBUG_WORDS: от 20 до 60 слов, уникальные itemId и лемма', () => {
  assert.ok(
    DEBUG_WORDS.length >= 20 && DEBUG_WORDS.length <= 60,
    `ожидалось 20..60 слов, получили ${DEBUG_WORDS.length}`
  );
  assert.equal(
    new Set(DEBUG_WORDS.map((w) => w.itemId)).size,
    DEBUG_WORDS.length,
    'itemId должны быть уникальны'
  );
  assert.equal(
    new Set(DEBUG_WORDS.map((w) => w.lemma)).size,
    DEBUG_WORDS.length,
    'лемма должна быть уникальна'
  );
  for (const word of DEBUG_WORDS) {
    assert.ok(
      word.example.toLowerCase().includes(word.lemma.toLowerCase()),
      `пример для "${word.lemma}" должен содержать само слово`
    );
  }
});

test('orderCardsByWordList: восстанавливает порядок DEBUG_WORDS независимо от порядка строк из БД', () => {
  const [w1, w2, w3] = DEBUG_WORDS;
  const rows: DebugCardRow[] = [
    {
      id: 'card-3',
      item_id: w3.itemId,
      lemma: w3.lemma,
      translation: w3.translation,
      example: w3.example,
    },
    {
      id: 'card-1',
      item_id: w1.itemId,
      lemma: w1.lemma,
      translation: w1.translation,
      example: w1.example,
    },
  ];

  const ordered = orderCardsByWordList(DEBUG_WORDS, rows);

  assert.equal(ordered.length, 2);
  assert.equal(ordered[0].itemId, w1.itemId); // w1 раньше w3 в DEBUG_WORDS, несмотря на порядок строк
  assert.equal(ordered[1].itemId, w3.itemId);
  assert.equal(
    ordered.some((c) => c.itemId === w2.itemId),
    false
  ); // для w2 карточки не было
});

test('missingWords: только слова без карточки, идемпотентно при полном наборе', () => {
  const allIds = new Set(DEBUG_WORDS.map((w) => w.itemId));
  assert.equal(missingWords(DEBUG_WORDS, allIds).length, 0);
  assert.equal(missingWords(DEBUG_WORDS, new Set()).length, DEBUG_WORDS.length);

  const [first] = DEBUG_WORDS;
  const missing = missingWords(DEBUG_WORDS, new Set([first.itemId]));
  assert.equal(missing.length, DEBUG_WORDS.length - 1);
  assert.equal(
    missing.some((w) => w.itemId === first.itemId),
    false
  );
});
