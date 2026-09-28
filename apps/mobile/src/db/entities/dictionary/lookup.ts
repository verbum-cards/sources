import type { Cefr, ItemType } from '@cards/contracts';

import type { DbExecutor } from '../../executor';

// Данные слова/выражения из пакета словаря — независимая от mocks/words.ts
// форма (пакет читается и без моков, когда появится настоящий конвейер).
// cefr необязателен: эта же форма используется и для слов, у которых его
// нет (введённые вручную на главном экране, см. user-deck-logic.ts).
export interface PackWord {
  itemId: string;
  itemType: ItemType;
  lemma: string;
  pos?: string;
  ipa?: string;
  translation: string;
  example: string;
  exampleTranslation: string;
  definition: string;
  cefr?: Cefr;
}

export interface PackWordRef {
  itemType: ItemType;
  itemId: string;
}

const SEARCH_LIMIT = 8;

// Расширяет строку до диапазона префикса term_norm >= ? AND term_norm < ?
// (idx_search_term_lookup) — тот же приём, что и в tests/db/hot-queries.test.ts.
function prefixRange(prefix: string): [string, string] {
  const lastChar = prefix.charCodeAt(prefix.length - 1);
  const upper = prefix.slice(0, -1) + String.fromCharCode(lastChar + 1);

  return [prefix, upper];
}

async function loadSenseWords(db: DbExecutor, ids: readonly string[]): Promise<PackWord[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db.all<{
    item_id: string;
    lemma: string;
    pos: string | null;
    ipa: string | null;
    cefr: Cefr;
    definition: string | null;
    translation: string | null;
    example: string | null;
    example_translation: string | null;
  }>(
    `SELECT s.id as item_id, l.lemma, l.pos, l.ipa, s.cefr, s.definition,
            tr.text as translation, ex.text as example, et.text as example_translation
     FROM sense s
     JOIN lexeme l ON l.id = s.lexeme_id
     LEFT JOIN translation tr ON tr.target_type = 'sense' AND tr.target_id = s.id AND tr.lang = 'ru'
     LEFT JOIN example ex ON ex.target_type = 'sense' AND ex.target_id = s.id
     LEFT JOIN example_translation et ON et.example_id = ex.id AND et.lang = 'ru'
     WHERE s.id IN (${placeholders})`,
    [...ids]
  );

  return rows.map((row) => ({
    itemId: row.item_id,
    itemType: 'sense' as const,
    lemma: row.lemma,
    pos: row.pos ?? undefined,
    ipa: row.ipa ?? undefined,
    translation: row.translation ?? '',
    example: row.example ?? '',
    exampleTranslation: row.example_translation ?? '',
    definition: row.definition ?? '',
    cefr: row.cefr,
  }));
}

async function loadExpressionWords(db: DbExecutor, ids: readonly string[]): Promise<PackWord[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db.all<{
    item_id: string;
    text: string;
    cefr: Cefr;
    definition: string | null;
    translation: string | null;
    example: string | null;
    example_translation: string | null;
  }>(
    `SELECT e.id as item_id, e.text, e.cefr, e.definition,
            tr.text as translation, ex.text as example, et.text as example_translation
     FROM expression e
     LEFT JOIN translation tr ON tr.target_type = 'expression' AND tr.target_id = e.id AND tr.lang = 'ru'
     LEFT JOIN example ex ON ex.target_type = 'expression' AND ex.target_id = e.id
     LEFT JOIN example_translation et ON et.example_id = ex.id AND et.lang = 'ru'
     WHERE e.id IN (${placeholders})`,
    [...ids]
  );

  return rows.map((row) => ({
    itemId: row.item_id,
    itemType: 'expression' as const,
    lemma: row.text,
    translation: row.translation ?? '',
    example: row.example ?? '',
    exampleTranslation: row.example_translation ?? '',
    definition: row.definition ?? '',
    cefr: row.cefr,
  }));
}

// Полные данные по конкретным ссылкам (item_type+item_id) — свои колоды
// (screens/decks/user-deck-logic.ts) хранят в cards-user.db только ссылки:
// cards-user.db и пакет — разные файлы SQLite, JOIN между ними невозможен
// (docs/data-model.md). Порядок результата — как в refs, а не как отдала БД.
export async function loadPackWordsByRefs(
  db: DbExecutor,
  refs: readonly PackWordRef[]
): Promise<PackWord[]> {
  const senseIds = refs.filter((ref) => ref.itemType === 'sense').map((ref) => ref.itemId);
  const expressionIds = refs
    .filter((ref) => ref.itemType === 'expression')
    .map((ref) => ref.itemId);

  const [senseWords, expressionWords] = await Promise.all([
    loadSenseWords(db, senseIds),
    loadExpressionWords(db, expressionIds),
  ]);
  const byKey = new Map(
    [...senseWords, ...expressionWords].map((word) => [`${word.itemType}:${word.itemId}`, word])
  );

  return refs
    .map((ref) => byKey.get(`${ref.itemType}:${ref.itemId}`))
    .filter((word): word is PackWord => word != null);
}

// Префиксный поиск по search_term (idx_search_term_lookup, бюджет ≤300мс) —
// подбор слов в свою колоду (screens/decks/user-deck.screen.tsx). kind сейчас
// всегда 'lemma' (см. seed.ts) — поиск по переводу этим не покрывается.
export async function searchPackWordsByPrefix(
  db: DbExecutor,
  query: string,
  limit: number = SEARCH_LIMIT
): Promise<PackWord[]> {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];

  const [lower, upper] = prefixRange(normalized);
  const rows = await db.all<{ item_type: ItemType; item_id: string }>(
    `SELECT item_type, item_id FROM search_term
     WHERE term_norm >= ? AND term_norm < ? ORDER BY rank, term_norm LIMIT ?`,
    [lower, upper, limit]
  );

  return loadPackWordsByRefs(
    db,
    rows.map((row) => ({ itemType: row.item_type, itemId: row.item_id }))
  );
}
