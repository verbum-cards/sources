import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import type { DbExecutor } from '../../executor';
import { createExpoExecutor } from '../../expo-executor';
import { DICTIONARY_DB_FILENAME, DICTIONARY_READ_PRAGMAS } from './dictionary.config';
import { ensureDictionaryPackageBuilt } from './ensure-built';

// Открывает готовый пакет словаря (только чтение). Пакет собирается конвейером
// apps/api/scripts (вне области T1.4) по DICTIONARY_SCHEMA_SQL из @cards/contracts.
export async function openDictionaryDatabase(
  name = DICTIONARY_DB_FILENAME
): Promise<{ db: SQLiteDatabase; executor: DbExecutor }> {
  const db = await openDatabaseAsync(name);
  const executor = createExpoExecutor(db);
  for (const pragma of DICTIONARY_READ_PRAGMAS) {
    await executor.execRaw(pragma);
  }

  return { db, executor };
}

// Тонкая обёртка над ensure-built.ts (ADR-25) — открывает expo-sqlite,
// досеивает/пересобирает пакет при необходимости, включает read-only. Сама
// логика «нужна ли пересборка» — в ensure-built.ts, отдельно от expo-sqlite,
// чтобы её можно было гонять в тестах через node:sqlite.
export async function openOrBuildDictionaryDatabase(
  name = DICTIONARY_DB_FILENAME
): Promise<DbExecutor> {
  const db = await openDatabaseAsync(name);
  const executor = createExpoExecutor(db);

  await ensureDictionaryPackageBuilt(executor);

  for (const pragma of DICTIONARY_READ_PRAGMAS) {
    await executor.execRaw(pragma);
  }

  return executor;
}
