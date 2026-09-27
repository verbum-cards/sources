// Минимальный CSV-парсер/сериализатор (RFC4180: кавычки, экранирование "").
// Без внешней зависимости — формат простой, а конвейеру нужен полный контроль
// над квотированием (в примерах и переводах бывают запятые и кавычки).

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const normalized = text.replace(/\r\n/g, '\n');
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  // Последняя строка без завершающего \n.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

export function parseCsvWithHeader(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  const [header, ...rest] = rows;
  if (!header) return [];
  return rest.map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((key, i) => {
      obj[key] = r[i] ?? '';
    });
    return obj;
  });
}

function escapeField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(header: string[], rows: (string | number | boolean)[][]): string {
  const lines = [header.map((h) => escapeField(String(h))).join(',')];
  for (const row of rows) {
    lines.push(row.map((v) => escapeField(String(v))).join(','));
  }
  return lines.join('\n') + '\n';
}
