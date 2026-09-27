import type { Migration } from '../migrate';

// Миграция 001 — начальная схема cards-user.db (schema version 1).
// Только чистый SQL: без STRICT-таблиц, jsonb, RIGHT JOIN — версии SQLite в
// expo-sqlite и node:sqlite разные. Миграции только вперёд, не редактируются.
export const m001: Migration = {
  version: 1,
  statements: [
    `CREATE TABLE app_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    )`,

    `CREATE TABLE user_profile (
      user_id TEXT PRIMARY KEY,
      native_lang TEXT NOT NULL,
      target_lang TEXT NOT NULL,
      level TEXT NOT NULL,
      goals TEXT NOT NULL,
      daily_minutes INTEGER NOT NULL,
      new_per_day INTEGER NOT NULL,
      waitlist_langs TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      field_meta TEXT
    )`,

    `CREATE TABLE card (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL CHECK (item_type IN ('sense', 'expression')),
      item_id TEXT NOT NULL,
      source_deck_id TEXT,
      overrides TEXT,
      state TEXT NOT NULL CHECK (state IN ('new', 'learning', 'review', 'suspended', 'known')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      field_meta TEXT
    )`,
    // Без UNIQUE намеренно: инвариант «одна живая карточка на (user_id, item_type,
    // item_id)» держится правилом слияния дублей (docs/sync-protocol.md → «Конфликты
    // → Дубли карточек»), а не индексом — иначе входящая операция с другого
    // устройства не применилась бы. Миграция 002 переименовывает state в status.
    `CREATE INDEX idx_card_user_item ON card (user_id, item_type, item_id)`,
    `CREATE INDEX idx_card_user_created ON card (user_id, created_at DESC) WHERE deleted_at IS NULL`,

    // Локальный снимок контента карточки: сессия и главный экран не зависят от
    // версии/наличия пакета словаря — ничего не читается JOIN'ом из dictionary-*.db.
    `CREATE TABLE card_content (
      card_id TEXT PRIMARY KEY REFERENCES card (id) ON DELETE CASCADE,
      lemma TEXT NOT NULL,
      pos TEXT,
      ipa TEXT,
      audio_url TEXT,
      cefr TEXT,
      translation TEXT NOT NULL,
      example TEXT,
      example_highlight TEXT,
      example_translation TEXT,
      source TEXT NOT NULL CHECK (source IN ('pack', 'server', 'manual')),
      content_version INTEGER,
      refreshed_at TEXT NOT NULL
    )`,

    // Кеш FSRS — производное от review_log, пересчитывается, не синхронизируется.
    `CREATE TABLE card_schedule (
      card_id TEXT PRIMARY KEY REFERENCES card (id) ON DELETE CASCADE,
      due TEXT,
      stability REAL,
      difficulty REAL,
      elapsed_days INTEGER,
      scheduled_days INTEGER,
      reps INTEGER,
      lapses INTEGER,
      fsrs_state INTEGER,
      last_review TEXT,
      first_review_at TEXT
    )`,
    `CREATE INDEX idx_card_schedule_due ON card_schedule (due)`,

    // Журнал только добавляется. Намеренно без FK на card: удаление карточки
    // (soft-delete) не должно каскадом стирать историю повторений.
    `CREATE TABLE review_log (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating TEXT NOT NULL CHECK (rating IN ('again', 'hard', 'good', 'easy')),
      reviewed_at TEXT NOT NULL,
      elapsed_ms INTEGER NOT NULL,
      device_id TEXT NOT NULL,
      tz_offset_min INTEGER NOT NULL,
      synced_at TEXT
    )`,
    `CREATE INDEX idx_review_log_card_reviewed ON review_log (card_id, reviewed_at)`,
    `CREATE INDEX idx_review_log_unsynced ON review_log (reviewed_at) WHERE synced_at IS NULL`,
    `CREATE INDEX idx_review_log_reviewed ON review_log (reviewed_at)`,

    `CREATE TABLE user_deck (
      user_id TEXT NOT NULL,
      deck_id TEXT NOT NULL,
      added_at TEXT NOT NULL,
      fast_mode INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      field_meta TEXT,
      PRIMARY KEY (user_id, deck_id)
    )`,

    // Исходящая очередь синхронизации (локальная). Запись в неё — задача будущих
    // недель; в T1.4 таблица только создаётся.
    `CREATE TABLE sync_op (
      op_id TEXT PRIMARY KEY,
      schema_version INTEGER NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      fields TEXT,
      client_ts TEXT NOT NULL,
      device_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      sent_at TEXT,
      acked_at TEXT
    )`,
    `CREATE INDEX idx_sync_op_unacked ON sync_op (client_ts) WHERE acked_at IS NULL`,
  ],
};
