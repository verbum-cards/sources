// Чистая конфигурация cards-user-<target>-<native>.db — без логики.

// Язык в имени файла — задел под переключение пар (docs/decisions.md,
// ADR-30): для MVP всегда en-ru, но имя уже не предполагает «файл один и
// навсегда» — переименовывать по живым данным пользователей в v2 не придётся.
export const CARDS_DB_FILENAME = 'cards-user-en-ru.db';

// Применяются вне миграционной транзакции (foreign_keys — no-op внутри BEGIN,
// поэтому пользовательская база настраивается сразу после открытия).
export const USER_DB_PRAGMAS: readonly string[] = [
  'PRAGMA journal_mode = WAL',
  'PRAGMA foreign_keys = ON',
  'PRAGMA busy_timeout = 5000',
  'PRAGMA synchronous = NORMAL',
];
