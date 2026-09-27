import { type SQLiteBindParams, type SQLiteDatabase } from 'expo-sqlite';

import { DbExecutor } from './executor';

// Оборачивает expo-sqlite в общий DbExecutor — общий адаптер для обеих баз
// (cards-user.db и dictionary-*.db), используется их open.ts (db/user/open.ts,
// db/dictionary/open.ts). migrate.ts и хелперы пакета словаря о expo вообще
// не знают — см. executor.ts.

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
