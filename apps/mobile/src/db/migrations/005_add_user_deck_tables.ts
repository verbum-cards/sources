import type { Migration } from '../migrate';

// Миграция 005 — свои колоды (тип 'user'): собираются на устройстве из слов,
// уже существующих в пакете словаря (dictionary-<lang>-<native>.db), не из
// произвольного текста. deck/deck_item здесь — не то же самое, что
// одноимённые таблицы в пакете: те read-only и содержат официальный контент,
// эти — обычные таблицы cards-user.db, пишет только сам пользователь.
//
// По docs/sync-protocol.md колоды user/shared становятся отдельной парой
// сущностей синхронизации только в v1 (вне беты) — здесь это сознательно
// расширяет объём беты (см. docs/decisions.md), но пока полностью локально:
// без sync_op, без field_meta — синхронизация между устройствами для своих
// колод осталась вне этой задачи.
//
// item_id ссылается на sense.id/expression.id в пакете словаря — внешнего
// ключа между файлами нет (два независимых SQLite, без ATTACH/JOIN,
// docs/data-model.md), тот же принцип, что и у card.item_id.
export const m005: Migration = {
  version: 5,
  statements: [
    `CREATE TABLE deck (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      lang TEXT NOT NULL,
      native_lang TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type = 'user'),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    )`,
    `CREATE INDEX idx_deck_user ON deck (user_id) WHERE deleted_at IS NULL`,

    `CREATE TABLE deck_item (
      deck_id TEXT NOT NULL REFERENCES deck (id) ON DELETE CASCADE,
      item_type TEXT NOT NULL CHECK (item_type IN ('sense', 'expression')),
      item_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      added_at TEXT NOT NULL,
      PRIMARY KEY (deck_id, item_type, item_id)
    )`,
  ],
};
