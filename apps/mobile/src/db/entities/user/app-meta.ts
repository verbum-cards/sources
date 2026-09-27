import { uuidv7 } from '../../../utilities/id';
import type { DbExecutor } from '../../executor';
import type { AppMetaRow } from './types';

// deviceId — UUID v7, генерируется при первом запуске и хранится в app_meta.device_id
// (docs/sync-protocol.md → «Устройство»). Не аппаратный идентификатор.
export async function getOrCreateDeviceId(db: DbExecutor): Promise<string> {
  const row = await db.get<AppMetaRow>("SELECT value FROM app_meta WHERE key = 'device_id'");
  if (row?.value) {
    return row.value;
  }
  const deviceId = uuidv7();
  await db.run('INSERT INTO app_meta (key, value) VALUES (?, ?)', ['device_id', deviceId]);

  return deviceId;
}

// userId — UUID v7 локального (до входа) пользователя. Пока нет реального входа
// (F1, экран входа — заглушка), это единственный userId на устройстве.
// user_id_is_local='1' — маркер для будущей задачи «объединение аккаунтов»
// (docs/sync-protocol.md → «Объединение аккаунтов»), сейчас не читается.
export async function getOrCreateLocalUserId(db: DbExecutor): Promise<string> {
  const row = await db.get<AppMetaRow>("SELECT value FROM app_meta WHERE key = 'user_id'");
  if (row?.value) {
    return row.value;
  }
  const userId = uuidv7();
  await db.run('INSERT INTO app_meta (key, value) VALUES (?, ?)', ['user_id', userId]);
  await db.run('INSERT INTO app_meta (key, value) VALUES (?, ?)', ['user_id_is_local', '1']);

  return userId;
}
