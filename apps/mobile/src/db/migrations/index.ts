import type { Migration } from '../types';
import { m001 } from './001_init';
import { m002 } from './002_card_status';

export const migrations: readonly Migration[] = [m001, m002];
export const LATEST_VERSION: number = migrations[migrations.length - 1].version;
