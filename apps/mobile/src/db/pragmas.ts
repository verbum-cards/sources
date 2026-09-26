// PRAGMA-списки, применяемые вне миграционной транзакции (foreign_keys — no-op
// внутри BEGIN, поэтому пользовательская база настраивается сразу после открытия).

// cards-user.db: пользовательские данные, читаются и пишутся на устройстве.
export const USER_DB_PRAGMAS: readonly string[] = [
  'PRAGMA journal_mode = WAL',
  'PRAGMA foreign_keys = ON',
  'PRAGMA busy_timeout = 5000',
  'PRAGMA synchronous = NORMAL',
];

// dictionary-<lang>-<native>.db: собирается один раз, не WAL — файл должен быть
// самодостаточным при копировании/скачивании (без -wal/-shm спутников).
export const DICTIONARY_BUILD_PRAGMAS: readonly string[] = ['PRAGMA journal_mode = DELETE'];

// Открытие готового пакета словаря на устройстве — только чтение.
export const DICTIONARY_READ_PRAGMAS: readonly string[] = ['PRAGMA query_only = 1'];
