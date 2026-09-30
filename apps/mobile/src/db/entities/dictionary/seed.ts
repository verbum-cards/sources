import { DECKS, type MockDeck } from '../../../mocks/decks';
import { WORDS, type MockWord } from '../../../mocks/words';
import type { DbExecutor } from '../../executor';

// Временный сид пакета словаря — разворачивает mocks/words.ts и mocks/decks.ts
// в настоящие таблицы DICTIONARY_SCHEMA_SQL (см. open.ts::openOrBuildDictionaryDatabase
// и ADR-25). Единственная функция, которая должна исчезнуть, когда появится
// реальный конвейер (apps/api/scripts, skill dictionary-pipeline) и раздача
// готового пакета — тогда пакет будет приходить собранным, а не строиться на
// устройстве.
function normalize(text: string): string {
  return text.trim().toLowerCase();
}

// Хэш содержимого WORDS/DECKS — не криптографический, просто «изменилось —
// не изменилось» (см. pack_meta.seed_source_hash, open.ts::ensureDictionaryPackageBuilt).
// Даёт пакету автоматически пересобраться на следующем запуске, если кто-то
// поправил mocks/words.ts или mocks/decks.ts, без ручного сброса.
export function computeSeedSourceHash(): string {
  const content = JSON.stringify({ WORDS, DECKS });
  let hash = 5381;
  for (let i = 0; i < content.length; i += 1) {
    hash = (hash * 33) ^ content.charCodeAt(i);
  }

  return (hash >>> 0).toString(16);
}

// Вставка батчами по BATCH_SIZE строк одним INSERT (несколько VALUES-групп),
// не по строке за вызов — на ~8700 слов (~7 инсертов на слово) построчная
// вставка означает ~60 000 отдельных проходов через мост JS↔нативный SQLite
// (expo-sqlite), и это заметно на глаз при каждой пересборке пакета, даже в
// транзакции: транзакция убирает лишний fsync на диск, но не сам мост — это
// и есть сейчас основная стоимость. 100 строк × макс. 7 колонок = 700
// параметров на INSERT, с запасом ниже типичного лимита SQLite (999).
const BATCH_SIZE = 100;

