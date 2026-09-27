import { DEBUG_WORDS, type DebugWord } from '../mocks/fsrs-debug-words';

// F6 «Добавление слова за 5 секунд» (docs/flows/f06.md): реального локального
// словаря на устройстве ещё нет (T1.6), поэтому источник данных — временный
// мок DEBUG_WORDS. Сигнатуры этих двух функций — то, что видит вызывающий код
// (word-add-logic.ts, word-add-panel.tsx); когда появится настоящий словарь,
// поменяется только тело этих функций (мок -> запрос к таблице словаря), а не
// вызывающий код.

export const SUGGESTION_LIMIT = 3;
const MIN_QUERY_LENGTH = 2;

// Шаг 2 флоу: после 2+ символов — до 3 подсказок по префиксу леммы, без учёта
// регистра, в исходном порядке словаря.
export function searchWordsByPrefix(
  query: string,
  limit: number = SUGGESTION_LIMIT
): readonly DebugWord[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < MIN_QUERY_LENGTH) {
    return [];
  }

  return DEBUG_WORDS.filter((word) => word.lemma.toLowerCase().startsWith(normalized)).slice(
    0,
    limit
  );
}

// Тап по подсказке или Enter (шаг 3): точное совпадение леммы без учёта
// регистра. undefined -> ветка «Не нашли» (ручной ввод), см. word-add-logic.ts.
export function findWordByLemma(query: string): DebugWord | undefined {
  const normalized = query.trim().toLowerCase();

  return DEBUG_WORDS.find((word) => word.lemma.toLowerCase() === normalized);
}
