import type { Cefr, ItemType } from '@cards/contracts';

import {
  loadPackWordsByRefs,
  type PackWord,
  type PackWordRef,
} from '../../db/entities/dictionary/lookup';
import { getOrCreateLocalUserId } from '../../db/entities/user/app-meta';
import type { DbExecutor } from '../../db/executor';
import { notifyChange } from '../../utilities/event-bus';
import { uuidv7 } from '../../utilities/id';

// Свои колоды (тип 'user', миграция 005) — собираются на устройстве из слов,
// уже существующих в пакете словаря, не из произвольного текста (см. ADR).
// Полностью локально: без sync_op, без синхронизации между устройствами —
// это сознательно расширяет объём беты за пределы docs/sync-protocol.md
// («колоды user/shared — v1»), но только для этой части, не для протокола.

export interface UserDeck {
  id: string;
  title: string;
  itemCount: number;
}

// «Мой словарь» всегда первая в списке (id сверяется с app_meta, не с
// названием — оно просто текст, ничем не защищено от совпадения), дальше —
// остальные колоды по свежести.
export async function loadUserDecks(db: DbExecutor): Promise<readonly UserDeck[]> {
  const userId = await getOrCreateLocalUserId(db);
  const rows = await db.all<{ id: string; title: string; item_count: number }>(
    `SELECT d.id, d.title, COUNT(di.item_id) as item_count
     FROM deck d
     LEFT JOIN deck_item di ON di.deck_id = d.id
     WHERE d.user_id = ? AND d.deleted_at IS NULL
     GROUP BY d.id
     ORDER BY (d.id = (SELECT value FROM app_meta WHERE key = 'my_vocabulary_deck_id')) DESC,
              d.created_at DESC`,
    [userId]
  );

  return rows.map((row) => ({ id: row.id, title: row.title, itemCount: row.item_count }));
}

// Название своей колоды для заголовка UserDeckDetail — отдельным запросом,
// а не поиском по loadUserDecks: экрану внутри колоды не нужен весь список,
// и название остаётся живым (переподписка на 'deck'), если колоду
// переименовали, пока пользователь в ней.
export async function loadUserDeck(db: DbExecutor, deckId: string): Promise<UserDeck | undefined> {
  const row = await db.get<{ id: string; title: string; item_count: number }>(
    `SELECT d.id, d.title, COUNT(di.item_id) as item_count
     FROM deck d
     LEFT JOIN deck_item di ON di.deck_id = d.id
     WHERE d.id = ? AND d.deleted_at IS NULL
     GROUP BY d.id`,
    [deckId]
  );

  return row ? { id: row.id, title: row.title, itemCount: row.item_count } : undefined;
}

export async function createUserDeck(
  db: DbExecutor,
  title: string,
  now: Date = new Date()
): Promise<string> {
  const userId = await getOrCreateLocalUserId(db);
  const nowIso = now.toISOString();
  const deckId = uuidv7(now);

  await db.run(
    `INSERT INTO deck (id, user_id, title, lang, native_lang, type, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [deckId, userId, title.trim(), 'en', 'ru', 'user', nowIso, nowIso]
  );
  notifyChange(['deck']);

  return deckId;
}

// Свайп по своей колоде в «Мои колоды» — мягкое удаление (deleted_at), тем
// же полем, что и у остальных пользовательских данных (docs/data-model.md,
// инвариант 7). Ссылки deck_item на неё не трогаем — loadUserDecks и так
// фильтрует по deck.deleted_at IS NULL, они просто перестают быть видны.
// «Мой словарь» этой функцией не защищена — запрет только на экране
// (decks.screen.tsx не показывает жест на этой строке), сама функция ничем
// не отличает её от любой другой колоды.
export async function deleteUserDeck(
  db: DbExecutor,
  deckId: string,
  now: Date = new Date()
): Promise<void> {
  const nowIso = now.toISOString();
  await db.run(`UPDATE deck SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
    nowIso,
    nowIso,
    deckId,
  ]);
  notifyChange(['deck']);
}

// Вторая иконка того же свайпа — переименование своей колоды. Пустой title
// (после trim) — нет-оп, а не запись пустой строки: экран уже не даёт нажать
// кнопку сохранения в этом случае, но функция сама себя тоже защищает.
export async function renameUserDeck(
  db: DbExecutor,
  deckId: string,
  title: string,
  now: Date = new Date()
): Promise<void> {
  const trimmed = title.trim();
  if (!trimmed) return;

  await db.run(`UPDATE deck SET title = ?, updated_at = ? WHERE id = ?`, [
    trimmed,
    now.toISOString(),
    deckId,
  ]);
  notifyChange(['deck']);
}

