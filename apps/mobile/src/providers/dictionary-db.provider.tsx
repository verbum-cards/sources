import React, { createContext } from 'react';

import type { DbExecutor } from '../db/executor';

// Отдельный контекст от DbContext (cards-user.db) — два независимых файла
// SQLite на устройстве, без ATTACH/JOIN между ними (docs/data-model.md).
export const DictionaryDbContext = createContext<DbExecutor | null>(null);

export const DictionaryDbProvider = ({
  db,
  children,
}: {
  db: DbExecutor;
  children: React.ReactNode;
}) => {
  return <DictionaryDbContext.Provider value={db}>{children}</DictionaryDbContext.Provider>;
};
