import type { Migration } from '../migrate';

// Миграция 004 — карточка обучения по тапу на слово (word-study-card.tsx):
// определение слова на целевом языке (для sense) или пояснение, когда
// применяется фраза (для expression) — оба на английском, это данные словаря,
// не строка интерфейса. Простой ALTER TABLE ADD COLUMN, как 003 —
// disableForeignKeys не нужен. Существующие карточки получат definition =
// NULL — ожидаемое значение для карточек, добавленных руками (там определения
// просто неоткуда взять).
export const m004: Migration = {
  version: 4,
  statements: [`ALTER TABLE card_content ADD COLUMN definition TEXT`],
};