// Колода «Мой словарь» — заводится сама, при первом слове, добавленном с
// главного экрана (word-add-logic.ts); id хранится в app_meta, а не
// вычисляется по названию — переименование в будущем не сломает связь.
// title передаётся вызывающим кодом (экран, доступ к i18n), а не берётся
// здесь: сама эта функция — не UI-слой.
export async function getOrCreateMyVocabularyDeck(
  db: DbExecutor,
  title: string,
  now: Date = new Date()
): Promise<string> {
  const userId = await getOrCreateLocalUserId(db);
  const existing = await db.get<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = 'my_vocabulary_deck_id'"
  );
  if (existing?.value) {
    // app_meta и deck — разные таблицы без FK (deck.id не ссылается никуда
    // формально), поэтому указатель может «протухнуть»: например, если
    // локальный user_id сменился (пересоздание app_meta при разработке) —
    // тогда колода с этим id физически есть, но принадлежит уже другому
    // user_id, и loadUserDecks её не найдёт. Проверяем оба условия, не
    // только факт существования строки.
    const deckRow = await db.get<{ id: string }>(
      'SELECT id FROM deck WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [existing.value, userId]
    );
    if (deckRow) {
      return existing.value;
    }
  }

  const deckId = await createUserDeck(db, title, now);
  await db.run(
    `INSERT INTO app_meta (key, value) VALUES ('my_vocabulary_deck_id', ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    [deckId]
  );

  return deckId;
}

async function loadUserDeckItemRefs(
  db: DbExecutor,
  deckId: string
): Promise<readonly PackWordRef[]> {
  const rows = await db.all<{ item_type: ItemType; item_id: string }>(
    `SELECT item_type, item_id FROM deck_item WHERE deck_id = ? ORDER BY position`,
    [deckId]
  );

  return rows.map((row) => ({ itemType: row.item_type, itemId: row.item_id }));
}

// Резолв ссылок, которых нет в пакете словаря — слова, добавленные вручную
// на главном экране (word-add-logic.ts::addManualWord) не проходят через
// поиск по пакету и получают свежий itemId, которого там нет. Данные для
// них берём из card_content этого пользователя — она всегда есть, раз
// deck_item на неё ссылается.
async function loadLocalWordsByRefs(
  db: DbExecutor,
  userId: string,
  refs: readonly PackWordRef[]
): Promise<PackWord[]> {
  if (refs.length === 0) return [];
  const ids = refs.map((ref) => ref.itemId);
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db.all<{
    item_type: ItemType;
    item_id: string;
    lemma: string;
    pos: string | null;
    ipa: string | null;
    cefr: string | null;
    translation: string;
    example: string | null;
    example_translation: string | null;
    definition: string | null;
  }>(
    `SELECT c.item_type, c.item_id, cc.lemma, cc.pos, cc.ipa, cc.cefr, cc.translation,
            cc.example, cc.example_translation, cc.definition
     FROM card c
     JOIN card_content cc ON cc.card_id = c.id
     WHERE c.user_id = ? AND c.deleted_at IS NULL AND c.item_id IN (${placeholders})`,
    [userId, ...ids]
  );

  const refKeys = new Set(refs.map((ref) => `${ref.itemType}:${ref.itemId}`));

  return rows
    .filter((row) => refKeys.has(`${row.item_type}:${row.item_id}`))
    .map((row) => ({
      itemId: row.item_id,
      itemType: row.item_type,
      lemma: row.lemma,
      pos: row.pos ?? undefined,
      ipa: row.ipa ?? undefined,
      translation: row.translation,
      example: row.example ?? '',
      exampleTranslation: row.example_translation ?? '',
      definition: row.definition ?? '',
      cefr: (row.cefr ?? undefined) as Cefr | undefined,
    }));
}

// Слова своей колоды в порядке добавления, с полными данными — сперва из
// пакета словаря (deck_item хранит только ссылки, cards-user.db и пакет —
// разные файлы, JOIN между ними невозможен, docs/data-model.md), а для
// ссылок, которых там нет (слова, введённые вручную), — из card_content.
export async function loadUserDeckWords(
  db: DbExecutor,
  dictionaryDb: DbExecutor,
  deckId: string
): Promise<readonly PackWord[]> {
  const refs = await loadUserDeckItemRefs(db, deckId);
  const packWords = await loadPackWordsByRefs(dictionaryDb, refs);
  const foundKeys = new Set(packWords.map((word) => `${word.itemType}:${word.itemId}`));
  const missingRefs = refs.filter((ref) => !foundKeys.has(`${ref.itemType}:${ref.itemId}`));

  const userId = await getOrCreateLocalUserId(db);
  const localWords =
    missingRefs.length > 0 ? await loadLocalWordsByRefs(db, userId, missingRefs) : [];

  const byKey = new Map(
    [...packWords, ...localWords].map((word) => [`${word.itemType}:${word.itemId}`, word])
  );

  return refs
    .map((ref) => byKey.get(`${ref.itemType}:${ref.itemId}`))
    .filter((word): word is PackWord => word != null);
}

// Только ссылка (deck_item) — для случаев, когда карточка на это значение уже
// точно существует (word-add-logic.ts создаёт её сама и сразу же прикрепляет
// к «Моему словарю»). Нет-оп, если ссылка уже есть.
export async function addExistingCardToDeck(
  db: DbExecutor,
  deckId: string,
  itemType: ItemType,
  itemId: string,
  now: Date = new Date()
): Promise<void> {
  const alreadyInDeck = await db.get<{ deck_id: string }>(
    `SELECT deck_id FROM deck_item WHERE deck_id = ? AND item_type = ? AND item_id = ?`,
    [deckId, itemType, itemId]
  );
  if (alreadyInDeck) return;

  const nowIso = now.toISOString();
  const positionRow = await db.get<{ next: number }>(
    `SELECT COUNT(*) as next FROM deck_item WHERE deck_id = ?`,
    [deckId]
  );
  await db.run(
    `INSERT INTO deck_item (deck_id, item_type, item_id, position, added_at) VALUES (?, ?, ?, ?, ?)`,
    [deckId, itemType, itemId, positionRow?.next ?? 0, nowIso]
  );
  await db.run(`UPDATE deck SET updated_at = ? WHERE id = ?`, [nowIso, deckId]);
  notifyChange(['deck_item']);
}

// Свайп по слову в списке «в колоде» (UserDeckDetail) — убирает только
// ссылку (deck_item) из этой конкретной колоды, саму карточку не трогает:
// слово может быть ещё в «Мой словарь» или другой колоде, да и повторения
// FSRS по нему — отдельная история, свайп по списку колоды её не отменяет.
export async function removeWordFromUserDeck(
  db: DbExecutor,
  deckId: string,
  itemType: ItemType,
  itemId: string,
  now: Date = new Date()
): Promise<void> {
  await db.run(`DELETE FROM deck_item WHERE deck_id = ? AND item_type = ? AND item_id = ?`, [
    deckId,
    itemType,
    itemId,
  ]);
  await db.run(`UPDATE deck SET updated_at = ? WHERE id = ?`, [now.toISOString(), deckId]);
  notifyChange(['deck_item']);
}

// Любое отдельное слово, которое пользователь добавляет себе в карточки — с
// главного экрана (word-add-logic.ts), из официальной колоды
// (decks-logic.ts::addSingleDeckWord) или из своей (addWordToUserDeck ниже)
// — попадает и в «Мой словарь» тоже, отдельной ссылкой deck_item, независимо
// от source_deck_id карточки (тот указывает, откуда слово взяли, это не
// меняется). Нет-оп, если слово там уже есть (та же колода дважды или сама
// «Мой словарь» — тоже безопасно).
export async function addToMyVocabulary(
  db: DbExecutor,
  itemType: ItemType,
  itemId: string,
  title: string,
  now: Date = new Date()
): Promise<void> {
  const deckId = await getOrCreateMyVocabularyDeck(db, title, now);
  await addExistingCardToDeck(db, deckId, itemType, itemId, now);
}

// Добавляет слово из пакета в свою колоду: ссылка (deck_item) + сразу личная
// карточка (card + card_content), тем же способом, что и официальные колоды
// (decks-logic.ts::addDeckWordCard) — источник данных теперь пакет словаря,
// а не mocks/decks.ts. Заодно попадает и в «Мой словарь» (addToMyVocabulary) —
// нет-оп, если это и есть сама «Мой словарь». Возвращает false, если слово
// уже в этой колоде — нет-оп.
export async function addWordToUserDeck(
  db: DbExecutor,
  deckId: string,
  word: PackWord,
  myVocabularyTitle: string,
  now: Date = new Date()
): Promise<boolean> {
  const alreadyInDeck = await db.get<{ deck_id: string }>(
    `SELECT deck_id FROM deck_item WHERE deck_id = ? AND item_type = ? AND item_id = ?`,
    [deckId, word.itemType, word.itemId]
  );
  if (alreadyInDeck) return false;

  await addExistingCardToDeck(db, deckId, word.itemType, word.itemId, now);
  await addToMyVocabulary(db, word.itemType, word.itemId, myVocabularyTitle, now);

  const userId = await getOrCreateLocalUserId(db);
  // Тот же критерий дубликата, что и в decks-logic.ts::isItemAlreadyAdded —
  // слово может уже быть личной карточкой пользователя (из другой колоды или
  // добавлено вручную); тогда просто не заводим вторую карточку на то же значение.
  const existingCard = await db.get<{ id: string }>(
    `SELECT id FROM card
     WHERE user_id = ? AND item_type = ? AND item_id = ?
       AND status IN ('active', 'known') AND deleted_at IS NULL`,
    [userId, word.itemType, word.itemId]
  );
  if (!existingCard) {
    const nowIso = now.toISOString();
    const cardId = uuidv7(now);
    await db.run(
      `INSERT INTO card (id, user_id, item_type, item_id, source_deck_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [cardId, userId, word.itemType, word.itemId, deckId, 'active', nowIso, nowIso]
    );
    await db.run(
      `INSERT INTO card_content (card_id, lemma, pos, ipa, cefr, translation, example, example_translation, definition, source, refreshed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cardId,
        word.lemma,
        word.pos ?? null,
        word.ipa ?? null,
        word.cefr,
        word.translation,
        word.example,
        word.exampleTranslation,
        word.definition,
        'pack',
        nowIso,
      ]
    );
    notifyChange(['card', 'card_content']);
  }

  return true;
}
