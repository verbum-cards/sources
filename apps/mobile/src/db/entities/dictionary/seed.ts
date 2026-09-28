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

async function seedWord(db: DbExecutor, word: MockWord): Promise<void> {
  const translationId = `tr-${word.itemId}`;
  const exampleId = `ex-${word.itemId}`;

  if (word.itemType === 'sense') {
    const lexemeId = `lex-${word.itemId}`;
    await db.run(
      `INSERT INTO lexeme (id, lang, lemma, lemma_norm, pos, ipa) VALUES (?, ?, ?, ?, ?, ?)`,
      [lexemeId, 'en', word.lemma, normalize(word.lemma), word.pos ?? null, word.ipa ?? null]
    );
    await db.run(
      `INSERT INTO sense (id, lexeme_id, concept_id, cefr, definition, status) VALUES (?, ?, ?, ?, ?, ?)`,
      // concept_id: без межъязыковой модели концептов сид считает каждое
      // значение своим собственным концептом — id совпадает с id значения.
      [word.itemId, lexemeId, word.itemId, word.cefr, word.definition, 'verified']
    );
    for (const goal of word.goals ?? []) {
      await db.run(`INSERT INTO sense_tag (sense_id, tag) VALUES (?, ?)`, [word.itemId, goal]);
    }
  } else {
    await db.run(
      `INSERT INTO expression (id, lang, text, text_norm, cefr, definition, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [word.itemId, 'en', word.lemma, normalize(word.lemma), word.cefr, word.definition, 'verified']
    );
  }

  await db.run(
    `INSERT INTO translation (id, target_type, target_id, lang, text, source, verified) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [translationId, word.itemType, word.itemId, 'ru', word.translation, 'seed', 1]
  );
  await db.run(
    `INSERT INTO example (id, target_type, target_id, lang, text) VALUES (?, ?, ?, ?, ?)`,
    [exampleId, word.itemType, word.itemId, 'en', word.example]
  );
  await db.run(`INSERT INTO example_translation (example_id, lang, text) VALUES (?, ?, ?)`, [
    exampleId,
    'ru',
    word.exampleTranslation,
  ]);
  // kind: 'lemma' — единственный вид поискового термина, который сид умеет
  // строить сейчас (лемма/текст фразы на изучаемом языке); поиск по переводу
  // или по словоформам (word_form) сюда пока не входит.
  await db.run(
    `INSERT INTO search_term (term_norm, kind, lang, item_type, item_id, rank) VALUES (?, ?, ?, ?, ?, ?)`,
    [normalize(word.lemma), 'lemma', 'en', word.itemType, word.itemId, 0]
  );
}

async function seedDeck(db: DbExecutor, deck: MockDeck): Promise<void> {
  await db.run(
    `INSERT INTO deck (id, lang, native_lang, title, type, context) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      deck.id,
      deck.lang,
      deck.nativeLang,
      deck.title,
      deck.type,
      deck.context ? JSON.stringify(deck.context) : null,
    ]
  );
  for (const tag of deck.goalTags) {
    await db.run(`INSERT INTO deck_goal_tag (deck_id, tag) VALUES (?, ?)`, [deck.id, tag]);
  }
  for (let position = 0; position < deck.items.length; position += 1) {
    const word = deck.items[position];
    await db.run(
      `INSERT INTO deck_item (deck_id, item_type, item_id, cefr, position, importance) VALUES (?, ?, ?, ?, ?, ?)`,
      [deck.id, word.itemType, word.itemId, word.cefr, position, word.importance]
    );
  }
}

// Слова из колод уже входят в WORDS (mocks/decks.ts ссылается на них по
// лемме) — seedWord для них не повторяется в seedDeck, там только сама
// колода и её ссылки (deck_item) на уже засеянные значения/выражения.
export async function seedDictionaryPackage(
  db: DbExecutor,
  builtAt: string = new Date().toISOString()
): Promise<void> {
  for (const word of WORDS) {
    await seedWord(db, word);
  }
  for (const deck of DECKS) {
    await seedDeck(db, deck);
  }

  const senseCount = WORDS.filter((word) => word.itemType === 'sense').length;
  await db.run(`UPDATE pack_meta SET value = ? WHERE key = 'content_version'`, ['1']);
  await db.run(`UPDATE pack_meta SET value = ? WHERE key = 'sense_count'`, [String(senseCount)]);
  await db.run(`UPDATE pack_meta SET value = ? WHERE key = 'built_at'`, [builtAt]);
  await db.run(`INSERT INTO pack_meta (key, value) VALUES (?, ?)`, [
    'seed_source_hash',
    computeSeedSourceHash(),
  ]);
}
