import type { UserProfileStored } from '@cards/contracts';

import { notifyChange } from '../../../utilities/event-bus';
import type { DbExecutor } from '../../executor';
import { getOrCreateLocalUserId } from './app-meta';
import { rowToUserProfile, userProfileToRow } from './mappers';
import type { UserProfileRow } from './types';

export async function getUserProfile(
  db: DbExecutor,
  userId: string
): Promise<UserProfileStored | undefined> {
  const row = await db.get<UserProfileRow>('SELECT * FROM user_profile WHERE user_id = ?', [
    userId,
  ]);

  return row ? rowToUserProfile(row) : undefined;
}

export async function hasUserProfile(db: DbExecutor, userId: string): Promise<boolean> {
  const row = await db.get<{ user_id: string }>(
    'SELECT user_id FROM user_profile WHERE user_id = ?',
    [userId]
  );

  return row !== undefined;
}

// Признак «онбординг пройден» (F1) — есть ли строка user_profile для текущего
// локального userId. Никакого отдельного флага в app_meta — один источник истины.
export async function hasCompletedOnboarding(db: DbExecutor): Promise<boolean> {
  const userId = await getOrCreateLocalUserId(db);

  return hasUserProfile(db, userId);
}

// Апсерт всей строки user_profile: F1 сохраняет профиль один раз, в конце
// онбординга (см. src/screens/onboarding/onboarding.screen.tsx) — данные,
// собранные на шагах «Цель», «Уровень», «Время в день», пишутся разом.
export async function saveUserProfile(db: DbExecutor, profile: UserProfileStored): Promise<void> {
  const row = userProfileToRow(profile);
  await db.run(
    `INSERT INTO user_profile (user_id, name, native_lang, target_lang, level, goals, daily_minutes, new_per_day, waitlist_langs, updated_at, field_meta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET
       name = excluded.name,
       native_lang = excluded.native_lang,
       target_lang = excluded.target_lang,
       level = excluded.level,
       goals = excluded.goals,
       daily_minutes = excluded.daily_minutes,
       new_per_day = excluded.new_per_day,
       waitlist_langs = excluded.waitlist_langs,
       updated_at = excluded.updated_at,
       field_meta = excluded.field_meta`,
    [
      row.user_id,
      row.name,
      row.native_lang,
      row.target_lang,
      row.level,
      row.goals,
      row.daily_minutes,
      row.new_per_day,
      row.waitlist_langs,
      row.updated_at,
      row.field_meta,
    ]
  );
  notifyChange(['user_profile']);
}
