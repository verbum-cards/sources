import type { DatabaseSync } from 'node:sqlite';

export interface SqliteMasterRow {
  type: string;
  name: string;
  tbl_name: string;
  sql: string | null;
}

export function dumpSchema(db: DatabaseSync): SqliteMasterRow[] {
  return db.prepare('SELECT type, name, tbl_name, sql FROM sqlite_master ORDER BY type, name').all() as unknown as SqliteMasterRow[];
}

export function formatSchemaDump(rows: readonly SqliteMasterRow[]): string {
  return rows.map((row) => `${row.type}\t${row.name}\t${row.tbl_name}\t${row.sql ?? ''}`).join('\n') + '\n';
}
