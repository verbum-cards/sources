import { getOrCreateLocalUserId } from '../../db/entities/user/app-meta';
import type { DbExecutor } from '../../db/executor';

// Порог, с которого на главном экране появляются «Цель дня» и плитки
// статистики — то же число, что и в гипотезе активации (docs/product.md →
// «Метрики беты», docs/flows/f01.md → «Активация»: прошёл первую сессию и
// добавил ≥ 3 своих слова за 24 часа). Пока слов меньше, экран показывает
// только «Недавно добавлены»: одно действие — добавить ещё слово, без
// лишнего шума на старте (принцип «Просто работает», docs/product.md).
export const HOME_WIDGETS_REVEAL_THRESHOLD = 3;

// Стрик показываем только с 2 дней подряд: «серия — 1 день» в день онбординга
// не сигнал прогресса, а шум — все 5 слов первой сессии создаются в одну
// секунду одного и того же дня.
export const STREAK_REVEAL_THRESHOLD = 2;

export async function countUserCards(db: DbExecutor): Promise<number> {
  const userId = await getOrCreateLocalUserId(db);
  const row = await db.get<{ count: number }>(
    'SELECT COUNT(*) as count FROM card WHERE user_id = ? AND deleted_at IS NULL',
    [userId]
  );

  return row?.count ?? 0;
}

const RECENT_CARDS_LIMIT = 10;

export interface RecentCard {
  word: string;
  translation: string;
  createdAt: string;
}

// Блок «Недавно добавлены» — единственный кусок непустого состояния, который
// уже переведён на реальные данные (остальное подключаем сейчас же).
export async function loadRecentCards(db: DbExecutor): Promise<RecentCard[]> {
  const userId = await getOrCreateLocalUserId(db);
  const rows = await db.all<{ lemma: string; translation: string; created_at: string }>(
    `SELECT cc.lemma, cc.translation, c.created_at
     FROM card c
     JOIN card_content cc ON cc.card_id = c.id
     WHERE c.user_id = ? AND c.deleted_at IS NULL
     ORDER BY c.created_at DESC
     LIMIT ?`,
    [userId, RECENT_CARDS_LIMIT]
  );

  return rows.map((row) => ({
    word: row.lemma,
    translation: row.translation,
    createdAt: row.created_at,
  }));
}

export interface HomeStats {
  learned: number;
  queued: number;
}

// «Выучено» — card.status = 'known' (пользователь сам отметил «Знаю это
// слово», F1/F14). «В очереди» — card.status = 'active' без ни одной записи
// в card_schedule: она появляется только через applyRating (scheduler.ts),
// то есть слово добавлено, но ни одного повторения по нему ещё не было.
export async function loadHomeStats(db: DbExecutor): Promise<HomeStats> {
  const userId = await getOrCreateLocalUserId(db);
  const row = await db.get<{ learned: number; queued: number }>(
    `SELECT
       SUM(CASE WHEN c.status = 'known' THEN 1 ELSE 0 END) as learned,
       SUM(CASE WHEN c.status = 'active' AND cs.card_id IS NULL THEN 1 ELSE 0 END) as queued
     FROM card c
     LEFT JOIN card_schedule cs ON cs.card_id = c.id
     WHERE c.user_id = ? AND c.deleted_at IS NULL`,
    [userId]
  );

  return { learned: row?.learned ?? 0, queued: row?.queued ?? 0 };
}

// «Цель дня» на главном намеренно не про сессию повторения — F10 ещё не
// реализован (docs/decisions.md), «Повторить сейчас» на главном экране пока
// скрыт целиком. Вместо этого — дневной лимит новых карточек из онбординга
// (FR-21, user_profile.new_per_day) и сколько слов из него уже добавлено
// сегодня: и то, и другое про «список слов, которые пользователь добавил»,
// без выдумывания несуществующей механики сессий.
export async function loadCardCreationDates(db: DbExecutor): Promise<string[]> {
  const userId = await getOrCreateLocalUserId(db);
  const rows = await db.all<{ created_at: string }>(
    'SELECT created_at FROM card WHERE user_id = ? AND deleted_at IS NULL',
    [userId]
  );

  return rows.map((row) => row.created_at);
}

export function countCardsCreatedToday(
  createdAtList: readonly string[],
  now: Date = new Date()
): number {
  const today = now.toDateString();

  return createdAtList.filter((iso) => new Date(iso).toDateString() === today).length;
}

// Серия дней подряд с хотя бы одним добавленным словом. Если сегодня ещё
// ничего не добавлено, серия не обнуляется в полночь — она «жива» до конца
// дня, поэтому отсчёт в этом случае начинается со вчерашнего дня.
export function computeStreakDays(
  createdAtList: readonly string[],
  now: Date = new Date()
): number {
  const days = new Set(createdAtList.map((iso) => new Date(iso).toDateString()));
  const cursor = new Date(now);
  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
