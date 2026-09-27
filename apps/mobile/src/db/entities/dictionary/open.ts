import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { createExpoExecutor } from '../../expo-executor';
import type { DbExecutor } from '../../executor';
import {DICTIONARY_DB_FILENAME, DICTIONARY_READ_PRAGMAS} from './dictionary.config';

// Открывает готовый пакет словаря (только чтение). Пакет собирается конвейером
// apps/api/scripts (вне области T1.4) по DICTIONARY_SCHEMA_SQL из @cards/contracts.
export async function openDictionaryDatabase(name = DICTIONARY_DB_FILENAME): Promise<{ db: SQLiteDatabase; executor: DbExecutor }> {
  const db = await openDatabaseAsync(name);
  const executor = createExpoExecutor(db);
  for (const pragma of DICTIONARY_READ_PRAGMAS) {
    await executor.execRaw(pragma);
  }

  return { db, executor };
}
