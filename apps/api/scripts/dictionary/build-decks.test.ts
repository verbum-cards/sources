import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DeckSpecSchema } from './build-decks';

function makeSpec(overrides: Record<string, unknown> = {}) {
  return {
    id: '0195d000-0000-7000-8000-000000000001',
    lang: 'en',
    nativeLang: 'ru',
    title: 'Тестовая колода',
    categories: ['travelLeisure'],
    type: 'official',
    items: [{ lemma: 'menu', importance: 3 }],
    ...overrides,
  };
}

test('DeckSpecSchema: валидная колода проходит как есть', () => {
  const spec = makeSpec();
  assert.deepEqual(DeckSpecSchema.parse(spec), spec);
});

test('DeckSpecSchema: context необязателен', () => {
  const spec = makeSpec();
  assert.equal('context' in DeckSpecSchema.parse(spec), false);
});

test('DeckSpecSchema: неизвестная категория -> ошибка', () => {
  assert.throws(() => DeckSpecSchema.parse(makeSpec({ categories: ['unknownCategory'] })));
});

test('DeckSpecSchema: importance вне 1|2|3 -> ошибка', () => {
  assert.throws(() =>
    DeckSpecSchema.parse(makeSpec({ items: [{ lemma: 'menu', importance: 4 }] }))
  );
});

test('DeckSpecSchema: пустой title -> ошибка', () => {
  assert.throws(() => DeckSpecSchema.parse(makeSpec({ title: '' })));
});

test('DeckSpecSchema: id не UUID -> ошибка', () => {
  assert.throws(() => DeckSpecSchema.parse(makeSpec({ id: 'not-a-uuid' })));
});

test('DeckSpecSchema: пустые categories и items допустимы (например, служебная колода)', () => {
  const spec = makeSpec({ categories: [], items: [] });
  assert.deepEqual(DeckSpecSchema.parse(spec), spec);
});
