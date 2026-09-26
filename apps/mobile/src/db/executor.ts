// Общий интерфейс доступа к SQLite, реализуемый и через expo-sqlite (на устройстве,
// см. open.ts), и через node:sqlite (в тестах, см. tests/db). migrate.ts и хелперы
// пакета словаря знают только этот интерфейс — ни один из них не импортирует expo.
export interface DbExecutor {
  // Произвольный SQL без параметров: DDL, PRAGMA, BEGIN/COMMIT/ROLLBACK.
  execRaw(sql: string): Promise<void>;
  // Одна инструкция с параметрами, без результата (INSERT/UPDATE/DELETE).
  run(sql: string, params?: readonly unknown[]): Promise<void>;
  get<T = unknown>(sql: string, params?: readonly unknown[]): Promise<T | undefined>;
  all<T = unknown>(sql: string, params?: readonly unknown[]): Promise<T[]>;
}
