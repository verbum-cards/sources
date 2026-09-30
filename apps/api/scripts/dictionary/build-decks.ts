import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { z } from 'zod';

import {
  DeckCategorySchema,
  DeckContextSchema,
  DeckTypeSchema,
  LangSchema,
} from '@cards/contracts';

// Куратор колод (skill deck-authoring) правит файлы в data/decks/ — один
// json на тему (data/decks/firstSteps-deck.json, дальше — по категории или
// как удобно; деку с несколькими categories можно держать в любом из них,
// имя файла ни на что не влияет, это просто способ куратору не открывать
// один гигантский файл на все колоды сразу). Колода тут описывается
// ссылками на леммы ({lemma, importance}), а не готовыми DeckWord — сама
// лемма разворачивается в полное слово на стороне mobile (wordByLemma,
// mocks/decks.ts).
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
  // Порядок показа колоды внутри категории (та же шкала, что у importance
  // слова в items) — decks.screen.tsx::CategoryDetail сортирует по убыванию.
  importance: z.literal([1, 2, 3]),
  items: z.array(DeckItemRefSchema),
});
export type DeckSpec = z.infer<typeof DeckSpecSchema>;

export interface BuildDecksResult {
  decks: readonly DeckSpec[];
  decksDir: string;
  outPath: string;
}

// Порт apps/mobile/src/utilities/id.ts::uuidv7 (та же копия уже в
// generate-senses.ts) — этот скрипт выполняется через Node, не через
// мобильное приложение, общих небиблиотечных утилит между apps/mobile и
// apps/api сейчас нет.
function uuidv7(): string {
  const timestamp = BigInt(Date.now());
  const bytes = new Uint8Array(16);
  for (let i = 5; i >= 0; i--) {
    bytes[i] = Number((timestamp >> BigInt((5 - i) * 8)) & 0xffn);
  }
  for (let i = 6; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Куратор оставляет "id": "" на новой колоде — генерируем один раз и
// сохраняем обратно в исходный файл: id должен быть стабильным между
// сборками (на него будут ссылаться user_deck после того, как колоду
// добавят), а не пересоздаваться каждый npm run build-decks.
// "context": {situation: "", roles: {}, ...} — заготовка из шаблона для
// колод, где реального диалогового сценария нет (тематические колоды вроде
// «Цвета и оттенки», в отличие от «Ресторан», где FR-49 требует context) —
// считаем такую заготовку отсутствием context, а не пытаемся провалидировать
// пустые roles/register.
function normalizeEntry(entry: Record<string, unknown>): boolean {
  let changed = false;
  if (entry.id === '') {
    entry.id = uuidv7();
    changed = true;
  }
  const context = entry.context as { situation?: unknown } | undefined;
  if (context && context.situation === '') {
    delete entry.context;
    changed = true;
  }

  return changed;
}

// Собирает apps/mobile/src/mocks/decks-data.json из всех data/decks/*.json:
// проверяет схему, уникальность id по всем файлам сразу и что каждая lemma в
// items реально есть в WORDS (words-data.json) — слово может быть в
// нескольких колодах сразу, это не ошибка. apps/mobile не может
// импортировать data/ напрямую (Metro резолвит только внутри своего root) —
// decks-data.json лежит внутри apps/mobile и уже провалидирован, decks.ts
// его просто импортирует и резолвит леммы.
export function buildDecksData(): BuildDecksResult {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = join(scriptDir, '..', '..', '..', '..');
  const decksDir = join(repoRoot, 'data', 'decks');
  const wordsDataPath = join(repoRoot, 'apps', 'mobile', 'src', 'mocks', 'words-data.json');
  const outPath = join(repoRoot, 'apps', 'mobile', 'src', 'mocks', 'decks-data.json');

  const fileNames = readdirSync(decksDir)
    .filter((name) => name.endsWith('.json'))
    .sort();

  const decks: DeckSpec[] = [];
  for (const fileName of fileNames) {
    const filePath = join(decksDir, fileName);
    const rawEntries = JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>[];

    let fileChanged = false;
    for (const entry of rawEntries) {
      fileChanged = normalizeEntry(entry) || fileChanged;
    }
    if (fileChanged) {
      writeFileSync(filePath, `${JSON.stringify(rawEntries, null, 2)}\n`, 'utf8');
    }

    rawEntries.forEach((entry, index) => {
      try {
        decks.push(DeckSpecSchema.parse(entry));
      } catch (error) {
        throw new Error(
          `data/decks/${fileName}[${index}]: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error }
        );
      }
    });
  }

  const seenIds = new Map<string, string>();
  for (const deck of decks) {
    const owner = seenIds.get(deck.id);
    if (owner) {
      throw new Error(`data/decks/: дублирующийся id "${deck.id}" ("${owner}" и "${deck.title}")`);
    }
    seenIds.set(deck.id, deck.title);
  }

  // readFileSync, не import() — words-data.json уже чистые данные, обходить
  // ESM-кеш модулей (актуально, когда buildDecksData() вызывают сразу после
  // записи в этот же файл в том же процессе, см. generate-senses.ts) не нужно.
  const words = JSON.parse(readFileSync(wordsDataPath, 'utf8')) as {
    lemma: string;
    itemId: string;
  }[];
  const itemIdByLemma = new Map(words.map((word) => [word.lemma, word.itemId]));

  // Слово может быть в нескольких колодах сразу (например, "hospital" — и в
  // «Места в городе», и в «Скорая помощь») — единственное реальное
  // требование к items: лемма должна существовать в WORDS. Кросс-колодную
  // уникальность itemId раньше проверяли здесь же, но это было временное
  // ограничение первых колод, не правило продукта.
  const missingLemmas: string[] = [];
  for (const deck of decks) {
    const seenInDeck = new Set<string>();
    for (const item of deck.items) {
      if (!itemIdByLemma.has(item.lemma)) {
        missingLemmas.push(`"${item.lemma}" (колода "${deck.title}")`);
      }
      if (seenInDeck.has(item.lemma)) {
        throw new Error(
          `data/decks/: слово "${item.lemma}" повторяется внутри колоды "${deck.title}"`
        );
      }
      seenInDeck.add(item.lemma);
    }
  }
  if (missingLemmas.length > 0) {
    throw new Error(`data/decks/: леммы не найдены в WORDS:\n  ${missingLemmas.join('\n  ')}`);
  }

  writeFileSync(outPath, `${JSON.stringify(decks, null, 2)}\n`, 'utf8');

  return { decks, decksDir, outPath };
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
