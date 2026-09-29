import type { Goal, UserLevel, UserProfileStored } from '@cards/contracts';

import type { DbExecutor } from '../../db/executor';
import { DEBUG_ITEM_TYPE, DEBUG_WORDS, type DebugWord } from '../../mocks/fsrs-debug-words';
import { applyRating } from '../../scheduler/scheduler';
import { notifyChange } from '../../utilities/event-bus';
import { uuidv7 } from '../../utilities/id';
import { addToMyVocabulary } from '../decks/user-deck-logic';

// F1, шаг «Первая сессия»: настоящего словаря по уровню/цели ещё нет (T1.6),
// поэтому набор — временный мок (см. mocks/fsrs-debug-words.ts), но подобранный
// по выбранным на шаге «Цель» темам (docs/flows/f01.md → «Как используется
// цель: ... первые слова берутся из тем выбранных целей»), а не просто первые
// FIRST_SESSION_SIZE по порядку.
export const FIRST_SESSION_SIZE = 5;

// 1. Слова, чьи goals пересекаются с переданными goals, — первыми, в исходном
//    порядке списка.
// 2. Если таких меньше FIRST_SESSION_SIZE — дополняем остальными словами (не из
//    отфильтрованных), тоже в исходном порядке, без дублей.
// 3. Пустой goals (по факту не должен приходить — «Пропустить» на шаге цели
//    сохраняет ['self'], см. SKIPPED_GOALS ниже) не ломает функцию: ничего не
//    совпадёт, и результат — первые FIRST_SESSION_SIZE слов по порядку, как
//    было раньше.
export function getFirstSessionWords(goals: readonly Goal[]): readonly DebugWord[] {
  const goalSet = new Set(goals);
  const matching = DEBUG_WORDS.filter((word) => word.goals.some((goal) => goalSet.has(goal)));
  if (matching.length >= FIRST_SESSION_SIZE) {
    return matching.slice(0, FIRST_SESSION_SIZE);
  }

  const matchingIds = new Set(matching.map((word) => word.itemId));
  const rest = DEBUG_WORDS.filter((word) => !matchingIds.has(word.itemId));

  return [...matching, ...rest].slice(0, FIRST_SESSION_SIZE);
}

export function isFirstSessionFinished(index: number, total: number): boolean {
  return index >= total;
}

export interface AnswerFirstSessionWordParams {
  db: DbExecutor;
  userId: string;
  deviceId: string;
  word: DebugWord;
  // true — «Знаю это слово», false — «Не знаю» (см. ниже).
  knowsWord: boolean;
  // Как и в decks-logic.ts/user-deck-logic.ts — заголовок передаёт вызывающий
  // экран (доступ к i18n), сама эта функция не UI-слой.
  myVocabularyTitle: string;
  now?: Date;
}

// Каждый ответ первой сессии создаёт настоящую карточку (card + card_content,
// тот же паттерн, что в fsrs-debug.screen.tsx::addTestCards):
//   «Знаю это слово» -> card.status = 'known', без review_log/card_schedule —
//                        известные слова исключены из повторений (FR-22).
//   «Не знаю»        -> card.status = 'active' + applyRating(rating: 'again') —
//                        по-настоящему заводит review_log/card_schedule тем же
//                        планировщиком, что и весь остальной продукт; никакой
//                        новой логики планирования здесь не изобретаем.
// Любое слово, которое пользователь у себя видит впервые, попадает и в «Мой
// словарь» (addToMyVocabulary) — тот же принцип, что и для колод
// (decks-logic.ts::addSingleDeckWord), просто источник слова другой.
// Возвращает id созданной карточки.
export async function answerFirstSessionWord({
  db,
  userId,
  deviceId,
  word,
  knowsWord,
  myVocabularyTitle,
  now = new Date(),
}: AnswerFirstSessionWordParams): Promise<string> {
  const nowIso = now.toISOString();
  const cardId = uuidv7(now);

  await db.run(
    'INSERT INTO card (id, user_id, item_type, item_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [cardId, userId, DEBUG_ITEM_TYPE, word.itemId, knowsWord ? 'known' : 'active', nowIso, nowIso]
  );
  await db.run(
    `INSERT INTO card_content (card_id, lemma, pos, ipa, cefr, translation, example, example_translation, definition, source, refreshed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      cardId,
      word.lemma,
      word.pos,
      word.ipa,
      word.cefr,
      word.translation,
      word.example,
      word.exampleTranslation,
      word.definition,
      'manual',
      nowIso,
    ]
  );
  notifyChange(['card', 'card_content']);
  await addToMyVocabulary(db, DEBUG_ITEM_TYPE, word.itemId, myVocabularyTitle, now);

  if (!knowsWord) {
    await applyRating({ db, cardId, userId, deviceId, rating: 'again', now });
  }

  return cardId;
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
    // Имя — не собирается в онбординге (F1), только на экране «Профиль»
    // (profile-logic.ts::updateProfileName); здесь всегда null.
    name: null,
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
