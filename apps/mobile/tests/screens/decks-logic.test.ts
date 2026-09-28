import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { GoalSchema } from '@cards/contracts';

import { getOrCreateLocalUserId } from '../../src/db/entities/user/app-meta';
import { loadUserDeckIds } from '../../src/db/entities/user/user-deck';
import { migrate } from '../../src/db/migrate';
import { DECKS } from '../../src/mocks/decks';
import type { MockDeck } from '../../src/mocks/decks';
import {
  addDeckToUser,
  addSingleDeckWord,
  groupDecksByGoal,
  isDeckWordAdded,
  loadAddedDeckIds,
  loadAddedDeckItemIds,
} from '../../src/screens/decks/decks-logic';
import { loadUserDecks } from '../../src/screens/decks/user-deck-logic';
import { createNodeSqliteExecutor } from '../support/node-sqlite-executor';

async function setupDb() {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await migrate(executor);
  const userId = await getOrCreateLocalUserId(executor);

  return { db: executor, userId };
}

const restaurant = DECKS[0];

test('DECKS: id колод и itemId элементов не повторяются (защита от копипасты вручную)', () => {
  const deckIds = DECKS.map((deck) => deck.id);
  assert.equal(new Set(deckIds).size, deckIds.length);

  const itemIds = DECKS.flatMap((deck) => deck.items.map((item) => item.itemId));
  assert.equal(new Set(itemIds).size, itemIds.length);
});

test('DECKS: goalTags — только известные значения Goal (иначе колода молча выпадет из каталога)', () => {
  const knownGoals = new Set<string>(GoalSchema.options);
  for (const deck of DECKS) {
    for (const tag of deck.goalTags) {
      assert.ok(knownGoals.has(tag), `неизвестный goalTag "${tag}" у колоды "${deck.title}"`);
    }
  }
});

function makeDeck(overrides: Partial<MockDeck>): MockDeck {
  return {
    id: '0195d999-0000-7000-8000-000000000001',
    lang: 'en',
    nativeLang: 'ru',
    title: 'Тестовая колода',
    goalTags: ['travel'],
    type: 'official',
    items: [],
    ...overrides,
  };
}

test('groupDecksByGoal: фиксированный порядок (как GoalSchema), пустые группы отсутствуют', () => {
  const decks = [
    makeDeck({ id: '1', goalTags: ['tech'] }),
    makeDeck({ id: '2', goalTags: ['travel'] }),
  ];

  const groups = groupDecksByGoal(decks);

  assert.deepEqual(
    groups.map((g) => g.goal),
    ['travel', 'tech']
  );
});

test('groupDecksByGoal: колода с несколькими goalTags попадает в несколько групп', () => {
  const decks = [makeDeck({ id: '1', goalTags: ['travel', 'self'] })];

  const groups = groupDecksByGoal(decks);

  assert.deepEqual(
    groups.map((g) => g.goal),
    ['travel', 'self']
  );
  assert.equal(groups[0].decks[0]?.id, '1');
  assert.equal(groups[1].decks[0]?.id, '1');
});

test('groupDecksByGoal: реальный каталог DECKS — каждая колода попадает хотя бы в одну группу', () => {
  const groups = groupDecksByGoal(DECKS);
  const deckIdsInGroups = new Set(groups.flatMap((g) => g.decks.map((d) => d.id)));

  for (const deck of DECKS) {
    assert.ok(deckIdsInGroups.has(deck.id), `колода "${deck.title}" не попала ни в одну группу`);
  }
});

test('addDeckToUser: создаёт card+card_content на каждый элемент колоды с нуля', async () => {
  const { db, userId } = await setupDb();

  const result = await addDeckToUser(db, restaurant);

  assert.deepEqual(result, { added: restaurant.items.length, skipped: 0 });

  const cards = await db.all<{
    item_type: string;
    item_id: string;
    source_deck_id: string;
    status: string;
  }>('SELECT item_type, item_id, source_deck_id, status FROM card WHERE user_id = ?', [userId]);
  assert.equal(cards.length, restaurant.items.length);
  for (const card of cards) {
    assert.equal(card.source_deck_id, restaurant.id);
    assert.equal(card.status, 'active');
  }

  const contentRows = await db.all<{ cefr: string; source: string }>(
    'SELECT cefr, source FROM card_content'
  );
  assert.equal(contentRows.length, restaurant.items.length);
  for (const row of contentRows) {
    assert.equal(row.source, 'pack');
  }
});

