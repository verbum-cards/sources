import { Rating as FsrsRating, type Grade } from 'ts-fsrs';

import type { Rating as OurRating } from '@cards/contracts';

// Дефолтный 2-кнопочный режим (.claude/skills/fsrs-scheduler/SKILL.md):
// «Не помню» -> Again, «Помню» -> Good. Расширенный 4-кнопочный режим
// (Hard/Easy) — вне области T1.7.
export const BUTTON_TO_GRADE = {
  again: FsrsRating.Again,
  good: FsrsRating.Good,
} as const satisfies Record<'again' | 'good', Grade>;

export type ButtonRating = keyof typeof BUTTON_TO_GRADE;

// review_log.rating в @cards/contracts — полный Rating (again/hard/good/easy),
// поэтому пересчёт из журнала обязан уметь читать все четыре значения, даже
// если сегодняшний экран проверки отправляет только два.
export const GRADE_TO_RATING: Record<Grade, OurRating> = {
  [FsrsRating.Again]: 'again',
  [FsrsRating.Hard]: 'hard',
  [FsrsRating.Good]: 'good',
  [FsrsRating.Easy]: 'easy',
};

export const RATING_TO_GRADE: Record<OurRating, Grade> = {
  again: FsrsRating.Again,
  hard: FsrsRating.Hard,
  good: FsrsRating.Good,
  easy: FsrsRating.Easy,
};
