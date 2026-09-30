import type { Deck as DeckMeta } from '@cards/contracts';

import decksData from './decks-data.json';
import { wordByLemma, type MockWord } from './words';

// Колоды под жизненные ситуации (docs/product.md, skill deck-authoring).
// Содержимое (data/decks.json — id, title, categories, context, ссылки
// {lemma, importance}) собирается и валидируется отдельным конвейером
// (apps/api/scripts/dictionary/build-decks.ts, `npm run build-decks
// --workspace=@cards/api`), который пишет decks-data.json рядом — уже
// провалидированные данные, которые бандлит Metro. Из списка 8 колод беты
// (skill deck-authoring → «Колоды беты», ADR-22 — «Такси», ADR-27 —
// «Работа») здесь семь: «Ресторан и кафе», «Отель», «Аэропорт и перелёт»,
// «Такси», «Как пройти», «Знакомство и small talk» (в скилле это одна
// колода, не две — разделять «знакомство» и «small talk» не стали, слишком
// тесно связаны), «Работа». Не хватает только «Мнение и обсуждение».
//
// categories (ADR-35, decks.screen.tsx — у каждой категории свой экран
// каталога, заменяет группировку по goalTags/Goal из ADR-24) — тема/ситуация,
// не цель изучения из онбординга; колода может быть в нескольких категориях
// сразу, если тема на стыке (такси — и транспорт, и путешествия).
export interface DeckWord extends MockWord {
  importance: 1 | 2 | 3;
}

export type MockDeck = DeckMeta & { items: readonly DeckWord[] };

interface DeckItemRef {
  lemma: string;
  importance: 1 | 2 | 3;
}

interface DeckSpec extends DeckMeta {
  items: readonly DeckItemRef[];
}

// Разворачивает ссылки {lemma, importance} в полные DeckWord — слово само по
// себе описано один раз в WORDS (mocks/words.ts), колода лишь ссылается на
// него по лемме и добавляет свой вес важности внутри этой конкретной колоды.
function resolveDeck(spec: DeckSpec): MockDeck {
  return {
    ...spec,
    items: spec.items.map((ref) => ({ ...wordByLemma(ref.lemma), importance: ref.importance })),
  };
}

// Служебная колода для проверки партий словаря (apps/api/scripts/dictionary/generate-senses.ts,
// skill dictionary-pipeline) — не для пользователей беты, только чтобы
// владелец продукта мог открыть только что сгенерированные слова на телефоне
// и проверить их, прежде чем разложить по настоящим колодам или отбраковать.
// categories пустой — не категория, decks.screen.tsx показывает её отдельной
// строкой вне каталога категорий, только пока в ней есть слова.
// generate-senses.ts сам дописывает сюда лемму каждого успешно
// сгенерированного слова прямо в data/decks.json (build-decks.ts::buildDecksData)
// — руками список не редактируется, кроме удаления уже проверенных слов.
export const REVIEW_DECK_ID = '0195d000-0000-7000-8000-000000000009';

export const DECKS: readonly MockDeck[] = (decksData as readonly DeckSpec[]).map(resolveDeck);
