import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribeToChanges } from '../utilities/event-bus';
import type { DbExecutor } from '../db/executor';
import { useDb } from '../providers/db.provider';

export interface UseQueryOptions {
  // Таблицы, изменение которых должно вызвать перечитывание (см. change-bus.ts).
  // Никакого автоопределения по SQL — список задаёт вызывающий код.
  tables: readonly string[];
  // false — не выполнять запрос вовсе (для условных экранов).
  enabled?: boolean;
}

export interface UseQueryResult<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// Реактивное чтение из SQLite без стейт-менеджера: SQLite остаётся единственным
// источником правды, хук просто перечитывает queryFn(db), когда notifyChange()
// сообщает об изменении одной из tables (см. utilities/change-bus.ts), плюс при монтировании
// и по ручному refetch().
export function useQuery<T>(queryFn: (db: DbExecutor) => Promise<T>, options: UseQueryOptions): UseQueryResult<T> {
  const db = useDb();
  const { tables, enabled = true } = options;

  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  // queryFn часто передают инлайн-стрелкой (новая identity на каждый рендер) —
  // держим последнюю версию в ref, чтобы не гонять эффект/подписку из-за этого.
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const runQuery = useCallback(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    queryFnRef
      .current(db)
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [db, enabled]);

  // tables обычно передают инлайн-массивом (новая identity на каждый рендер) —
  // сравниваем по содержимому через join, а не по ссылке, чтобы не пересоздавать
  // подписку на каждый рендер.
  const tablesKey = tables.join('|');

  useEffect(() => {
    runQuery();
    if (!enabled) return;
    return subscribeToChanges(tables, runQuery);
    // Зависимость — tablesKey (см. выше), а не tables: массив стабилен по
    // содержимому, а не по ссылке.
  }, [runQuery, enabled, tablesKey]);

  return { data, loading, error, refetch: runQuery };
}
