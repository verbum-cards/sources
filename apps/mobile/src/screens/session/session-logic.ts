import type { ItemType } from '@cards/contracts';

import { getOrCreateLocalUserId } from '../../db/entities/user/app-meta';
import { getUserProfile } from '../../db/entities/user/user-profile';
import type { DbExecutor } from '../../db/executor';
import { notifyChange } from '../../utilities/event-bus';
import { computeStreakDays } from '../home/home-logic';

// Сессия повторения одной колоды (F10, docs/flows/f10.md, skill
// fsrs-scheduler) — очередь строится по deck_item той же колоды, что и
// список слов на экране колоды (UserDeckDetail/DeckDetail), а не по всем
// карточкам пользователя разом: «Мой словарь» содержит вообще все карточки,
// поэтому тренировка «Моего словаря» уже и есть тот самый «общий» сценарий
// из f10.md — отдельного глобального режима не нужно.

export interface SessionCard {
  cardId: string;
  itemType: ItemType;
  itemId: string;
  lemma: string;
  ipa: string | null;
  translation: string;
  example: string | null;
  exampleTranslation: string | null;
  // Карточка ещё ни разу не показывалась — первый показ - «знакомство»
  // (слово сразу с переводом, «Знаю это слово» / «Дальше»), не квиз, и не
  // пишется как оценка FSRS (FR-36).
  needsIntro: boolean;
}

// Сутки — по местному времени устройства, граница — местная полночь (skill
// fsrs-scheduler). Date уже хранит компоненты года/месяца/дня в локальном
// времени, поэтому не нужно вручную считать смещение от UTC.
function getLocalDayBounds(now: Date): { start: Date; end: Date } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

