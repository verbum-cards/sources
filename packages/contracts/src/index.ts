// Общие типы для mobile, api, web и backoffice.
// Источник правды по смыслу — docs/data-model.md и docs/sync-protocol.md.
// Каждый экспортируемый тип — это Zod-схема (`XSchema`) + выведенный тип (`X`),
// так что контракты одновременно валидируют данные в рантайме и типизируют их.
export * from './content';
export * from './decks';
export * from './user';
export * from './sync';
export * from './dictionary';
