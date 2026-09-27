import type { Migration } from '../migrate';

// Миграция 002 — code-debt T1.5a (docs/sync-protocol.md → «Код-долг», пункты 1–2):
//   - card.state (new/learning/review/suspended/known) -> card.status
//     (active/suspended/known). Фазы обучения (new/learning/review) больше не
//     хранятся в card — они производные от card_schedule/журнала.
//   - card.merged_into_card_id — новое синхронизируемое поле для слияния дублей.
//
// card — родитель FK для card_content/card_schedule (ON DELETE CASCADE), поэтому
// таблицу нельзя просто DROP: при foreign_keys=ON это выполнит неявный DELETE
// FROM card и каскадом сотрёт card_content/card_schedule. disableForeignKeys:
// true заставляет migrate.ts выключить FK на время миграции (SQLite и так не
// даёт переключить PRAGMA foreign_keys внутри транзакции) и проверить
// целостность сразу после включения обратно.
export const m002: Migration = {
  version: 2,
  disableForeignKeys: true,
  statements: [
    `CREATE TABLE card_new (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL CHECK (item_type IN ('sense', 'expression')),
      item_id TEXT NOT NULL,
      source_deck_id TEXT,
      overrides TEXT,
      status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'known')),
      merged_into_card_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      field_meta TEXT
    )`,

    // Позитивная форма CASE: любое неожиданное старое значение state (не только
    // явные 'new'/'learning'/'review') схлопывается в 'active', а не роняет
    // миграцию новым CHECK.
    `INSERT INTO card_new (id, user_id, item_type, item_id, source_deck_id, overrides, status, merged_into_card_id, created_at, updated_at, deleted_at, field_meta)
     SELECT id, user_id, item_type, item_id, source_deck_id, overrides,
            CASE WHEN state IN ('suspended', 'known') THEN state ELSE 'active' END,
            NULL, created_at, updated_at, deleted_at, field_meta
     FROM card`,

    `DROP TABLE card`,
    `ALTER TABLE card_new RENAME TO card`,

    // Индексы уничтожаются вместе со старой таблицей — пересоздаём на новой.
    `CREATE INDEX idx_card_user_item ON card (user_id, item_type, item_id)`,
    `CREATE INDEX idx_card_user_created ON card (user_id, created_at DESC) WHERE deleted_at IS NULL`,
  ],
};
