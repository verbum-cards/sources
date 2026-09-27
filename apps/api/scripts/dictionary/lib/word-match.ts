// Проверка «изучаемое слово (или его форма) есть в примере» — правило валидации
// из .claude/skills/dictionary-pipeline/SKILL.md. Эвристика по частым суффиксам,
// без словаря неправильных форм: то, что не совпало (irregular verbs и т.п.),
// уходит в rejected с понятной причиной — это ожидаемо для пилота, не ошибка кода.
const SUFFIXES = ['ies', 'ied', 'es', 'ing', 'ed', 's', 'd'] as const;

function matchesInflection(token: string, lemma: string): boolean {
  if (token === lemma) return true;
  for (const suf of SUFFIXES) {
    if (!token.endsWith(suf)) continue;
    const stem = token.slice(0, -suf.length);
    if (stem === lemma) return true;
    // studies -> study, tried -> try
    if ((suf === 'ies' || suf === 'ied') && `${stem}y` === lemma) return true;
    // stopping -> stop, stopped -> stop (удвоенная согласная)
    if (
      (suf === 'ing' || suf === 'ed') &&
      stem.length > 1 &&
      stem[stem.length - 1] === stem[stem.length - 2] &&
      stem.slice(0, -1) === lemma
    ) {
      return true;
    }
  }
  return false;
}

// Многословную лемму (напр. "give up") ищем как точную подстроку без учёта регистра.
export function findHighlight(text: string, lemma: string): [number, number] | null {
  const lemmaLower = lemma.trim().toLowerCase();
  if (lemmaLower.includes(' ')) {
    const idx = text.toLowerCase().indexOf(lemmaLower);
    return idx === -1 ? null : [idx, idx + lemmaLower.length];
  }
  const tokenRegex = /[A-Za-z']+/g;
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(text))) {
    const token = match[0].toLowerCase();
    if (matchesInflection(token, lemmaLower)) {
      return [match.index, match.index + match[0].length];
    }
  }
  return null;
}
