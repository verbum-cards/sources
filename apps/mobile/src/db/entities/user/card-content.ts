import type { DbExecutor } from '../../executor';

// Общая точка записи card_content_example (миграция 006) — несколько мест
// создают card_content с нуля (decks-logic.ts, user-deck-logic.ts,
// onboarding-logic.ts, fsrs-debug.screen.tsx), каждое своим INSERT в card, и
// всем им теперь нужно записать и примеры тем же способом, а не по-своему.
export interface CardContentExampleInput {
  text: string;
  translation: string;
}

export async function insertCardContentExamples(
  db: DbExecutor,
  cardId: string,
  examples: readonly CardContentExampleInput[]
): Promise<void> {
  for (const [position, example] of examples.entries()) {
    await db.run(
      `INSERT INTO card_content_example (card_id, position, text, translation) VALUES (?, ?, ?, ?)`,
      [cardId, position, example.text, example.translation]
    );
  }
}

// Примеры сразу нескольких карточек одним запросом (списки слов колоды,
// очередь сессии) — вместо запроса на каждую карточку по отдельности.
export async function loadCardContentExamplesByCardIds(
  db: DbExecutor,
  cardIds: readonly string[]
): Promise<Map<string, CardContentExampleInput[]>> {
  const byCard = new Map<string, CardContentExampleInput[]>();
  if (cardIds.length === 0) return byCard;

  const placeholders = cardIds.map(() => '?').join(', ');
  const rows = await db.all<{ card_id: string; text: string; translation: string }>(
    `SELECT card_id, text, translation FROM card_content_example
     WHERE card_id IN (${placeholders})
     ORDER BY card_id, position`,
    [...cardIds]
  );

  for (const row of rows) {
    const list = byCard.get(row.card_id) ?? [];
    list.push({ text: row.text, translation: row.translation });
    byCard.set(row.card_id, list);
  }

  return byCard;
}

export async function loadCardContentExamples(
  db: DbExecutor,
  cardId: string
): Promise<CardContentExampleInput[]> {
  return (await loadCardContentExamplesByCardIds(db, [cardId])).get(cardId) ?? [];
}
