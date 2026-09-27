import React, { createContext, useContext } from 'react';

import type { DbExecutor } from '../db/executor';

const DbContext = createContext<DbExecutor | null>(null);

export const DbProvider = ({ db, children }: { db: DbExecutor; children: React.ReactNode }) => {
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
};

export function useDb(): DbExecutor {
  const db = useContext(DbContext);
  if (!db) {
    throw new Error('useDb must be used inside <DbProvider> once cards-user.db is open');
  }
  return db;
}
