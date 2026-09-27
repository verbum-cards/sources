import type { Migration } from '../migrate';

// Миграция 003 — экран «Профиль»: имя пользователя (user_profile.name),
// свободный текст, необязательное. Простой ALTER TABLE ADD COLUMN — не
// пересборка таблицы, поэтому disableForeignKeys не нужен (в отличие от 002).
// Существующие профили получат name = NULL — это ожидаемое и валидное
// значение (UserProfileSchema.name — z.string().nullable()).
export const m003: Migration = {
  version: 3,
  statements: [`ALTER TABLE user_profile ADD COLUMN name TEXT`],
};
