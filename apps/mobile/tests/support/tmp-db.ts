import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Файловая (не :memory:) временная база — нужна там, где важен реальный
// journal_mode (в памяти SQLite всегда отвечает 'memory', а не 'delete'/'wal').
export function tempDbPath(name: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'cards-db-test-'));
  return join(dir, name);
}
