import type { DbExecutor } from '../../db/executor';
import { DECKS } from '../../mocks/decks';
import { isDeckWordAdded, loadAddedDeckItemIds } from '../decks/decks-logic';

export interface DeckProgress {
  deckId: string;
  title: string;
  added: number;
  total: number;
}

// Только колоды, к которым пользователь реально притронулся (added > 0) —
// «0 из 13» по нетронутой колоде не сигнал, а шум (тот же принцип, что и у
// пустого состояния на Home). added считается по тому же критерию, что и
// иконка добавления в decks.screen.tsx, а не по user_deck: слова можно
// добавлять по одному, без «Добавить колоду».
export async function loadDeckProgress(db: DbExecutor): Promise<readonly DeckProgress[]> {
  const addedItemIds = await loadAddedDeckItemIds(db);

  return DECKS.map((deck) => ({
    deckId: deck.id,
    title: deck.title,
    added: deck.items.filter((word) => isDeckWordAdded(addedItemIds, word)).length,
    total: deck.items.length,
  })).filter((progress) => progress.added > 0);
}

export const ACTIVITY_DAYS = 7;

export interface DayActivity {
  date: string; // toDateString() — местная дата, тот же формат, что и в computeStreakDays
  count: number;
}

// Последние ACTIVITY_DAYS календарных дней (сегодня включительно), по
// местному времени — тот же приём, что и computeStreakDays/
// countCardsCreatedToday в home-logic.ts (toDateString, не UTC).
export function computeDailyActivity(
  createdAtList: readonly string[],
  now: Date = new Date(),
  days: number = ACTIVITY_DAYS
): readonly DayActivity[] {
  const counts = new Map<string, number>();
  for (const iso of createdAtList) {
    const key = new Date(iso).toDateString();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const result: DayActivity[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const key = day.toDateString();
    result.push({ date: key, count: counts.get(key) ?? 0 });
  }

  return result;
}
