import { notifyChange } from '../../../utilities/event-bus';
import type { DbExecutor } from '../../executor';

// Порядок важен только по смыслу (детские таблицы перед родителями), не из-за
// FK-ограничений: card_content/card_schedule каскадируются от card, review_log
// и sync_op вообще не связаны FK с card (см. миграции). Явные DELETE по каждой
// таблице надёжны независимо от того, включён ли PRAGMA foreign_keys.
const TABLES_TO_CLEAR = [
  'card_content',
  'card_schedule',
  'review_log',
  'card',
  'user_deck',
  'user_profile',
  'sync_op',
] as const;

// Полный сброс локальных пользовательских данных — имитация чистой установки
// для ручного тестирования онбординга (F1), а не продуктовая функция (кнопка
// на главном экране без подтверждения — это дебаг-инструмент).
//
// app_meta.device_id НЕ трогаем: он обязан быть стабилен в пределах установки
// (docs/sync-protocol.md → «Устройство»). app_meta.user_id и
// user_id_is_local удаляются — getOrCreateLocalUserId сгенерирует новый userId
// при следующем обращении, как при первом запуске.
export async function resetLocalData(db: DbExecutor): Promise<void> {
  for (const table of TABLES_TO_CLEAR) {
    await db.execRaw(`DELETE FROM ${table}`);
  }
  await db.execRaw("DELETE FROM app_meta WHERE key IN ('user_id', 'user_id_is_local')");

  // Реактивные useQuery (проверка «онбординг пройден» в App.tsx, счётчик
  // карточек на главном экране и т.д.) сами перечитают данные без ручного
  // перезапуска приложения.
  notifyChange([...TABLES_TO_CLEAR, 'app_meta']);
}
