import type { Migration } from '../migrate';
import { m001 } from './001_init';
import { m002 } from './002_card_status';
import { m003 } from './003_add_user_name';

export const migrations: readonly Migration[] = [m001, m002, m003];
export const LATEST_VERSION: number = migrations[migrations.length - 1].version;
