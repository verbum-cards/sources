import { useContext } from 'react';

import type { DbExecutor } from '../db/executor';
import { DbContext } from '../providers/db.provider';

export const useDb = (): DbExecutor => {
  const db = useContext(DbContext);
  if (!db) {
    throw new Error('useDb must be used inside <DbProvider> once cards-user.db is open');
  }

  return db;
};
