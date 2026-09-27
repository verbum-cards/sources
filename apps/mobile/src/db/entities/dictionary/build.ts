import { DICTIONARY_SCHEMA_SQL, DICTIONARY_SCHEMA_VERSION, type Lang } from '@cards/contracts';

import type { DbExecutor } from '../../executor';
import { DICTIONARY_BUILD_PRAGMAS } from './dictionary.config';

export interface EmptyDictionaryPackageOptions {
  lang: Lang;
  nativeLang: Lang;
  builtAt: string; // ISO
}

// Создаёт пустой (без строк) пакет словаря по DICTIONARY_SCHEMA_SQL — для тестов
// миграций/запросов и для локальной разработки до готовности конвейера
// apps/api/scripts. Работает через DbExecutor, поэтому пригоден и для
// expo-sqlite на устройстве, и для node:sqlite в тестах.
export async function createEmptyDictionaryPackage(
  db: DbExecutor,
  options: EmptyDictionaryPackageOptions
): Promise<void> {
  for (const pragma of DICTIONARY_BUILD_PRAGMAS) {
    await db.execRaw(pragma);
  }
  await db.execRaw(DICTIONARY_SCHEMA_SQL);
  await db.execRaw(`PRAGMA user_version = ${DICTIONARY_SCHEMA_VERSION}`);

  const meta: Record<string, string> = {
    schema_version: String(DICTIONARY_SCHEMA_VERSION),
    content_version: '0',
    lang: options.lang,
    native_lang: options.nativeLang,
    sense_count: '0',
    built_at: options.builtAt,
  };
  for (const [key, value] of Object.entries(meta)) {
    await db.run('INSERT INTO pack_meta (key, value) VALUES (?, ?)', [key, value]);
  }
}
