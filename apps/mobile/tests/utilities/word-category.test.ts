import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DECKS } from '../../src/mocks/decks';
import type { CategorizableWord } from '../../src/utilities/word-category';
import { categorizeWord, groupWords } from '../../src/utilities/word-category';

const restaurant = DECKS[0];

function makeWord(overrides: Partial<CategorizableWord>): CategorizableWord {
  return {
    itemType: 'sense',
    lemma: 'word',
    ...overrides,
  };
}

test('categorizeWord: sense + noun/noun phrase -> nouns', () => {
  assert.equal(categorizeWord(makeWord({ pos: 'noun' })), 'nouns');
  assert.equal(categorizeWord(makeWord({ pos: 'noun phrase' })), 'nouns');
});

test('categorizeWord: sense + verb -> verbs', () => {
  assert.equal(categorizeWord(makeWord({ pos: 'verb' })), 'verbs');
});

test('categorizeWord: sense + adjective -> adjectives', () => {
  assert.equal(categorizeWord(makeWord({ pos: 'adjective' })), 'adjectives');
});

test('categorizeWord: sense без noun/verb/adjective -> other', () => {
  assert.equal(categorizeWord(makeWord({ pos: 'adverb' })), 'other');
});

test('categorizeWord: expression без "?" -> phrases', () => {
  assert.equal(
    categorizeWord(makeWord({ itemType: 'expression', lemma: 'to split the bill' })),
    'phrases'
  );
});

test('categorizeWord: expression с "?" -> questions', () => {
  assert.equal(
    categorizeWord(makeWord({ itemType: 'expression', lemma: 'Is breakfast included?' })),
    'questions'
  );
});

test('groupWords: фиксированный порядок групп, пустые группы отсутствуют', () => {
  const words = [
    makeWord({ pos: 'noun' }),
    makeWord({ itemType: 'expression', lemma: 'Is this ok?' }),
    makeWord({ itemType: 'expression', lemma: 'no question here' }),
  ];

  const groups = groupWords(words);

  assert.deepEqual(
    groups.map((g) => g.category),
    ['nouns', 'phrases', 'questions']
  );
  assert.equal(groups[0].items.length, 1);
});

test('groupWords: реальная колода «Ресторан» распределяется по всем ожидаемым группам', () => {
  const groups = groupWords(restaurant.items);
  const total = groups.reduce((sum, g) => sum + g.items.length, 0);

  assert.equal(total, restaurant.items.length);
  assert.deepEqual(
    groups.map((g) => g.category),
    ['nouns', 'verbs', 'adjectives', 'phrases', 'questions']
  );
});
