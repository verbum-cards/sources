import { openDatabaseAsync, type SQLiteBindParams, type SQLiteDatabase } from 'expo-sqlite';
import type { DbExecutor } from './executor';
import { DICTIONARY_READ_PRAGMAS, USER_DB_PRAGMAS } from './pragmas';
import { migrate } from './migrate';

// Оборачивает expo-sqlite в общий DbExecutor, которым пользуются migrate.ts и
// хелперы пакета словаря (они не знают об expo вообще — см. executor.ts).
export function createExpoExecutor(db: SQLiteDatabase): DbExecutor {
  return {
    execRaw: (sql) => db.execAsync(sql),
    run: async (sql, params = []) => {
      await db.runAsync(sql, params as SQLiteBindParams);
    },
    get: async (sql, params = []) => {
      const row = await db.getFirstAsync(sql, params as SQLiteBindParams);
      return (row ?? undefined) as never;
    },
    all: (sql, params = []) => db.getAllAsync(sql, params as SQLiteBindParams) as never,
  };
}

// Открывает cards-user.db, применяет PRAGMA (вне транзакции) и прогоняет
// миграции. Ошибка миграции — явный throw, приложение не стартует на
// сломанной схеме.
export async function openUserDatabase(name = 'cards-user.db'): Promise<{ db: SQLiteDatabase; executor: DbExecutor }> {
  const db = await openDatabaseAsync(name);
  const executor = createExpoExecutor(db);
  for (const pragma of USER_DB_PRAGMAS) {
    await executor.execRaw(pragma);
  }
  await migrate(executor);
  return { db, executor };
}

// Открывает готовый пакет словаря (только чтение). Пакет собирается конвейером
// apps/api/scripts (вне области T1.4) по DICTIONARY_SCHEMA_SQL из @cards/contracts.
export async function openDictionaryDatabase(name: string): Promise<{ db: SQLiteDatabase; executor: DbExecutor }> {
  const db = await openDatabaseAsync(name);
  const executor = createExpoExecutor(db);
  for (const pragma of DICTIONARY_READ_PRAGMAS) {
    await executor.execRaw(pragma);
  }
  return { db, executor };
}
