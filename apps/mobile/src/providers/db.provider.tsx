import React, { createContext } from 'react';

import type { DbExecutor } from '../db/executor';

export const DbContext = createContext<DbExecutor | null>(null);

export const DbProvider = ({ db, children }: { db: DbExecutor; children: React.ReactNode }) => {
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
};
