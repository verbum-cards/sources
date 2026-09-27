import type { Goal, UserLevel, UserProfileStored } from '@cards/contracts';

import { getOrCreateLocalUserId } from '../db/entities/user/app-meta';
import { getUserProfile, saveUserProfile } from '../db/entities/user/user-profile';
import type { DbExecutor } from '../db/executor';
import { mapDailyMinutesToNewPerDay } from './onboarding/onboarding-logic';

// Экран «Профиль»: те же поля, что собраны в F1 (level/goals/dailyMinutes),
// редактируются напрямую и сохраняются сразу — тем же saveUserProfile, что и
// в конце онбординга (апсерт всей строки). Здесь просто читаем текущий
// профиль и меняем одно поле за раз, не трогая остальные.

export async function loadCurrentUserProfile(
  db: DbExecutor
): Promise<UserProfileStored | undefined> {
  const userId = await getOrCreateLocalUserId(db);

  return getUserProfile(db, userId);
}

async function patchUserProfile(
  db: DbExecutor,
  patch: Partial<
    Pick<UserProfileStored, 'name' | 'level' | 'goals' | 'dailyMinutes' | 'newPerDay'>
  >,
  now: Date
): Promise<void> {
  const userId = await getOrCreateLocalUserId(db);
  const current = await getUserProfile(db, userId);
  if (!current) {
    // Экран «Профиль» доступен только после онбординга (F1, см. App.tsx ->
    // AppContent): user_profile обязана уже существовать. Если её нет — это
    // ошибка вызывающего кода, а не ожидаемая ветка UI.
    throw new Error('patchUserProfile: user_profile not found — onboarding not completed yet');
  }

  await saveUserProfile(db, { ...current, ...patch, updatedAt: now.toISOString() });
}

// Пустая строка сохраняется как null (не как ''), чтобы «стёр имя» и «имя
// никогда не вводили» выглядели одинаково в БД.
export async function updateProfileName(
  db: DbExecutor,
  name: string,
  now: Date = new Date()
): Promise<void> {
  const trimmed = name.trim();
  await patchUserProfile(db, { name: trimmed || null }, now);
}

export async function updateProfileLevel(
  db: DbExecutor,
  level: UserLevel,
  now: Date = new Date()
): Promise<void> {
  await patchUserProfile(db, { level }, now);
}

export async function updateProfileGoals(
  db: DbExecutor,
  goals: Goal[],
  now: Date = new Date()
): Promise<void> {
  await patchUserProfile(db, { goals }, now);
}

// daily_minutes и new_per_day меняются вместе (skill fsrs-scheduler: new_per_day
// — то же значение, что и dailyMinutes) — так же, как при первом сохранении в
// конце онбординга (onboarding-logic.ts::buildUserProfileDraft).
export async function updateProfileDailyMinutes(
  db: DbExecutor,
  dailyMinutes: 5 | 10 | 15,
  now: Date = new Date()
): Promise<void> {
  await patchUserProfile(
    db,
    { dailyMinutes, newPerDay: mapDailyMinutesToNewPerDay(dailyMinutes) },
    now
  );
}
