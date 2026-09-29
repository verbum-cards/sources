import type { Migration } from '../migrate';

// Миграция 006 — несколько примеров на карточку вместо одного (T2.x, экран
// слова): card_content.example/example_highlight/example_translation были
// по одной штуке на карточку; card_content_example — отдельная таблица
// (один-ко-многим, тот же приём, что и deck_item), а не JSON-массив в
// колонке. card_id ссылается на card (id), а не на card_content (card_id) —
// не зависит от порядка операций с card_content ниже, поэтому
// disableForeignKeys не нужен (card_content ни на кого не ссылается как
// родитель FK, в отличие от card в миграции 002).
//
// example_highlight не переносится: колонка нигде фактически не читалась —
// подсветка слова в примере считается на клиенте (utilities/highlight-word.ts).
export const m006: Migration = {
  version: 6,
  statements: [
    `CREATE TABLE card_content_example (
      card_id TEXT NOT NULL REFERENCES card (id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      text TEXT NOT NULL,
      translation TEXT NOT NULL,
      PRIMARY KEY (card_id, position)
    )`,

    // Существующий единственный пример каждой карточки становится позицией 0.
    `INSERT INTO card_content_example (card_id, position, text, translation)
     SELECT card_id, 0, example, COALESCE(example_translation, '')
     FROM card_content
     WHERE example IS NOT NULL AND example != ''`,

    `CREATE TABLE card_content_new (
      card_id TEXT PRIMARY KEY REFERENCES card (id) ON DELETE CASCADE,
      lemma TEXT NOT NULL,
      pos TEXT,
      ipa TEXT,
      audio_url TEXT,
      cefr TEXT,
      translation TEXT NOT NULL,
      definition TEXT,
      source TEXT NOT NULL CHECK (source IN ('pack', 'server', 'manual')),
      content_version INTEGER,
      refreshed_at TEXT NOT NULL
    )`,

    `INSERT INTO card_content_new (card_id, lemma, pos, ipa, audio_url, cefr, translation, definition, source, content_version, refreshed_at)
     SELECT card_id, lemma, pos, ipa, audio_url, cefr, translation, definition, source, content_version, refreshed_at
     FROM card_content`,

    `DROP TABLE card_content`,
    `ALTER TABLE card_content_new RENAME TO card_content`,
  ],
};
