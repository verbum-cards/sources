import type { DbExecutor } from './executor';
import { migrations as defaultMigrations } from './migrations';
import type { Migration } from './types';

export async function getUserVersion(db: DbExecutor): Promise<number> {
  const row = await db.get<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

// Читает PRAGMA user_version, применяет по порядку все миграции с version > текущей.
// Каждая миграция — отдельная эксклюзивная транзакция: statements по порядку,
// затем PRAGMA user_version = <version> в той же транзакции, затем commit.
// Ошибка в любой миграции — rollback и явный throw: старт не продолжается
// на сломанной схеме. Чистая установка (user_version = 0) и обновление —
// один и тот же код: просто применяются все миграции по порядку с самого начала.
export async function migrate(db: DbExecutor, migrationList: readonly Migration[] = defaultMigrations): Promise<void> {
  const current = await getUserVersion(db);
  const pending = migrationList.filter((m) => m.version > current).slice().sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    await db.execRaw('BEGIN EXCLUSIVE');
    try {
      for (const statement of migration.statements) {
        await db.execRaw(statement);
      }
      await db.execRaw(`PRAGMA user_version = ${migration.version}`);
      await db.execRaw('COMMIT');
    } catch (err) {
      await db.execRaw('ROLLBACK');
      throw err;
    }
  }
}
