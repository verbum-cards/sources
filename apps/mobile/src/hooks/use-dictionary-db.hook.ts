import { useContext } from 'react';

import type { DbExecutor } from '../db/executor';
import { DictionaryDbContext } from '../providers/dictionary-db.provider';

export const useDictionaryDb = (): DbExecutor => {
  const db = useContext(DictionaryDbContext);
  if (!db) {
    throw new Error(
      'useDictionaryDb must be used inside <DictionaryDbProvider> once the dictionary pack is open'
    );
  }

  return db;
};
