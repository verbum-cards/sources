import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const TAGS_MD_PATH = path.resolve(here, '../../../../../.claude/skills/dictionary-pipeline/references/tags.md');

// Читает список тегов прямо из справочника скилла (references/tags.md),
// чтобы промпт и валидация всегда были в одном источнике правды со скиллом.
export function loadTagList(tagsMdPath: string = TAGS_MD_PATH): string[] {
  const text = readFileSync(tagsMdPath, 'utf8');
  const tags: string[] = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\|\s*`([a-z]+)`\s*\|/);
    if (m) tags.push(m[1]);
  }
  return tags;
}
