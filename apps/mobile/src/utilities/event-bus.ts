// Примитивная pub-sub по именам таблиц: пишущий код явно говорит, какие таблицы
// изменил (notifyChange), читающий — какие его касаются (subscribeToChanges).
// Никакого автоопределения затронутых таблиц по SQL — только явное указание
// обеими сторонами. SQLite остаётся единственным источником правды; это просто
// сигнал «перечитай», а не кеш и не стейт-менеджер.
interface ChangeListener {
  tables: ReadonlySet<string>;
  callback: () => void;
}

const listeners = new Set<ChangeListener>();

export function notifyChange(tables: readonly string[]): void {
  const changed = new Set(tables);
  for (const listener of listeners) {
    for (const table of listener.tables) {
      if (changed.has(table)) {
        listener.callback();
        break;
      }
    }
  }
}

export function subscribeToChanges(tables: readonly string[], callback: () => void): () => void {
  const listener: ChangeListener = { tables: new Set(tables), callback };
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
