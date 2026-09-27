import type { DbExecutor } from './executor';
import { uuidv7 } from './id';
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
