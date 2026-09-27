import { createEmptyCard, type Card as FsrsCard, type CardInput as FsrsCardInput } from 'ts-fsrs';

import type { CardScheduleRow } from '../db/entities/user/types';

export type FsrsCardLike = FsrsCardInput | FsrsCard;

// card_schedule ещё нет (новая карточка) -> пустая карточка ts-fsrs (state=New).
// card_schedule есть -> строка конвертируется как есть, один в один по полям.
//
// learning_steps всегда 0: этой колонки нет в card_schedule (T1.4/T1.5a), потому
// что планировщик здесь настроен с enable_short_term: false (см. scheduler.ts) —
// шаги (re)learning не используются, карточка идёт New -> Review напрямую.
export function scheduleRowToFsrsInput(row: CardScheduleRow | undefined): FsrsCardLike {
  if (!row || row.fsrs_state == null) {
    return createEmptyCard();
  }
  return {
    due: row.due ?? new Date().toISOString(),
    stability: row.stability ?? 0,
    difficulty: row.difficulty ?? 0,
    elapsed_days: row.elapsed_days ?? 0,
    scheduled_days: row.scheduled_days ?? 0,
    learning_steps: 0,
    reps: row.reps ?? 0,
    lapses: row.lapses ?? 0,
    state: row.fsrs_state,
    last_review: row.last_review ?? null,
  };
}

export function fsrsCardToScheduleRow(
  cardId: string,
  card: FsrsCard,
  firstReviewAt: string
): CardScheduleRow {
  return {
    card_id: cardId,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    fsrs_state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : null,
    first_review_at: firstReviewAt,
  };
}
