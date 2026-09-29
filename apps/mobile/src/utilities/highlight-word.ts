export interface HighlightedText {
  before: string;
  match: string;
  after: string;
}

// F6, шаг «Превью»: выделение слова в примере — приблизительное (первое
// вхождение без учёта регистра), а не по точным индексам: card_content не
// хранит координаты подсветки (миграция 006 убрала неиспользовавшуюся
// example_highlight), подсветка всегда считается на клиенте. match === '' ->
// слово не встретилось в примере дословно, весь текст уходит в before без
// выделения.
export function splitAroundWord(text: string, word: string): HighlightedText {
  const index = text.toLowerCase().indexOf(word.toLowerCase());
  if (index === -1) {
    return { before: text, match: '', after: '' };
  }

  return {
    before: text.slice(0, index),
    match: text.slice(index, index + word.length),
    after: text.slice(index + word.length),
  };
}
