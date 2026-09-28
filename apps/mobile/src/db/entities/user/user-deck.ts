import type { UserDeckStored } from '@cards/contracts';

import { notifyChange } from '../../../utilities/event-bus';
import type { DbExecutor } from '../../executor';
import { userDeckToRow } from './mappers';

// Id колод, которые пользователь уже добавил (живых, deleted_at IS NULL) —
// для каталога (screens/decks): пометить «уже добавлена» и не звать
// addUserDeck повторно без необходимости.
export async function loadUserDeckIds(db: DbExecutor, userId: string): Promise<Set<string>> {
  const rows = await db.all<{ deck_id: string }>(
    'SELECT deck_id FROM user_deck WHERE user_id = ? AND deleted_at IS NULL',
    [userId]
  );

  return new Set(rows.map((row) => row.deck_id));
}

// Апсерт по (user_id, deck_id) — deckId не меняется и «воскресает» через
// upsert с deletedAt = null (packages/contracts/src/user.ts, комментарий у
// UserDeckSchema), а не отдельной операцией восстановления.
export async function saveUserDeck(db: DbExecutor, deck: UserDeckStored): Promise<void> {
  const row = userDeckToRow(deck);
  await db.run(
    `INSERT INTO user_deck (user_id, deck_id, added_at, fast_mode, updated_at, deleted_at, field_meta)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id, deck_id) DO UPDATE SET
       added_at = excluded.added_at,
       fast_mode = excluded.fast_mode,
       updated_at = excluded.updated_at,
       deleted_at = excluded.deleted_at,
       field_meta = excluded.field_meta`,
    [
      row.user_id,
      row.deck_id,
      row.added_at,
      row.fast_mode,
      row.updated_at,
      row.deleted_at,
      row.field_meta,
    ]
  );
  notifyChange(['user_deck']);
}
