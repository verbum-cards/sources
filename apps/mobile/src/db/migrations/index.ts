import type { Migration } from '../types';
import { m001 } from './001_init';

export const migrations: readonly Migration[] = [m001];
export const LATEST_VERSION: number = migrations[migrations.length - 1].version;