// Сколько новых карточек уже показано сегодня — считает first_review_at в
// card_schedule, а не review_log: «знакомство» не пишет оценку FSRS, но уже
// расходует дневной лимит (skill fsrs-scheduler), поэтому first_review_at
// (момент показа, не момент первой оценки — см. markCardIntroduced) должен
// быть источником счёта, а не журнал.
async function countIntroducedToday(db: DbExecutor, userId: string, now: Date): Promise<number> {
  const { start, end } = getLocalDayBounds(now);
  const row = await db.get<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM card_schedule cs
     JOIN card c ON c.id = cs.card_id
     WHERE c.user_id = ? AND c.deleted_at IS NULL
       AND cs.first_review_at >= ? AND cs.first_review_at < ?`,
    [userId, start.toISOString(), end.toISOString()]
  );

  return row?.count ?? 0;
}

interface CardContentRow {
  card_id: string;
  item_type: ItemType;
  item_id: string;
  lemma: string;
  ipa: string | null;
  translation: string;
  example: string | null;
  example_translation: string | null;
}

function toSessionCard(row: CardContentRow, needsIntro: boolean): SessionCard {
  return {
    cardId: row.card_id,
    itemType: row.item_type,
    itemId: row.item_id,
    lemma: row.lemma,
    ipa: row.ipa,
    translation: row.translation,
    example: row.example,
    exampleTranslation: row.example_translation,
    needsIntro,
  };
}

// Карточки со сроком повторения — просроченные (due <= now) и те, что уже
// были «знакомством», но ни разу не получили оценку FSRS (due IS NULL,
// first_review_at IS NOT NULL — например, сессия прервалась до возврата
// карточки на вопрос). Сортируются вместе по единому ключу: due, если он
// есть, иначе момент знакомства — обе величины means «когда карточка стала
// готова к показу».
async function loadDueCards(
  db: DbExecutor,
  userId: string,
  deckId: string,
  now: Date
): Promise<SessionCard[]> {
  const rows = await db.all<CardContentRow>(
    `SELECT c.id as card_id, c.item_type, c.item_id, cc.lemma, cc.ipa, cc.translation,
            cc.example, cc.example_translation
     FROM deck_item di
     JOIN card c ON c.item_type = di.item_type AND c.item_id = di.item_id AND c.user_id = ?
     JOIN card_content cc ON cc.card_id = c.id
     JOIN card_schedule cs ON cs.card_id = c.id
     WHERE di.deck_id = ? AND c.status = 'active' AND c.deleted_at IS NULL
       AND (
         (cs.due IS NOT NULL AND cs.due <= ?)
         OR (cs.due IS NULL AND cs.first_review_at IS NOT NULL)
       )
     ORDER BY COALESCE(cs.due, cs.first_review_at) ASC`,
    [userId, deckId, now.toISOString()]
  );

  return rows.map((row) => toSessionCard(row, false));
}

// Карточки, которые ещё ни разу не показывались (нет строки card_schedule
// вовсе) — в порядке добавления в колоду, не больше остатка дневного лимита.
async function loadNewCards(
  db: DbExecutor,
  userId: string,
  deckId: string,
  limit: number
): Promise<SessionCard[]> {
  if (limit <= 0) return [];

  const rows = await db.all<CardContentRow>(
    `SELECT c.id as card_id, c.item_type, c.item_id, cc.lemma, cc.ipa, cc.translation,
            cc.example, cc.example_translation
     FROM deck_item di
     JOIN card c ON c.item_type = di.item_type AND c.item_id = di.item_id AND c.user_id = ?
     JOIN card_content cc ON cc.card_id = c.id
     LEFT JOIN card_schedule cs ON cs.card_id = c.id
     WHERE di.deck_id = ? AND c.status = 'active' AND c.deleted_at IS NULL AND cs.card_id IS NULL
     ORDER BY di.position ASC
     LIMIT ?`,
    [userId, deckId, limit]
  );

  return rows.map((row) => toSessionCard(row, true));
}

// Официальные колоды (mocks/decks.ts) не имеют своей строки в таблице deck и
// никогда не попадают в deck_item (миграция 005: deck/deck_item — только
// свои, type='user') — членство в них живёт в card.source_deck_id, который
// decks-logic.ts::addDeckToUser проставляет при создании карточки и который
// НЕ меняется при перемещении между своими колодами (это устанавливает
// user-deck-logic.ts::moveWordToDeck). Поэтому нельзя просто дописать «или
// source_deck_id = deckId» в те же запросы, что и для своих колод: карточка,
// изначально добавленная через свою колоду А и потом перенесённая в B, у неё
// source_deck_id всё ещё = A, но её сессия по А уже не касается. Различаем
// принадлежность по наличию строки в deck, а не пытаемся угадать по одному
// общему запросу.
async function isCustomDeck(db: DbExecutor, deckId: string): Promise<boolean> {
  const row = await db.get<{ id: string }>('SELECT id FROM deck WHERE id = ?', [deckId]);

  return row !== undefined;
}

async function loadDueCardsForOfficialDeck(
  db: DbExecutor,
  userId: string,
  deckId: string,
  now: Date
): Promise<SessionCard[]> {
  const rows = await db.all<CardContentRow>(
    `SELECT c.id as card_id, c.item_type, c.item_id, cc.lemma, cc.ipa, cc.translation,
            cc.example, cc.example_translation
     FROM card c
     JOIN card_content cc ON cc.card_id = c.id
     JOIN card_schedule cs ON cs.card_id = c.id
     WHERE c.user_id = ? AND c.source_deck_id = ? AND c.status = 'active' AND c.deleted_at IS NULL
       AND (
         (cs.due IS NOT NULL AND cs.due <= ?)
         OR (cs.due IS NULL AND cs.first_review_at IS NOT NULL)
       )
     ORDER BY COALESCE(cs.due, cs.first_review_at) ASC`,
    [userId, deckId, now.toISOString()]
  );

  return rows.map((row) => toSessionCard(row, false));
}

async function loadNewCardsForOfficialDeck(
  db: DbExecutor,
  userId: string,
  deckId: string,
  limit: number
): Promise<SessionCard[]> {
  if (limit <= 0) return [];

  const rows = await db.all<CardContentRow>(
    `SELECT c.id as card_id, c.item_type, c.item_id, cc.lemma, cc.ipa, cc.translation,
            cc.example, cc.example_translation
     FROM card c
     JOIN card_content cc ON cc.card_id = c.id
     LEFT JOIN card_schedule cs ON cs.card_id = c.id
     WHERE c.user_id = ? AND c.source_deck_id = ? AND c.status = 'active' AND c.deleted_at IS NULL
       AND cs.card_id IS NULL
     ORDER BY c.created_at ASC
     LIMIT ?`,
    [userId, deckId, limit]
  );

  return rows.map((row) => toSessionCard(row, true));
}

// Очередь сессии для одной колоды: сначала карточки со сроком (просроченные +
// незавершённое знакомство), потом новые в пределах остатка дневного лимита
// (docs/flows/f10.md, skill fsrs-scheduler). Порядок внутри каждой группы —
// как в очереди спеки; порядок «Не помню»/переход знакомства в вопрос —
// динамическая часть сессии, см. advanceAfter*. deckId может быть и своей
// колодой (deck_item), и официальной, добавленной через «Добавить колоду»
// (source_deck_id) — см. isCustomDeck выше.
export async function buildDeckSessionQueue(
  db: DbExecutor,
  deckId: string,
  now: Date = new Date()
): Promise<readonly SessionCard[]> {
  const userId = await getOrCreateLocalUserId(db);
  const profile = await getUserProfile(db, userId);
  const newPerDay = profile?.newPerDay ?? 0;

  const introducedToday = await countIntroducedToday(db, userId, now);
  const remainingNewBudget = Math.max(0, newPerDay - introducedToday);

  const isCustom = await isCustomDeck(db, deckId);
  const dueCards = isCustom
    ? await loadDueCards(db, userId, deckId, now)
    : await loadDueCardsForOfficialDeck(db, userId, deckId, now);
  const newCards = isCustom
    ? await loadNewCards(db, userId, deckId, remainingNewBudget)
    : await loadNewCardsForOfficialDeck(db, userId, deckId, remainingNewBudget);

  return [...dueCards, ...newCards];
}

// «Знаю это слово» (FR-22) — убирает карточку из повторений насовсем, вне
// зависимости от того, была ли уже хоть одна оценка FSRS. Действие можно
// отменить в карточке слова (F14) — здесь только сама смена статуса.
export async function markCardKnown(
  db: DbExecutor,
  cardId: string,
  now: Date = new Date()
): Promise<void> {
  await db.run(`UPDATE card SET status = 'known', updated_at = ? WHERE id = ?`, [
    now.toISOString(),
    cardId,
  ]);
  notifyChange(['card']);
}

// ---------- Итог сессии (F11) ----------
//
// docs/flows/f11.md ещё не расписан подробно — берём ровно тот минимальный
// список полей, что уже зафиксирован в f10.md («Коротко», шаг 4): сколько
// карточек, доля верных, серия, что вернётся сегодня, прогноз на завтра.
// Более детальный итог (серии по типам ошибок, рекомендации и т.п.) — уже
// додумывание, не входит сюда.

export interface SessionSummary {
  cardsReviewed: number;
  // null — в сессии не было ни одного квиза с оценкой (только знакомства
  // и/или «Знаю это слово»), проценту верных тогда неоткуда взяться.
  correctRatio: number | null;
  streakDays: number;
  dueTodayCount: number;
  dueTomorrowCount: number;
}

// Тот же выбор запроса по типу колоды, что и в buildDeckSessionQueue выше
// (isCustomDeck) — источники членства для своих и официальных колод разные
// и не совместимы в одном условии.
async function countDueBetween(
  db: DbExecutor,
  userId: string,
  deckId: string,
  startIso: string,
  endIso: string
): Promise<number> {
  const isCustom = await isCustomDeck(db, deckId);
  const row = await db.get<{ count: number }>(
    isCustom
      ? `SELECT COUNT(*) as count
         FROM deck_item di
         JOIN card c ON c.item_type = di.item_type AND c.item_id = di.item_id AND c.user_id = ?
         JOIN card_schedule cs ON cs.card_id = c.id
         WHERE di.deck_id = ? AND c.status = 'active' AND c.deleted_at IS NULL
           AND cs.due IS NOT NULL AND cs.due >= ? AND cs.due < ?`
      : `SELECT COUNT(*) as count
         FROM card c
         JOIN card_schedule cs ON cs.card_id = c.id
         WHERE c.user_id = ? AND c.source_deck_id = ? AND c.status = 'active' AND c.deleted_at IS NULL
           AND cs.due IS NOT NULL AND cs.due >= ? AND cs.due < ?`,
    [userId, deckId, startIso, endIso]
  );

  return row?.count ?? 0;
}

export interface SessionAnswerStats {
  cardsReviewed: number;
  totalAnswers: number;
  correctAnswers: number;
}

// «Серия» — дни подряд хотя бы с одним ответом в этой сессии или раньше,
// той же чистой функцией, что и «серия добавления слов» на главном экране
// (home-logic.ts::computeStreakDays — она уже общая, ей всё равно, что за
// даты ей передают), только источник дат другой: review_log, а не card.created_at.
export async function computeSessionSummary(
  db: DbExecutor,
  deckId: string,
  stats: SessionAnswerStats,
  now: Date = new Date()
): Promise<SessionSummary> {
  const userId = await getOrCreateLocalUserId(db);

  const reviewLogDates = await db.all<{ reviewed_at: string }>(
    `SELECT reviewed_at FROM review_log WHERE user_id = ?`,
    [userId]
  );
  const streakDays = computeStreakDays(
    reviewLogDates.map((row) => row.reviewed_at),
    now
  );

  const { end: todayEnd } = getLocalDayBounds(now);
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  // «Вернётся сегодня» — от текущего момента, не от начала суток: то, что уже
  // было просрочено и попало в эту сессию, в неё же и попало, речь про то, что
  // FSRS отложила на попозже сегодня же (например, после «Не помню»).
  const dueTodayCount = await countDueBetween(
    db,
    userId,
    deckId,
    now.toISOString(),
    todayEnd.toISOString()
  );
  const dueTomorrowCount = await countDueBetween(
    db,
    userId,
    deckId,
    todayEnd.toISOString(),
    tomorrowEnd.toISOString()
  );

  return {
    cardsReviewed: stats.cardsReviewed,
    correctRatio: stats.totalAnswers > 0 ? stats.correctAnswers / stats.totalAnswers : null,
    streakDays,
    dueTodayCount,
    dueTomorrowCount,
  };
}

// ---------- Рантайм очереди одной сессии (чистые функции, без БД) ----------
//
// Сборка (buildDeckSessionQueue) — один SQL-снимок при старте экрана; дальше
// сессия сама двигает эту же очередь в памяти: «Не помню» и знакомство
// возвращают карточку на 3–5 позиций вперёд, «Помню» и «Знаю это слово»
// убирают её из очереди (первую — навсегда, только из этой сессии).

export interface SessionState {
  queue: readonly SessionCard[];
  position: number;
}

export function startSession(queue: readonly SessionCard[]): SessionState {
  return { queue, position: 0 };
}

export function currentSessionCard(state: SessionState): SessionCard | undefined {
  return state.queue[state.position];
}

export function isSessionDone(state: SessionState): boolean {
  return state.position >= state.queue.length;
}

const REINSERT_MIN = 3;
const REINSERT_MAX = 5;

function pickReinsertOffset(random: () => number): number {
  return REINSERT_MIN + Math.floor(random() * (REINSERT_MAX - REINSERT_MIN + 1));
}

function reinsertCurrent(
  state: SessionState,
  card: SessionCard,
  random: () => number
): SessionState {
  const withoutCurrent = state.queue.filter((_, i) => i !== state.position);
  const insertAt = Math.min(state.position + pickReinsertOffset(random), withoutCurrent.length);
  const queue = [...withoutCurrent.slice(0, insertAt), card, ...withoutCurrent.slice(insertAt)];

  // position не меняется: после удаления текущей карточки на её месте уже
  // следующая — ровно то, что нужно «перейти дальше».
  return { queue, position: state.position };
}

// Знакомство показано — не оценка FSRS, карточка возвращается тем же
// вопросом через 3–5 карточек (FR-36).
export function advanceAfterIntro(
  state: SessionState,
  random: () => number = Math.random
): SessionState {
  const card = currentSessionCard(state);
  if (!card) return state;

  return reinsertCurrent(state, { ...card, needsIntro: false }, random);
}

// «Не помню» — карточка возвращается в эту же сессию через 3–5 позиций,
// независимо от интервала FSRS в минутах.
export function advanceAfterAgain(
  state: SessionState,
  random: () => number = Math.random
): SessionState {
  const card = currentSessionCard(state);
  if (!card) return state;

  return reinsertCurrent(state, card, random);
}

// «Помню» — FSRS отложил карточку далеко вперёд, в этой сессии она больше не
// нужна.
export function advanceAfterGood(state: SessionState): SessionState {
  return { ...state, position: state.position + 1 };
}

// «Знаю это слово» — карточка убирается из очереди совсем, не возвращается.
export function advanceAfterKnown(state: SessionState): SessionState {
  const queue = state.queue.filter((_, i) => i !== state.position);

  return { queue, position: state.position };
}
