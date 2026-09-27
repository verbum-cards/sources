import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  intersectWithSeed,
  mergeSelections,
  parseCandidateWords,
  roundRobinByTopic,
  selectForTopics,
  selectionToCsv,
} from '../../scripts/dictionary/select-topic';
import type { SeedRow } from '../../scripts/dictionary/schema';

const SEED: SeedRow[] = [
  { headword: 'hotel', pos: 'noun', cefr: 'A1', source: 'cefr-j', license: 'cefr-j-free-cite' },
  { headword: 'bill', pos: 'noun', cefr: 'A2', source: 'cefr-j', license: 'cefr-j-free-cite' },
  { headword: 'bill', pos: 'verb', cefr: 'B1', source: 'cefr-j', license: 'cefr-j-free-cite' },
];

test('parseCandidateWords accepts a plain array', () => {
  assert.deepEqual(parseCandidateWords('["hotel", "bill"]'), ['hotel', 'bill']);
});

test('parseCandidateWords accepts {words: [...]}', () => {
  assert.deepEqual(parseCandidateWords('{"words": ["hotel", "checkout"]}'), ['hotel', 'checkout']);
});

test('parseCandidateWords throws on an unexpected shape', () => {
  assert.throws(() => parseCandidateWords('{"foo": 1}'));
});

test('intersectWithSeed expands a headword to every matching seed row (pos variants)', () => {
  const rows = intersectWithSeed('hotel', ['hotel', 'bill', 'unknown-word'], SEED);
  assert.equal(rows.length, 4); // hotel(noun) + bill(noun) + bill(verb) + unknown-word
  assert.ok(rows.some((r) => r.headword === 'bill' && r.pos === 'verb' && r.inSeed));
  const outOfSeed = rows.find((r) => r.headword === 'unknown-word');
  assert.equal(outOfSeed?.inSeed, false);
});

test('mergeSelections dedups by headword+pos and joins topics', () => {
  const merged = mergeSelections([
    intersectWithSeed('hotel', ['hotel'], SEED),
    intersectWithSeed('restaurant', ['hotel'], SEED),
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].topic, 'hotel,restaurant');
});

test('selectionToCsv writes the headword,pos,cefr,topic,in_seed header', () => {
  const csv = selectionToCsv(intersectWithSeed('hotel', ['hotel'], SEED));
  assert.match(csv, /^headword,pos,cefr,topic,in_seed\n/);
  assert.match(csv, /hotel,noun,A1,hotel,true/);
});

test('roundRobinByTopic gives every topic a fair share instead of letting the first topic exhaust the limit', () => {
  const bigSeed: SeedRow[] = Array.from({ length: 20 }, (_, i) => ({
    headword: `restaurant-word-${i}`,
    pos: 'noun',
    cefr: 'A2' as const,
    source: 'cefr-j' as const,
    license: 'cefr-j-free-cite' as const,
  }));
  const hotelSeed: SeedRow = { headword: 'hotel', pos: 'noun', cefr: 'A1', source: 'cefr-j', license: 'cefr-j-free-cite' };
  const seed = [...bigSeed, hotelSeed];

  // "restaurant" alone has 20 in-seed candidates, "hotel" has 1 — a flat slice(0, limit) would
  // return only restaurant words; round-robin must still include the hotel word.
  const restaurantRows = intersectWithSeed('restaurant', bigSeed.map((r) => r.headword), seed);
  const hotelRows = intersectWithSeed('hotel', ['hotel'], seed);
  const merged = mergeSelections([restaurantRows, hotelRows]);
  const mergedByKey = new Map(merged.map((r) => [`${r.headword.toLowerCase()}::${r.pos.toLowerCase()}`, r]));

  const picked = roundRobinByTopic([restaurantRows, hotelRows], 5, mergedByKey);
  assert.equal(picked.length, 5);
  assert.ok(picked.some((r) => r.headword === 'hotel'), 'hotel word must not be crowded out by the bigger topic');
});

test('selectForTopics calls the LLM once per topic and applies the overall limit to in-seed matches', async () => {
  const calls: string[] = [];
  const fakeChat = async ({ messages }: { messages: { content: string }[] }) => {
    calls.push(messages[1].content);
    return { content: JSON.stringify({ words: ['hotel', 'bill'] }), usage: { promptTokens: 10, completionTokens: 5 } };
  };
  const result = await selectForTopics({
    topics: ['hotel', 'restaurant'],
    seed: SEED,
    candidatesPerTopic: 10,
    limit: 2,
    model: 'fake-model',
    chatFn: fakeChat,
  });
  assert.equal(calls.length, 2);
  const inSeed = result.selection.filter((r) => r.inSeed);
  assert.equal(inSeed.length, 2);
  assert.equal(result.usage.length, 2);
});
