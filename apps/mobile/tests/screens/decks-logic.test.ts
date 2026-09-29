import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import type { Cefr } from '@cards/contracts';
import { GoalSchema } from '@cards/contracts';

import { getOrCreateLocalUserId } from '../../src/db/entities/user/app-meta';
import { loadUserDeckIds } from '../../src/db/entities/user/user-deck';
import { migrate } from '../../src/db/migrate';
import { DECKS, FIRST_STEPS_DECK_ID, REVIEW_DECK_ID } from '../../src/mocks/decks';
import type { DeckWord, MockDeck } from '../../src/mocks/decks';
import {
  addDeckToUser,
  addSingleDeckWord,
  getDeckLevel,
  groupDecksByGoal,
  isDeckWordAdded,
  loadAddedDeckIds,
  loadAddedDeckItemIds,
  removeDeckFromUser,
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

test('DECKS: «Первые шаги» — без goalTags, только слова уровня A1', () => {
  const firstSteps = DECKS.find((deck) => deck.id === FIRST_STEPS_DECK_ID);
  assert.ok(firstSteps, 'FIRST_STEPS_DECK_ID должен указывать на существующую колоду в DECKS');
  assert.deepEqual(firstSteps.goalTags, []);
  assert.ok(firstSteps.items.length > 0);
  for (const word of firstSteps.items) {
    assert.equal(word.cefr, 'A1', `"${word.lemma}" в «Первые шаги» должно быть уровня A1`);
  }
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

function makeWord(cefr: Cefr, overrides: Partial<DeckWord> = {}): DeckWord {
  return {
    itemId: `item-${cefr}-${Math.random()}`,
    itemType: 'sense',
    lemma: 'word',
    translation: 'слово',
    examples: [],
    definition: '',
    cefr,
    importance: 2,
    ...overrides,
  };
}

test('getDeckLevel: самый частый уровень среди слов колоды', () => {
  const deck = makeDeck({
    items: [makeWord('A2'), makeWord('A2'), makeWord('B1')],
  });

  assert.equal(getDeckLevel(deck), 'A2');
});

test('getDeckLevel: при ничьей побеждает более сложный уровень', () => {
  const deck = makeDeck({
    items: [makeWord('A2'), makeWord('B1')],
  });

  assert.equal(getDeckLevel(deck), 'B1');
});

test('getDeckLevel: пустая колода -> undefined', () => {
  assert.equal(getDeckLevel(makeDeck({ items: [] })), undefined);
});

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

  // «Первые шаги» (FIRST_STEPS_DECK_ID) и «Проверка партий» (REVIEW_DECK_ID)
  // — намеренные исключения: обе не про ситуацию (одна про уровень, другая
  // техническая), goalTags у них пустой нарочно, decks.screen.tsx показывает
  // их отдельными блоками вне каталога по целям.
  for (const deck of DECKS) {
    if (deck.id === FIRST_STEPS_DECK_ID || deck.id === REVIEW_DECK_ID) continue;
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

test('removeDeckFromUser: убирает колоду из loadAddedDeckIds (мягкое удаление user_deck), карточки не трогает', async () => {
  const { db, userId } = await setupDb();
  await addDeckToUser(db, restaurant);

  await removeDeckFromUser(db, restaurant.id);

  assert.deepEqual(await loadAddedDeckIds(db), new Set());
  const cards = await db.all('SELECT id FROM card WHERE user_id = ?', [userId]);
  assert.equal(cards.length, restaurant.items.length);
});

test('removeDeckFromUser: повторное «Добавить колоду» после удаления снова помечает её добавленной', async () => {
  const { db } = await setupDb();
  await addDeckToUser(db, restaurant);
  await removeDeckFromUser(db, restaurant.id);

  await addDeckToUser(db, restaurant);

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

test('addSingleDeckWord: слово, уже существующее карточкой из другого источника, всё равно попадает в «Мой словарь»', async () => {
  const { db, userId } = await setupDb();
  const word = restaurant.items[0];
  const now = '2026-01-01T00:00:00.000Z';

  // Карточка уже есть — например, слово добавили с главного экрана или из
  // другой колоды, где оно тоже встречается.
  await db.run(
    'INSERT INTO card (id, user_id, item_type, item_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['existing-card', userId, word.itemType, word.itemId, 'active', now, now]
  );

  const added = await addSingleDeckWord(db, restaurant, word, 'Мой словарь', new Date(now));

  assert.equal(added, false, 'новая карточка не создаётся — она уже была');
  const [myVocabulary] = await loadUserDecks(db);
  assert.equal(myVocabulary?.title, 'Мой словарь');
  assert.equal(myVocabulary?.itemCount, 1);
});
