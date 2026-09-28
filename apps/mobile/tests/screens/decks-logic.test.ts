import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { getOrCreateLocalUserId } from '../../src/db/entities/user/app-meta';
import { loadUserDeckIds } from '../../src/db/entities/user/user-deck';
import { migrate } from '../../src/db/migrate';
import { DECKS } from '../../src/mocks/decks';
import { addDeckToUser, loadAddedDeckIds } from '../../src/screens/decks/decks-logic';
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
