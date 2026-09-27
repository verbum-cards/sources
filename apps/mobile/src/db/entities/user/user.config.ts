// Чистая конфигурация cards-user.db — без логики.

export const CARDS_DB_FILENAME = 'user_cards.db';

// Применяются вне миграционной транзакции (foreign_keys — no-op внутри BEGIN,
// поэтому пользовательская база настраивается сразу после открытия).
export const USER_DB_PRAGMAS: readonly string[] = [
  'PRAGMA journal_mode = WAL',
  'PRAGMA foreign_keys = ON',
  'PRAGMA busy_timeout = 5000',
  'PRAGMA synchronous = NORMAL',
];
