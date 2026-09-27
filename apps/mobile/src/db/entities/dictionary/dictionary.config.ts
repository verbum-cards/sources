// Чистая конфигурация dictionary-<lang>-<native>.db — без логики.

export const DICTIONARY_DB_FILENAME = 'user_dictionary.db';

// Собирается один раз, не WAL — файл должен быть самодостаточным при
// копировании/скачивании (без -wal/-shm спутников).
export const DICTIONARY_BUILD_PRAGMAS: readonly string[] = ['PRAGMA journal_mode = DELETE'];

// Открытие готового пакета словаря на устройстве — только чтение.
export const DICTIONARY_READ_PRAGMAS: readonly string[] = ['PRAGMA query_only = 1'];
