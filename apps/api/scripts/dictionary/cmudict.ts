import { arpabetToIpa } from './arpabet-ipa';

const CMUDICT_URL = 'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict';

// cmudict.dict — «word PH ON EM ES» построчно, по слову на первое (основное)
// произношение; варианты — отдельной строкой с суффиксом "(2)", "(3)" и т.п.
// у слова ("a(2) EY1"), их пропускаем — модели не нужно больше одного IPA на
// лемму (то же ограничение, что и в остальной модели словаря: card_content.ipa
// — одна строка, не массив).
export async function fetchCmudict(): Promise<Map<string, readonly string[]>> {
  const response = await fetch(CMUDICT_URL);
  if (!response.ok) {
    throw new Error(`${CMUDICT_URL}: HTTP ${response.status}`);
  }
  const text = await response.text();

  const byWord = new Map<string, readonly string[]>();
  for (const line of text.split('\n')) {
    if (!line.trim() || line.startsWith(';;;')) continue;
    const [word, ...phonemes] = line.trim().split(/\s+/);
    if (word.includes('(')) continue; // вариант произношения — не первый
    byWord.set(word, phonemes);
  }

  return byWord;
}

// Лемма нашего seed-списка может быть фразой («to pay by card», «Nice to
// meet you») — CMUdict знает только отдельные слова. Собираем IPA по словам
// через пробел; если хотя бы одного слова нет в словаре — undefined целиком,
// а не транскрипция с дырой (лучше отсутствие данных, чем частично неверные).
export function lookupIpa(
  lemma: string,
  cmudict: ReadonlyMap<string, readonly string[]>
): string | undefined {
  const tokens = lemma
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/^[^a-z']+|[^a-z']+$/g, ''))
    .filter(Boolean);
  if (tokens.length === 0) return undefined;

  const ipas: string[] = [];
  for (const token of tokens) {
    const phonemes = cmudict.get(token);
    if (!phonemes) return undefined;
    ipas.push(arpabetToIpa(phonemes));
  }

  return ipas.join(' ');
}
