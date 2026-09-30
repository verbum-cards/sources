import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { getOrCreateLocalUserId } from '../../src/db/entities/user/app-meta';
import { migrate } from '../../src/db/migrate';
import { DECKS } from '../../src/mocks/decks';
import { addDeckToUser, addSingleDeckWord } from '../../src/screens/decks/decks-logic';
import { computeDailyActivity, loadDeckProgress } from '../../src/screens/progress/progress-logic';
import { createNodeSqliteExecutor } from '../support/node-sqlite-executor';

// created_at всегда пишется как new Date().toISOString() от локального
// момента — тот же приём, что и в home-logic.test.ts, во избежание
// зависимости от часового пояса машины, на которой запущен тест.
function localIso(year: number, month: number, day: number, hour = 12): string {
  return new Date(year, month, day, hour).toISOString();
}

async function setupDb() {
  const db = new DatabaseSync(':memory:');
  const executor = createNodeSqliteExecutor(db);
  await migrate(executor);
  await getOrCreateLocalUserId(executor);

  return { db: executor };
}

// Не DECKS[0]/DECKS[1] — порядок и то, какие колоды сейчас наполнены,
// меняется по мере добавления новых data/decks/*.json (build-decks.ts).
// Двум переменным ниже нужны только любые две разные непустые колоды, не
// конкретный контент — берём две самые большие.
const [restaurant, otherDeck] = [...DECKS]
  .sort((a, b) => b.items.length - a.items.length)
  .slice(0, 2);

test('computeDailyActivity: 7 дней по умолчанию, все нули на пустом списке', () => {
  const now = new Date(2026, 2, 10, 12);

  const activity = computeDailyActivity([], now);

  assert.equal(activity.length, 7);
  assert.ok(activity.every((day) => day.count === 0));
  assert.equal(activity[6]?.date, now.toDateString());
});

test('computeDailyActivity: считает карточки по дню создания, старые даты вне окна не попадают', () => {
  const now = new Date(2026, 2, 10, 12);
  const dates = [
    localIso(2026, 2, 10, 8),
    localIso(2026, 2, 10, 20),
    localIso(2026, 2, 9, 8),
    localIso(2026, 1, 1, 8), // далеко за пределами 7 дней
  ];

  const activity = computeDailyActivity(dates, now);

  assert.equal(activity[6]?.count, 2); // сегодня — 2 карточки
  assert.equal(activity[5]?.count, 1); // вчера — 1
  const total = activity.reduce((sum, day) => sum + day.count, 0);
  assert.equal(total, 3); // дата вне окна не учтена
});

test('computeDailyActivity: длина окна регулируется параметром days', () => {
  const now = new Date(2026, 2, 10, 12);

  const activity = computeDailyActivity([], now, 3);

  assert.equal(activity.length, 3);
  assert.equal(activity[2]?.date, now.toDateString());
});

test('loadDeckProgress: пусто, пока ни одно слово ни одной колоды не добавлено', async () => {
  const { db } = await setupDb();

  assert.deepEqual(await loadDeckProgress(db), []);
});

test('loadDeckProgress: колода без единого добавленного слова не попадает в список', async () => {
  const { db } = await setupDb();

  await addSingleDeckWord(db, otherDeck, otherDeck.items[0], 'Мой словарь');

  const progress = await loadDeckProgress(db);
  assert.equal(
    progress.some((p) => p.deckId === restaurant.id),
    false
  );
});

test('loadDeckProgress: отражает частичное добавление слов колоды', async () => {
  const { db } = await setupDb();

  await addSingleDeckWord(db, restaurant, restaurant.items[0], 'Мой словарь');
  await addSingleDeckWord(db, restaurant, restaurant.items[1], 'Мой словарь');

  const progress = await loadDeckProgress(db);
  const entry = progress.find((p) => p.deckId === restaurant.id);
  assert.deepEqual(entry, {
    deckId: restaurant.id,
    title: restaurant.title,
    added: 2,
    total: restaurant.items.length,
  });
});

test('loadDeckProgress: добавление всей колоды разом тоже отражается', async () => {
  const { db } = await setupDb();

  await addDeckToUser(db, restaurant);

  const progress = await loadDeckProgress(db);
  const entry = progress.find((p) => p.deckId === restaurant.id);
  assert.equal(entry?.added, restaurant.items.length);
  assert.equal(entry?.total, restaurant.items.length);
});
