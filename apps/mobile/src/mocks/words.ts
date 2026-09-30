import type { Cefr, Goal, ItemType, Uuid } from '@cards/contracts';

import wordsData from './words-data.json';

// Единый список слов и выражений мок-словаря — общий источник для
// mocks/fsrs-debug-words.ts (первая сессия онбординга, F1, и дебаг-экран FSRS)
// и mocks/decks.ts (ситуационные колоды): каждое слово описано здесь ровно
// один раз, кто на него ссылается — решают DEBUG_WORDS/DECKS через wordByLemma,
// а не копированием полей. Настоящего словаря ещё нет (T1.6) — тот же временный
// приём, что и раньше. Сами данные — в words-data.json рядом (генератор
// apps/api/scripts/dictionary/generate-senses.ts дописывает туда новые слова
// напрямую), этот файл — только тип и функции резолва над ними.
export interface MockWord {
  itemId: Uuid;
  itemType: ItemType;
  lemma: string;
  pos?: string;
  // Только у itemType 'sense' — транскрипция целой фразы (itemType
  // 'expression') не в общей практике словарных приложений, не добавляем.
  ipa?: string;
  translation: string;
  // Два примера на слово, каждый со своим переводом (не один общий) — так
  // видно слово в разных контекстах, а не в одной и той же фразе.
  examples: readonly { text: string; translation: string }[];
  // Для itemType 'sense' — определение слова на английском; для 'expression' —
  // пояснение, когда и как применяется фраза (тоже на английском, см.
  // word-study-card.tsx).
  definition: string;
  cefr: Cefr;
  // Только у слов, участвующих в подборе первой сессии онбординга (F1,
  // onboarding-logic.ts::getFirstSessionWords) — временная ручная разметка;
  // в настоящем словаре (T1.6) это будет sense_tag/deck_goal_tag, не поле на слове.
  goals?: readonly Goal[];
}

export const WORDS: readonly MockWord[] = wordsData as readonly MockWord[];

// lemma уникальна по всему WORDS — деки и debug-список ссылаются друг на
// друга по ней; дубль лемм упадёт здесь же, при импорте модуля, а не тихо
// перезапишет старую запись.
const WORDS_BY_LEMMA: ReadonlyMap<string, MockWord> = (() => {
  const map = new Map<string, MockWord>();
  for (const word of WORDS) {
    if (map.has(word.lemma)) {
      throw new Error(
        `WORDS: дублирующаяся лемма "${word.lemma}" — используйте отдельную лемму или разведите значения`
      );
    }
    map.set(word.lemma, word);
  }

  return map;
})();

// Ссылка на слово по лемме — то, чем DEBUG_WORDS и DECKS собирают свои списки
// из WORDS, не копируя поля. Бросает исключение сразу при импорте модуля, если
// лемма не найдена — опечатка в ссылке иначе тихо потеряла бы слово из выдачи.
export function wordByLemma(lemma: string): MockWord {
  const word = WORDS_BY_LEMMA.get(lemma);
  if (!word) {
    throw new Error(`WORDS: слово "${lemma}" не найдено — сначала добавьте его в WORDS`);
  }

  return word;
}
