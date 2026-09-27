import { fileURLToPath } from 'node:url';
import path from 'node:path';

// apps/api/scripts/dictionary/lib/paths.ts -> корень репозитория (4 уровня вверх).
const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, '../../../../..');
export const DATA_DIR = path.join(REPO_ROOT, 'data');
export const RUNS_DIR = path.join(DATA_DIR, 'runs');

export function runDir(runId: string): string {
  return path.join(RUNS_DIR, runId);
}