test('addDeckToUser: пишет ipa для sense-элементов и null для expression (транскрипции фраз нет)', async () => {
  const { db } = await setupDb();

  await addDeckToUser(db, restaurant);

  for (const word of restaurant.items) {
    const content = await db.get<{ ipa: string | null }>(
      'SELECT ipa FROM card_content WHERE card_id = (SELECT id FROM card WHERE item_id = ?)',
      [word.itemId]
    );
    assert.equal(content?.ipa, word.ipa ?? null, `ipa для "${word.lemma}"`);
  }
});

test('addDeckToUser: пишет definition для каждого элемента', async () => {
  const { db } = await setupDb();

  await addDeckToUser(db, restaurant);

  for (const word of restaurant.items) {
    const content = await db.get<{ definition: string | null }>(
      'SELECT definition FROM card_content WHERE card_id = (SELECT id FROM card WHERE item_id = ?)',
      [word.itemId]
    );
    assert.equal(content?.definition, word.definition, `definition для "${word.lemma}"`);
  }
});

test('addDeckToUser: помечает колоду добавленной в user_deck', async () => {
  const { db, userId } = await setupDb();

  await addDeckToUser(db, restaurant);

  assert.deepEqual(await loadUserDeckIds(db, userId), new Set([restaurant.id]));
  assert.deepEqual(await loadAddedDeckIds(db), new Set([restaurant.id]));
});

test('addDeckToUser: повторный вызов не дублирует карточки, только апсертит user_deck', async () => {
  const { db, userId } = await setupDb();

  await addDeckToUser(db, restaurant);
  const second = await addDeckToUser(db, restaurant);

  assert.deepEqual(second, { added: 0, skipped: restaurant.items.length });

  const cards = await db.all('SELECT id FROM card WHERE user_id = ?', [userId]);
  assert.equal(cards.length, restaurant.items.length);
});

test('addDeckToUser: элемент, уже добавленный вручную (тот же item_id), пропускается', async () => {
  const { db, userId } = await setupDb();
  const already = restaurant.items[0];
  const now = '2026-01-01T00:00:00.000Z';

  await db.run(
    'INSERT INTO card (id, user_id, item_type, item_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['manual-card-1', userId, already.itemType, already.itemId, 'active', now, now]
  );

  const result = await addDeckToUser(db, restaurant, new Date(now));

  assert.deepEqual(result, { added: restaurant.items.length - 1, skipped: 1 });

  const cards = await db.all('SELECT id FROM card WHERE user_id = ?', [userId]);
  assert.equal(cards.length, restaurant.items.length);
});

test('addSingleDeckWord: добавляет одно слово, не трогая user_deck (колода не считается добавленной)', async () => {
  const { db, userId } = await setupDb();
  const word = restaurant.items[0];

  const added = await addSingleDeckWord(db, restaurant, word, 'Мой словарь');

  assert.equal(added, true);
  const cards = await db.all('SELECT id FROM card WHERE user_id = ?', [userId]);
  assert.equal(cards.length, 1);
  assert.deepEqual(await loadAddedDeckIds(db), new Set());
});

test('addSingleDeckWord: повторный вызов на то же слово — нет-оп, false', async () => {
  const { db, userId } = await setupDb();
  const word = restaurant.items[0];

  await addSingleDeckWord(db, restaurant, word, 'Мой словарь');
  const second = await addSingleDeckWord(db, restaurant, word, 'Мой словарь');

  assert.equal(second, false);
  const cards = await db.all('SELECT id FROM card WHERE user_id = ?', [userId]);
  assert.equal(cards.length, 1);
});

test('loadAddedDeckItemIds + isDeckWordAdded: отражают только реально добавленные слова колоды', async () => {
  const { db } = await setupDb();
  const [first, second] = restaurant.items;

  await addSingleDeckWord(db, restaurant, first, 'Мой словарь');

  const addedItemIds = await loadAddedDeckItemIds(db);
  assert.equal(isDeckWordAdded(addedItemIds, first), true);
  assert.equal(isDeckWordAdded(addedItemIds, second), false);
});

test('addSingleDeckWord: слово попадает и в «Мой словарь», source_deck_id остаётся исходной колодой', async () => {
  const { db } = await setupDb();
  const word = restaurant.items[0];

  await addSingleDeckWord(db, restaurant, word, 'Мой словарь');

  const [myVocabulary] = await loadUserDecks(db);
  assert.equal(myVocabulary?.title, 'Мой словарь');
  assert.equal(myVocabulary?.itemCount, 1);

  const card = await db.get<{ source_deck_id: string }>(
    'SELECT source_deck_id FROM card WHERE item_id = ?',
    [word.itemId]
  );
  assert.equal(card?.source_deck_id, restaurant.id);
});
