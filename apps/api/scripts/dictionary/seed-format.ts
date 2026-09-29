import type { Cefr } from '@cards/contracts';

// Формат data/cefr_seed.csv (skill dictionary-pipeline, этап 1 «Исходный
// список»). Колонки — lemma (не headword, как в исходном тексте скилла: имя
// приведено к тому же полю, что уже используют apps/mobile/src/mocks/words.ts
// и остальная модель словаря, чтобы дальше по конвейеру не маппить одно в
// другое), pos, ipa, cefr, source, license.
export interface SeedWord {
  lemma: string;
  pos: string;
  // undefined — не нашлось в CMUdict (слово отсутствует или это фраза, где
  // хотя бы одно слово не нашлось, см. cmudict.ts::lookupIpa), а не «ещё не
  // считали»: build-seed.ts заполняет это поле для каждого слова один раз.
  ipa: string | undefined;
  cefr: Cefr;
  source: 'cefr-j' | 'octanove';
  license: string;
}

const CSV_HEADER = 'lemma,pos,ipa,cefr,source,license';

// Экранирование по RFC 4180 — поле в кавычках, если содержит запятую,
// кавычку или перенос строки; кавычка внутри удваивается.
function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function formatSeedCsv(words: readonly SeedWord[]): string {
  const lines = words.map((word) =>
    [word.lemma, word.pos, word.ipa ?? '', word.cefr, word.source, word.license]
      .map(escapeCsvField)
      .join(',')
  );

  return `${[CSV_HEADER, ...lines].join('\n')}\n`;
}

// Разбор одной строки CSV с учётом кавычек (простой ручной парсер — источники
// здесь без вложенных кавычек и многострочных полей, но поле в кавычках с
// запятой внутри встречаться может, split(',') его бы сломал). Экспортирован —
// build-seed.ts им же читает CSV источников (headword,pos,CEFR,...), не только
// свой формат ниже.
export function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);

  return fields;
}

function isKnownSource(value: string): value is SeedWord['source'] {
  return value === 'cefr-j' || value === 'octanove';
}

export function parseSeedCsv(csv: string): SeedWord[] {
  const lines = csv.split('\n').filter((line) => line.trim().length > 0);
  const [header, ...rows] = lines;
  if (header !== CSV_HEADER) {
    throw new Error(`parseSeedCsv: неожиданный заголовок "${header}", ожидался "${CSV_HEADER}"`);
  }

  return rows.map((line, index) => {
    const [lemma, pos, ipa, cefr, source, license] = splitCsvLine(line);
    if (!isKnownSource(source)) {
      throw new Error(`parseSeedCsv: неизвестный source "${source}" в строке ${index + 2}`);
    }

    return { lemma, pos, ipa: ipa || undefined, cefr: cefr as Cefr, source, license };
  });
}
