// Формат пакета словаря на устройстве: dictionary-<lang>-<native>.db.
// Только чтение (PRAGMA query_only = 1 при открытии), без FTS5, без миграций —
// пакет заменяется целиком или дельтой. Версия формата — DICTIONARY_SCHEMA_VERSION
// (сверяется с PRAGMA user_version пакета и с pack_meta.schema_version).
import { z } from 'zod';

import { IsoDateSchema, LangSchema } from './content';

export const DICTIONARY_SCHEMA_VERSION = 3;

export const DictionaryPackMetaSchema = z.object({
  schemaVersion: z.number(),
  contentVersion: z.number(),
  lang: LangSchema,
  nativeLang: LangSchema,
  senseCount: z.number(),
  builtAt: IsoDateSchema,
});
export type DictionaryPackMeta = z.infer<typeof DictionaryPackMetaSchema>;

// DDL пакета словаря — один и тот же для mobile (чтение) и будущего конвейера
// apps/api/scripts (сборка). Теги и цели — отдельные таблицы (не JSON), чтобы
// по ним можно было построить индекс. `concept` отдельной таблицей не заводим.
export const DICTIONARY_SCHEMA_SQL = `
CREATE TABLE lexeme (
  id TEXT PRIMARY KEY,
  lang TEXT NOT NULL,
  lemma TEXT NOT NULL,
  lemma_norm TEXT NOT NULL,
  pos TEXT NOT NULL,
  ipa TEXT,
  audio_url TEXT,
  frequency_rank INTEGER
);

CREATE TABLE sense (
  id TEXT PRIMARY KEY,
  lexeme_id TEXT NOT NULL REFERENCES lexeme (id),
  concept_id TEXT NOT NULL,
  cefr TEXT NOT NULL,
  frequency_rank INTEGER,
  -- Определение значения на изучаемом языке (см. card_content.definition,
  -- apps/mobile) — добавлено версией 2, схема была написана раньше этого поля.
  definition TEXT,
  status TEXT NOT NULL
);

CREATE TABLE sense_tag (
  sense_id TEXT NOT NULL REFERENCES sense (id),
  tag TEXT NOT NULL,
  PRIMARY KEY (sense_id, tag)
);

CREATE TABLE expression (
  id TEXT PRIMARY KEY,
  lang TEXT NOT NULL,
  text TEXT NOT NULL,
  text_norm TEXT NOT NULL,
  cefr TEXT NOT NULL,
  audio_url TEXT,
  -- Пояснение, когда и как применяется фраза, на изучаемом языке (см.
  -- card_content.definition) — добавлено версией 2, см. sense.definition выше.
  definition TEXT,
  status TEXT NOT NULL
);

CREATE TABLE expression_tag (
  expression_id TEXT NOT NULL REFERENCES expression (id),
  tag TEXT NOT NULL,
  PRIMARY KEY (expression_id, tag)
);

CREATE TABLE expression_concept (
  expression_id TEXT NOT NULL REFERENCES expression (id),
  concept_id TEXT NOT NULL,
  PRIMARY KEY (expression_id, concept_id)
);

CREATE TABLE translation (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('sense', 'expression')),
  target_id TEXT NOT NULL,
  lang TEXT NOT NULL,
  text TEXT NOT NULL,
  source TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE example (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('sense', 'expression')),
  target_id TEXT NOT NULL,
  lang TEXT NOT NULL,
  text TEXT NOT NULL,
  highlight_start INTEGER,
  highlight_end INTEGER,
  audio_url TEXT
);

CREATE TABLE example_translation (
  example_id TEXT NOT NULL REFERENCES example (id),
  lang TEXT NOT NULL,
  text TEXT NOT NULL,
  PRIMARY KEY (example_id, lang)
);

CREATE TABLE word_form (
  form_norm TEXT NOT NULL,
  lexeme_id TEXT NOT NULL REFERENCES lexeme (id),
  PRIMARY KEY (form_norm, lexeme_id)
);

-- Единый индекс поиска: леммы, формы, выражения, переводы на родном языке.
CREATE TABLE search_term (
  term_norm TEXT NOT NULL,
  kind TEXT NOT NULL,
  lang TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  rank INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE deck (
  id TEXT PRIMARY KEY,
  lang TEXT NOT NULL,
  native_lang TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  context TEXT
);

-- Категория каталога (DeckCategorySchema, decks.ts) — версия 3, заменяет
-- deck_goal_tag (Goal из онбординга, ADR-24): тема/ситуация, не цель изучения.
CREATE TABLE deck_category (
  deck_id TEXT NOT NULL REFERENCES deck (id),
  category TEXT NOT NULL,
  PRIMARY KEY (deck_id, category)
);

CREATE TABLE deck_item (
  deck_id TEXT NOT NULL REFERENCES deck (id),
  item_type TEXT NOT NULL CHECK (item_type IN ('sense', 'expression')),
  item_id TEXT NOT NULL,
  cefr TEXT NOT NULL,
  position INTEGER NOT NULL,
  importance INTEGER NOT NULL,
  PRIMARY KEY (deck_id, item_type, item_id)
);

CREATE TABLE pack_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Горячий запрос 1: префикс при вводе (<=300мс) — term_norm >= ? AND term_norm < ?.
CREATE INDEX idx_search_term_lookup ON search_term (term_norm, rank);

-- Горячий запрос 3: подбор новых по уровню/цели.
CREATE INDEX idx_sense_cefr_rank ON sense (cefr, frequency_rank);
CREATE INDEX idx_sense_tag_lookup ON sense_tag (tag, sense_id);
CREATE INDEX idx_sense_lexeme ON sense (lexeme_id);
CREATE INDEX idx_translation_target ON translation (target_type, target_id, lang);
CREATE INDEX idx_example_target ON example (target_type, target_id);
`;
