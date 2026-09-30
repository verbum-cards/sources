import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { z } from 'zod';

import {
  DeckCategorySchema,
  DeckContextSchema,
  DeckTypeSchema,
  LangSchema,
} from '@cards/contracts';

// Куратор колод (skill deck-authoring) правит data/decks.json — не
// apps/mobile/src/mocks/decks.ts напрямую: колода тут описывается ссылками
// на леммы ({lemma, importance}), а не готовыми DeckWord — сама лемма
// разворачивается в полное слово на стороне mobile (wordByLemma,
// mocks/decks.ts), тем же приёмом, что уже был раньше, просто источник
// ссылок теперь данные, а не литералы в коде.
const DeckItemRefSchema = z.object({
  lemma: z.string().min(1),
  importance: z.literal([1, 2, 3]),
});

export const DeckSpecSchema = z.object({
  id: z.uuid(),
  lang: LangSchema,
  nativeLang: LangSchema,
  title: z.string().min(1),
  categories: z.array(DeckCategorySchema),
  type: DeckTypeSchema,
  context: DeckContextSchema.optional(),
  items: z.array(DeckItemRefSchema),
});
export type DeckSpec = z.infer<typeof DeckSpecSchema>;

export interface BuildDecksResult {
  decks: readonly DeckSpec[];
  specPath: string;
  outPath: string;
}

// Собирает apps/mobile/src/mocks/decks-data.json из data/decks.json:
// проверяет схему, уникальность id, что каждая lemma в items реально есть в
// WORDS (words-data.json) и что itemId (лемма → слово в WORDS) не повторяется
// между колодами (тот же инвариант, что и decks-logic.test.ts «защита от
// копипасты вручную», но здесь — быстрая проверка до запуска тестов).
// apps/mobile не может импортировать data/ напрямую (Metro резолвит только
// внутри своего root) — decks-data.json лежит внутри apps/mobile и уже
// провалидирован, decks.ts его просто импортирует и резолвит леммы.
export function buildDecksData(): BuildDecksResult {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = join(scriptDir, '..', '..', '..', '..');
  const specPath = join(repoRoot, 'data', 'decks.json');
  const wordsDataPath = join(repoRoot, 'apps', 'mobile', 'src', 'mocks', 'words-data.json');
  const outPath = join(repoRoot, 'apps', 'mobile', 'src', 'mocks', 'decks-data.json');

  const raw = JSON.parse(readFileSync(specPath, 'utf8')) as unknown[];
  const decks = raw.map((entry, index) => {
    try {
      return DeckSpecSchema.parse(entry);
    } catch (error) {
      throw new Error(
        `data/decks.json[${index}]: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }
  });

  const seenIds = new Set<string>();
  for (const deck of decks) {
    if (seenIds.has(deck.id)) {
      throw new Error(`data/decks.json: дублирующийся id "${deck.id}" (колода "${deck.title}")`);
    }
    seenIds.add(deck.id);
  }

  // readFileSync, не import() — words-data.json уже чистые данные, обходить
  // ESM-кеш модулей (актуально, когда buildDecksData() вызывают сразу после
  // записи в этот же файл в том же процессе, см. generate-senses.ts) не нужно.
  const words = JSON.parse(readFileSync(wordsDataPath, 'utf8')) as {
    lemma: string;
    itemId: string;
  }[];
  const itemIdByLemma = new Map(words.map((word) => [word.lemma, word.itemId]));

  const missingLemmas: string[] = [];
  const seenItemIds = new Map<string, string>();
  for (const deck of decks) {
    for (const item of deck.items) {
      const itemId = itemIdByLemma.get(item.lemma);
      if (!itemId) {
        missingLemmas.push(`"${item.lemma}" (колода "${deck.title}")`);
        continue;
      }
      const owner = seenItemIds.get(itemId);
      if (owner) {
        throw new Error(
          `data/decks.json: слово "${item.lemma}" уже есть в колоде "${owner}" — itemId должен быть уникален по всем колодам ("${deck.title}")`
        );
      }
      seenItemIds.set(itemId, deck.title);
    }
  }
  if (missingLemmas.length > 0) {
    throw new Error(`data/decks.json: леммы не найдены в WORDS:\n  ${missingLemmas.join('\n  ')}`);
  }

  writeFileSync(outPath, `${JSON.stringify(decks, null, 2)}\n`, 'utf8');

  return { decks, specPath, outPath };
}

function main(): void {
  const { decks, outPath } = buildDecksData();
  const itemCount = decks.reduce((sum, deck) => sum + deck.items.length, 0);
  console.log(`${outPath}: ${decks.length} колод, ${itemCount} слов.`);
}

// generate-senses.ts переиспользует buildDecksData() как библиотеку — сам
// main() запускается, только когда файл выполняется напрямую (npm run
// build-decks), не при импорте функции.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
