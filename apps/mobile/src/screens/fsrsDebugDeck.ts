import type { DebugWord } from './fsrsDebugWords';

export interface DebugCardRow {
  id: string;
  item_id: string;
  lemma: string;
  translation: string;
  example: string | null;
}

export interface DebugCard {
  id: string;
  itemId: string;
  lemma: string;
  translation: string;
  example: string;
}

// Строки из БД возвращаются в произвольном порядке (WHERE item_id IN (...)) —
// эта функция восстанавливает порядок как в DEBUG_WORDS и пропускает слова,
// для которых карточки ещё нет (наполнение ещё не завершено/не начато).
export function orderCardsByWordList(
  words: readonly DebugWord[],
  rows: readonly DebugCardRow[]
): DebugCard[] {
  const byItemId = new Map(rows.map((row) => [row.item_id, row]));
  const result: DebugCard[] = [];
  for (const word of words) {
    const row = byItemId.get(word.itemId);
    if (row) {
      result.push({
        id: row.id,
        itemId: row.item_id,
        lemma: row.lemma,
        translation: row.translation,
        example: row.example ?? '',
      });
    }
  }
  return result;
}

// Слова, для которых карточки ещё нет — именно их нужно вставить. Повторное
// нажатие «Добавить тестовые карточки» не создаёт дублей (не настоящая очередь,
// просто идемпотентное наполнение дебаг-набора).
export function missingWords(
  words: readonly DebugWord[],
  existingItemIds: ReadonlySet<string>
): DebugWord[] {
  return words.filter((word) => !existingItemIds.has(word.itemId));
}