async function batchInsert(
  db: DbExecutor,
  table: string,
  columns: readonly string[],
  rows: readonly (readonly unknown[])[]
): Promise<void> {
  if (rows.length === 0) return;

  const placeholderGroup = `(${columns.map(() => '?').join(', ')})`;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${chunk.map(() => placeholderGroup).join(', ')}`;
    await db.run(sql, chunk.flat());
  }
}

interface WordRows {
  lexeme: unknown[][];
  sense: unknown[][];
  senseTag: unknown[][];
  expression: unknown[][];
  translation: unknown[][];
  example: unknown[][];
  exampleTranslation: unknown[][];
  searchTerm: unknown[][];
}

function collectWordRows(word: MockWord, rows: WordRows): void {
  const translationId = `tr-${word.itemId}`;

  if (word.itemType === 'sense') {
    const lexemeId = `lex-${word.itemId}`;
    rows.lexeme.push([
      lexemeId,
      'en',
      word.lemma,
      normalize(word.lemma),
      word.pos ?? null,
      word.ipa ?? null,
    ]);
    // concept_id: без межъязыковой модели концептов сид считает каждое
    // значение своим собственным концептом — id совпадает с id значения.
    rows.sense.push([word.itemId, lexemeId, word.itemId, word.cefr, word.definition, 'verified']);
    for (const goal of word.goals ?? []) {
      rows.senseTag.push([word.itemId, goal]);
    }
  } else {
    rows.expression.push([
      word.itemId,
      'en',
      word.lemma,
      normalize(word.lemma),
      word.cefr,
      word.definition,
      'verified',
    ]);
  }

  rows.translation.push([
    translationId,
    word.itemType,
    word.itemId,
    'ru',
    word.translation,
    'seed',
    1,
  ]);
  // Порядок примеров — порядок вставки: пакет читает их обратно по rowid
  // (lookup.ts), явной колонки-позиции у example нет.
  word.examples.forEach((example, index) => {
    const exampleId = `ex-${word.itemId}-${index}`;
    rows.example.push([exampleId, word.itemType, word.itemId, 'en', example.text]);
    rows.exampleTranslation.push([exampleId, 'ru', example.translation]);
  });
  // kind: 'lemma' — единственный вид поискового термина, который сид умеет
  // строить сейчас (лемма/текст фразы на изучаемом языке); поиск по переводу
  // или по словоформам (word_form) сюда пока не входит.
  rows.searchTerm.push([normalize(word.lemma), 'lemma', 'en', word.itemType, word.itemId, 0]);
}

interface DeckRows {
  deck: unknown[][];
  deckCategory: unknown[][];
  deckItem: unknown[][];
}

// Слова из колод уже входят в WORDS (mocks/decks.ts ссылается на них по
// лемме) — collectWordRows для них не повторяется здесь, тут только сама
// колода и её ссылки (deck_item) на уже засеянные значения/выражения.
function collectDeckRows(deck: MockDeck, rows: DeckRows): void {
  rows.deck.push([
    deck.id,
    deck.lang,
    deck.nativeLang,
    deck.title,
    deck.type,
    deck.context ? JSON.stringify(deck.context) : null,
  ]);
  for (const category of deck.categories) {
    rows.deckCategory.push([deck.id, category]);
  }
  deck.items.forEach((word, position) => {
    rows.deckItem.push([deck.id, word.itemType, word.itemId, word.cefr, position, word.importance]);
  });
}

// Одна транзакция на весь сид, а не по инструкции — без неё каждый INSERT
// коммитился бы на диск отдельно. BEGIN EXCLUSIVE — тот же приём, что и в
// migrate.ts, пакет в этот момент ещё не отдан читателям.
export async function seedDictionaryPackage(
  db: DbExecutor,
  builtAt: string = new Date().toISOString()
): Promise<void> {
  const wordRows: WordRows = {
    lexeme: [],
    sense: [],
    senseTag: [],
    expression: [],
    translation: [],
    example: [],
    exampleTranslation: [],
    searchTerm: [],
  };
  for (const word of WORDS) {
    collectWordRows(word, wordRows);
  }

  const deckRows: DeckRows = { deck: [], deckCategory: [], deckItem: [] };
  for (const deck of DECKS) {
    collectDeckRows(deck, deckRows);
  }

  await db.execRaw('BEGIN EXCLUSIVE');
  try {
    await batchInsert(
      db,
      'lexeme',
      ['id', 'lang', 'lemma', 'lemma_norm', 'pos', 'ipa'],
      wordRows.lexeme
    );
    await batchInsert(
      db,
      'sense',
      ['id', 'lexeme_id', 'concept_id', 'cefr', 'definition', 'status'],
      wordRows.sense
    );
    await batchInsert(db, 'sense_tag', ['sense_id', 'tag'], wordRows.senseTag);
    await batchInsert(
      db,
      'expression',
      ['id', 'lang', 'text', 'text_norm', 'cefr', 'definition', 'status'],
      wordRows.expression
    );
    await batchInsert(
      db,
      'translation',
      ['id', 'target_type', 'target_id', 'lang', 'text', 'source', 'verified'],
      wordRows.translation
    );
    await batchInsert(
      db,
      'example',
      ['id', 'target_type', 'target_id', 'lang', 'text'],
      wordRows.example
    );
    await batchInsert(
      db,
      'example_translation',
      ['example_id', 'lang', 'text'],
      wordRows.exampleTranslation
    );
    await batchInsert(
      db,
      'search_term',
      ['term_norm', 'kind', 'lang', 'item_type', 'item_id', 'rank'],
      wordRows.searchTerm
    );

    await batchInsert(
      db,
      'deck',
      ['id', 'lang', 'native_lang', 'title', 'type', 'context'],
      deckRows.deck
    );
    await batchInsert(db, 'deck_category', ['deck_id', 'category'], deckRows.deckCategory);
    await batchInsert(
      db,
      'deck_item',
      ['deck_id', 'item_type', 'item_id', 'cefr', 'position', 'importance'],
      deckRows.deckItem
    );

    const senseCount = WORDS.filter((word) => word.itemType === 'sense').length;
    await db.run(`UPDATE pack_meta SET value = ? WHERE key = 'content_version'`, ['1']);
    await db.run(`UPDATE pack_meta SET value = ? WHERE key = 'sense_count'`, [String(senseCount)]);
    await db.run(`UPDATE pack_meta SET value = ? WHERE key = 'built_at'`, [builtAt]);
    await db.run(`INSERT INTO pack_meta (key, value) VALUES (?, ?)`, [
      'seed_source_hash',
      computeSeedSourceHash(),
    ]);
    await db.execRaw('COMMIT');
  } catch (err) {
    await db.execRaw('ROLLBACK');
    throw err;
  }
}
