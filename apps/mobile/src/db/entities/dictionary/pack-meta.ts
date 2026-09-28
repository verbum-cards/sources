import type { DbExecutor } from '../../executor';

// Дебаг-чтение pack_meta целиком — проверить вживую, что пакет словаря на
// устройстве реально собран и засеян (см. home.screen.tsx, временная строка
// рядом с «Сбросить локальные данные»), а не гадать по одним только тестам.
export async function loadDictionaryPackMeta(db: DbExecutor): Promise<Record<string, string>> {
  const rows = await db.all<{ key: string; value: string }>('SELECT key, value FROM pack_meta');

  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}
