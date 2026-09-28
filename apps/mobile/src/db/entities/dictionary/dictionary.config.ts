// Чистая конфигурация dictionary-<lang>-<native>.db — без логики.

// Для MVP всегда en-ru (одна пара, docs/decisions.md ADR-30) — имя файла уже
// соответствует задокументированному формату пакета, менять при переходе на
// несколько пар в v2 не придётся.
export const DICTIONARY_DB_FILENAME = 'dictionary-en-ru.db';

// Собирается один раз, не WAL — файл должен быть самодостаточным при
// копировании/скачивании (без -wal/-shm спутников).
export const DICTIONARY_BUILD_PRAGMAS: readonly string[] = ['PRAGMA journal_mode = DELETE'];

// Открытие готового пакета словаря на устройстве — только чтение.
export const DICTIONARY_READ_PRAGMAS: readonly string[] = ['PRAGMA query_only = 1'];
