import type { Migration } from '../migrate';
import { m001 } from './001_init';
import { m002 } from './002_card_status';
import { m003 } from './003_add_user_name';
import { m004 } from './004_add_card_content_definition';
import { m005 } from './005_add_user_deck_tables';

export const migrations: readonly Migration[] = [m001, m002, m003, m004, m005];
export const LATEST_VERSION: number = migrations[migrations.length - 1].version;
