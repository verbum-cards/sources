import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { createExpoExecutor } from '../../expo-executor';
import type { DbExecutor } from '../../executor';
import { migrate } from '../../migrate';
import { CARDS_DB_FILENAME, USER_DB_PRAGMAS } from './user.config';

// Открывает cards-user.db, применяет PRAGMA (вне транзакции) и прогоняет
// миграции. Ошибка миграции — явный throw, приложение не стартует на
// сломанной схеме.
export async function openUserDatabase(name = CARDS_DB_FILENAME): Promise<{ db: SQLiteDatabase; executor: DbExecutor }> {
  const db = await openDatabaseAsync(name);
  const executor = createExpoExecutor(db);
  for (const pragma of USER_DB_PRAGMAS) {
    await executor.execRaw(pragma);
  }
  await migrate(executor);
  return { db, executor };
}
