import type { DbExecutor } from './executor';
import { migrations as defaultMigrations } from './migrations';

export interface Migration {
  version: number;
  // Чистый SQL, без вызовов expo API — так миграции можно прогонять в node:sqlite.
  statements: readonly string[];
  // true — для миграций, перестраивающих таблицу, на которую ссылаются FK
  // (пересоздание parent-таблицы: DROP TABLE её каскадирует детям при
  // foreign_keys=ON). migrate.ts выключает FK на время миграции и проверяет
  // целостность (PRAGMA foreign_key_check) сразу после включения обратно.
  disableForeignKeys?: boolean;
}

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
//
// migration.disableForeignKeys — для миграций, пересоздающих таблицу-родителя FK
// (например card, на которую ссылаются card_content/card_schedule): PRAGMA
// foreign_keys нельзя переключить внутри транзакции (SQLite делает это no-op),
// а DROP TABLE родителя при foreign_keys=ON каскадом стёр бы детей. Поэтому FK
// выключается до BEGIN, включается обратно после COMMIT, и сразу проверяется
// PRAGMA foreign_key_check — если миграция оставила висячие ссылки, это ошибка.
export async function migrate(
  db: DbExecutor,
  migrationList: readonly Migration[] = defaultMigrations
): Promise<void> {
  const current = await getUserVersion(db);
  const pending = migrationList
    .filter((m) => m.version > current)
    .slice()
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    if (migration.disableForeignKeys) {
      await db.execRaw('PRAGMA foreign_keys = OFF');
    }
    try {
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
    } finally {
      if (migration.disableForeignKeys) {
        await db.execRaw('PRAGMA foreign_keys = ON');
      }
    }
    if (migration.disableForeignKeys) {
      const violations = await db.all('PRAGMA foreign_key_check');
      if (violations.length > 0) {
        throw new Error(
          `Миграция ${migration.version} нарушила ссылочную целостность: ${JSON.stringify(violations)}`
        );
      }
    }
  }
}
