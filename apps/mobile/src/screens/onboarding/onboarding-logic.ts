import type { Goal, UserLevel, UserProfileStored } from '@cards/contracts';

import { DEBUG_WORDS, type DebugWord } from '../../mocks/fsrs-debug-words';

// F1, шаг «Первая сессия»: настоящего словаря по уровню/цели ещё нет (T1.6),
// поэтому набор — первые FIRST_SESSION_SIZE слов общего временного мока
// (см. mocks/fsrs-debug-words.ts). Один и тот же набор для всех — не выбирается
// по уровню/цели, это сознательное упрощение.
export const FIRST_SESSION_SIZE = 5;

export function getFirstSessionWords(): readonly DebugWord[] {
  return DEBUG_WORDS.slice(0, FIRST_SESSION_SIZE);
}

export function isFirstSessionFinished(index: number, total: number): boolean {
  return index >= total;
}

// «Пропустить» на шаге цели работает как выбор «для себя» (docs/flows/f01.md
// → «Пропустил вопрос — работаем как «для себя»»), а не как пустой список целей.
export const SKIPPED_GOALS: readonly Goal[] = ['self'];

export function toggleGoal(selected: readonly Goal[], goal: Goal): Goal[] {
  return selected.includes(goal) ? selected.filter((g) => g !== goal) : [...selected, goal];
}

// user_profile.new_per_day: «5 / 10 / 15 по времени в день» (skill
// fsrs-scheduler) — то же значение, что и dailyMinutes. Другой формулы лимита
// в бете нет, это не финальный алгоритм.
export function mapDailyMinutesToNewPerDay(dailyMinutes: 5 | 10 | 15): number {
  return dailyMinutes;
}

export const DEFAULT_LEVEL: UserLevel = 'unknown';
export const DEFAULT_DAILY_MINUTES: 5 | 10 | 15 = 10;

// Первая пара языков — русский → английский (docs/product.md); в онбординге
// беты выбор языка не спрашивается.
const NATIVE_LANG = 'ru';
const TARGET_LANG = 'en';

export interface OnboardingAnswers {
  goals: Goal[];
  level: UserLevel;
  dailyMinutes: 5 | 10 | 15;
}

// Единственная точка сборки user_profile за весь онбординг (F1): пишется один
// раз, в конце флоу (после шага «Время в день») — см. onboarding.screen.tsx.
// Если пользователь закрыл приложение раньше — user_profile не создаётся,
// и следующий запуск начинает онбординг заново (FR-29 полностью не покрыт,
// это сознательное упрощение).
export function buildUserProfileDraft(
  userId: string,
  answers: OnboardingAnswers,
  now: string
): UserProfileStored {
  return {
    userId,
    nativeLang: NATIVE_LANG,
    targetLang: TARGET_LANG,
    level: answers.level,
    goals: answers.goals,
    dailyMinutes: answers.dailyMinutes,
    newPerDay: mapDailyMinutesToNewPerDay(answers.dailyMinutes),
    waitlistLangs: [],
    updatedAt: now,
    fieldRevisions: {},
  };
}
