import { fsrs, type Card as FsrsCard, type Grade } from 'ts-fsrs';
import type { DbExecutor } from '../db/executor';
import { uuidv7 } from '../db/id';
import type { CardScheduleRow, ReviewLogRow } from '../db/types';
import { fsrsCardToScheduleRow, scheduleRowToFsrsInput, type FsrsCardLike } from './convert';
import { BUTTON_TO_GRADE, GRADE_TO_RATING, RATING_TO_GRADE, type ButtonRating } from './ratings';

// Один инстанс на модуль с фиксированными параметрами: applyRating (пошаговое
// обновление) и recalculateSchedule (полный пересчёт из журнала) обязаны видеть
// одну и ту же конфигурацию — иначе их результаты по определению могут разойтись.
//
// enable_short_term: false — в card_schedule нет колонки learning_steps
// (см. docs/data-model.md), поэтому шаги (re)learning отключены: карточка идёт
// New -> Review напрямую, без промежуточного Learning. Это не «режим знакомства»
// (FR-36/T2.x) — тот вводит отдельный пользовательский флоу поверх обычных
// оценок FSRS и не входит в T1.7.
const scheduler = fsrs({ enable_short_term: false });

function stepFsrs(input: FsrsCardLike, now: Date, grade: Grade) {
  return scheduler.next(input, now, grade);
}

export async function getCardSchedule(db: DbExecutor, cardId: string): Promise<CardScheduleRow | undefined> {
  return db.get<CardScheduleRow>('SELECT * FROM card_schedule WHERE card_id = ?', [cardId]);
}

export async function getReviewLogs(db: DbExecutor, cardId: string): Promise<ReviewLogRow[]> {
  const rows = await db.all<ReviewLogRow>('SELECT * FROM review_log WHERE card_id = ? ORDER BY reviewed_at ASC', [cardId]);
  return rows.map((row) => ({ ...row }));
}

async function upsertScheduleRow(db: DbExecutor, row: CardScheduleRow): Promise<void> {
  await db.run(
    `INSERT INTO card_schedule (card_id, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, fsrs_state, last_review, first_review_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (card_id) DO UPDATE SET
       due = excluded.due,
       stability = excluded.stability,
       difficulty = excluded.difficulty,
       elapsed_days = excluded.elapsed_days,
       scheduled_days = excluded.scheduled_days,
       reps = excluded.reps,
       lapses = excluded.lapses,
       fsrs_state = excluded.fsrs_state,
       last_review = excluded.last_review,
       first_review_at = excluded.first_review_at`,
    [
      row.card_id,
      row.due,
      row.stability,
      row.difficulty,
      row.elapsed_days,
      row.scheduled_days,
      row.reps,
      row.lapses,
      row.fsrs_state,
      row.last_review,
      row.first_review_at,
    ],
  );
}

export interface ApplyRatingParams {
  db: DbExecutor;
  cardId: string;
  userId: string;
  deviceId: string;
  rating: ButtonRating;
  now?: Date;
  elapsedMs?: number;
}

export interface ApplyRatingResult {
  schedule: CardScheduleRow;
  reviewLog: ReviewLogRow;
}

// Применяет одну оценку («Не помню» / «Помню»): считает новое состояние FSRS по
// текущему кешу card_schedule (или пустой карточке для новой), пишет строку в
// review_log (только добавление) и обновляет кеш card_schedule.
export async function applyRating(params: ApplyRatingParams): Promise<ApplyRatingResult> {
  const now = params.now ?? new Date();
  const existing = await getCardSchedule(params.db, params.cardId);
  const input = scheduleRowToFsrsInput(existing);
  const grade = BUTTON_TO_GRADE[params.rating];
  const { card, log } = stepFsrs(input, now, grade);

  const firstReviewAt = existing?.first_review_at ?? now.toISOString();
  const scheduleRow = fsrsCardToScheduleRow(params.cardId, card, firstReviewAt);

  const reviewLogRow: ReviewLogRow = {
    id: uuidv7(now),
    card_id: params.cardId,
    user_id: params.userId,
    rating: GRADE_TO_RATING[grade],
    reviewed_at: log.review.toISOString(),
    elapsed_ms: params.elapsedMs ?? 0,
    device_id: params.deviceId,
    // Локальное смещение от UTC в минутах (знак: восток положительный, как
    // в "+03:00"), поэтому getTimezoneOffset() (обратный знак) инвертируется.
    tz_offset_min: -now.getTimezoneOffset(),
    synced_at: null,
  };

  await params.db.run(
    `INSERT INTO review_log (id, card_id, user_id, rating, reviewed_at, elapsed_ms, device_id, tz_offset_min, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      reviewLogRow.id,
      reviewLogRow.card_id,
      reviewLogRow.user_id,
      reviewLogRow.rating,
      reviewLogRow.reviewed_at,
      reviewLogRow.elapsed_ms,
      reviewLogRow.device_id,
      reviewLogRow.tz_offset_min,
      reviewLogRow.synced_at,
    ],
  );

  await upsertScheduleRow(params.db, scheduleRow);

  return { schedule: scheduleRow, reviewLog: reviewLogRow };
}

// Пересчёт "с нуля" по журналу (source of truth) — обязан давать тот же card,
// что последовательные applyRating (см. tests/scheduler/scheduler.test.ts).
// Нужен для восстановления кеша после будущей синхронизации (сама
// синхронизация — вне области T1.7).
export function recalculateSchedule(reviewLogs: readonly ReviewLogRow[]): FsrsCard | null {
  if (reviewLogs.length === 0) return null;

  const sorted = [...reviewLogs].sort((a, b) => a.reviewed_at.localeCompare(b.reviewed_at));
  let current: FsrsCardLike = scheduleRowToFsrsInput(undefined);
  for (const log of sorted) {
    const grade = RATING_TO_GRADE[log.rating];
    const { card } = stepFsrs(current, new Date(log.reviewed_at), grade);
    current = card;
  }
  return current as FsrsCard;
}

export async function recalculateAndPersist(db: DbExecutor, cardId: string): Promise<CardScheduleRow | null> {
  const logs = await getReviewLogs(db, cardId);
  const card = recalculateSchedule(logs);
  if (!card) return null;

  const sorted = [...logs].sort((a, b) => a.reviewed_at.localeCompare(b.reviewed_at));
  const scheduleRow = fsrsCardToScheduleRow(cardId, card, sorted[0].reviewed_at);
  await upsertScheduleRow(db, scheduleRow);
  return scheduleRow;
}
