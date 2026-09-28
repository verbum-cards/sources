import { DICTIONARY_SCHEMA_VERSION } from '@cards/contracts';

import type { DbExecutor } from '../../executor';
import { createEmptyDictionaryPackage, dropDictionarySchema } from './build';
import { computeSeedSourceHash, seedDictionaryPackage } from './seed';

// Собирает пакет, если он ещё не собран или собран старой схемой
// (user_version !== DICTIONARY_SCHEMA_VERSION — первый запуск на этом
// устройстве, чистый файл или устаревший формат), а если схема текущая —
// пересобирает, когда mocks/words.ts/mocks/decks.ts разошлись с тем, что уже
// засеяно (pack_meta.seed_source_hash != computeSeedSourceHash() — см.
// seed.ts). Так пакет на устройстве сам подхватывает правки в моках на
// следующем запуске, без ручного сброса. Чистая DbExecutor-функция — не
// импортирует expo-sqlite (в отличие от open.ts), поэтому тестируется через
// node:sqlite.
//
// Временная замена настоящей раздачи пакета (докачка целиком или дельтой,
// docs/data-model.md), пока не готов конвейер apps/api/scripts (ADR-25):
// исчезнуть должна она одна, вызывающий код (провайдер в App.tsx) не
// изменится. Без восстановления после сбоя на середине сборки — это
// временный локальный сид, не продовая раздача контента; если сборка
// прервётся посреди пересборки, следующий запуск попробует снова с того же
// места (DROP TABLE IF EXISTS в dropDictionarySchema идемпотентен).
export async function ensureDictionaryPackageBuilt(db: DbExecutor): Promise<void> {
  const versionRow = await db.get<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;
  const isCurrentSchema = currentVersion === DICTIONARY_SCHEMA_VERSION;

  let needsBuild = !isCurrentSchema;
  if (isCurrentSchema) {
    const hashRow = await db.get<{ value: string }>(
      "SELECT value FROM pack_meta WHERE key = 'seed_source_hash'"
    );
    needsBuild = hashRow?.value !== computeSeedSourceHash();
  }

  if (!needsBuild) return;

  if (currentVersion !== 0) {
    await dropDictionarySchema(db);
  }
  await createEmptyDictionaryPackage(db, {
    lang: 'en',
    nativeLang: 'ru',
    builtAt: new Date().toISOString(),
  });
  await seedDictionaryPackage(db);
}
