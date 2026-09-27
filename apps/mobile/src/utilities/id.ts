// Идентификаторы пользовательских записей создаёт клиент (UUID v7, монотонны по
// времени — см. docs/data-model.md, docs/sync-protocol.md). Чистая JS-реализация,
// без нативных модулей: случайность — Math.random(), этого достаточно для
// уникальности внутри устройства; при появлении реального бэкенда стоит сверить,
// не нужен ли CSPRNG (expo-crypto) для этого места.
export function uuidv7(date: Date = new Date()): string {
  const timestamp = BigInt(date.getTime());
  const bytes = new Uint8Array(16);

  // 48-битная метка времени (мс), big-endian — байты 0..5.
  for (let i = 5; i >= 0; i--) {
    bytes[i] = Number((timestamp >> BigInt((5 - i) * 8)) & 0xffn);
  }

  for (let i = 6; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x70; // версия 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // вариант RFC 4122

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
