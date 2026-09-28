import type { ItemType } from '@cards/contracts';

// Подгруппы для списков слов (колоды, «Недавно добавлены») — по itemType и
// pos, без нового поля в данных: 'expression' с вопросительным знаком ->
// вопросы, остальные expression -> фразы; 'sense' с pos noun/noun phrase ->
// существительные, verb -> глаголы, adjective -> прилагательные; всё, что не
// попало ни в одну из этих категорий -> «Другое», а не молча теряется.
export type WordCategory = 'nouns' | 'verbs' | 'adjectives' | 'phrases' | 'questions' | 'other';

const CATEGORY_ORDER: readonly WordCategory[] = [
  'nouns',
  'verbs',
  'adjectives',
  'phrases',
  'questions',
  'other',
];

export interface CategorizableWord {
  itemType: ItemType;
  lemma: string;
  pos?: string | null;
}

export function categorizeWord(word: CategorizableWord): WordCategory {
  if (word.itemType === 'expression') {
    return word.lemma.trim().endsWith('?') ? 'questions' : 'phrases';
  }
  if (word.pos === 'noun' || word.pos === 'noun phrase') return 'nouns';
  if (word.pos === 'verb') return 'verbs';
  if (word.pos === 'adjective') return 'adjectives';

  return 'other';
}

export interface WordGroup<T> {
  category: WordCategory;
  items: readonly T[];
}

// Порядок групп фиксирован (CATEGORY_ORDER), пустые группы не возвращаются.
export function groupWords<T extends CategorizableWord>(
  items: readonly T[]
): readonly WordGroup<T>[] {
  const groups = new Map<WordCategory, T[]>();
  for (const word of items) {
    const category = categorizeWord(word);
    const bucket = groups.get(category);
    if (bucket) {
      bucket.push(word);
    } else {
      groups.set(category, [word]);
    }
  }

  return CATEGORY_ORDER.filter((category) => groups.has(category)).map((category) => ({
    category,
    items: groups.get(category) ?? [],
  }));
}
