import { DatabaseSync } from 'node:sqlite';
import type { DbExecutor } from '../../src/db/executor';

// Тестовая реализация DbExecutor поверх node:sqlite (Node 24). migrate.ts и
// хелперы пакета словаря не знают, что за исполнитель им передали — expo-sqlite
// на устройстве (src/db/open.ts) или node:sqlite здесь.
export function createNodeSqliteExecutor(db: DatabaseSync): DbExecutor {
  return {
    execRaw: async (sql) => {
      db.exec(sql);
    },
    run: async (sql, params = []) => {
      db.prepare(sql).run(...(params as never[]));
    },
    get: async <T>(sql: string, params: readonly unknown[] = []) => db.prepare(sql).get(...(params as never[])) as T | undefined,
    all: async <T>(sql: string, params: readonly unknown[] = []) => db.prepare(sql).all(...(params as never[])) as T[],
  };
}

export function openTestDatabase(location: string): DatabaseSync {
  return new DatabaseSync(location);
}
