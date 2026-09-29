// UK и US транскрипция — open-dict-data/ipa-dict (MIT), уже готовый IPA, не
// ARPAbet: не нужна собственная таблица конвертации (как для CMUdict —
// решение отменено, см. docs/decisions.md ADR-34) и меньше риска ошибиться в
// расстановке ударения. Раньше использовался CMUdict + своя конвертация — но
// он был только про американское произношение, а нам нужны оба варианта, и
// ready-made словарь заодно точнее (ударение перед слогом, не перед гласной).
const IPA_DICT_URLS = {
  us: 'https://raw.githubusercontent.com/open-dict-data/ipa-dict/master/data/en_US.txt',
  uk: 'https://raw.githubusercontent.com/open-dict-data/ipa-dict/master/data/en_UK.txt',
} as const;

export type IpaVariant = keyof typeof IPA_DICT_URLS;

// Одна строка файла — «word\t/ipa1/, /ipa2/» (вариантов может быть несколько,
// через ", "; берём первый — тот же принцип, что и раньше с (2)-вариантами
// CMUdict: одна транскрипция на слово, не массив, под текущую модель словаря
// (card_content.ipa/lexeme.ipa — одна строка). Отдельная чистая функция —
// чтобы разбор строки был тестируемым без сети, fetchIpaDict ниже её просто
// вызывает построчно.
export function parseIpaDictLine(line: string): [word: string, ipa: string] | null {
  if (!line.trim()) return null;
  const [word, rawIpa] = line.split('\t');
  if (!word || !rawIpa) return null;

  const firstVariant = rawIpa.split(',')[0].trim();
  const ipa = firstVariant.replace(/^\/|\/$/g, '');

  return [word, ipa];
}

export async function fetchIpaDict(variant: IpaVariant): Promise<Map<string, string>> {
  const response = await fetch(IPA_DICT_URLS[variant]);
  if (!response.ok) {
    throw new Error(`${IPA_DICT_URLS[variant]}: HTTP ${response.status}`);
  }
  const text = await response.text();

  const byWord = new Map<string, string>();
  for (const line of text.split('\n')) {
    const parsed = parseIpaDictLine(line);
    if (parsed) byWord.set(parsed[0], parsed[1]);
  }

  return byWord;
}

// Лемма нашего seed-списка может быть фразой («credit card», «good morning»)
// — ipa-dict знает только отдельные слова. Собираем IPA по словам через
// пробел; если хотя бы одного слова нет в словаре — undefined целиком, а не
// транскрипция с дырой (лучше отсутствие данных, чем частично неверные).
export function lookupPhraseIpa(
  lemma: string,
  dict: ReadonlyMap<string, string>
): string | undefined {
  const tokens = lemma
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/^[^a-z']+|[^a-z']+$/g, ''))
    .filter(Boolean);
  if (tokens.length === 0) return undefined;

  const ipas: string[] = [];
  for (const token of tokens) {
    const ipa = dict.get(token);
    if (!ipa) return undefined;
    ipas.push(ipa);
  }

  return ipas.join(' ');
}
