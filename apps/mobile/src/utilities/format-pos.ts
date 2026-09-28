// Часть речи хранится в словарных данных как английское слово ('noun',
// 'verb', ...) — не текст интерфейса, через i18n не идёт (skill i18n-russian:
// «слова, примеры и транскрипции из словаря не переводятся через i18n — это
// данные») и не переводится/сокращается: показывается как есть.
export function formatPos(pos: string | undefined | null): string | undefined {
  return pos || undefined;
}
