// Локальные типы cards-user.db. Общие с сервером/веб типы живут в @cards/contracts;
// здесь — только то, что не синхронизируется (снимок контента, кеш FSRS, очередь,
// локальные метаданные устройства) плюс snake_case-формы синхронизируемых таблиц.
import type { CardStatus, ItemType, Rating, SyncEntity, SyncOpKind } from '@cards/contracts';

// ---------- app_meta (локальное, ключ-значение) ----------

export type AppMetaKey =
  | 'device_id'
  | 'user_id'
  | 'user_id_is_local'
  | 'dictionary_content_version'
  | 'sync_cursor'
  | 'last_push_at'
  | 'last_pull_at'
  | 'onboarding_completed_at'
  | 'my_vocabulary_deck_id';

export interface AppMetaRow {
  key: AppMetaKey;
  value: string;
}

// ---------- user_profile ----------

export interface UserProfileRow {
  user_id: string;
  name: string | null;
  native_lang: string;
  target_lang: string;
  level: string;
  goals: string; // JSON string[]
  daily_minutes: number;
  new_per_day: number;
  waitlist_langs: string; // JSON string[]
  updated_at: string;
  field_meta: string | null; // JSON FieldRevisions (тип из @cards/contracts, но сама колонка — локальная)
}

// ---------- card ----------

export interface CardRow {
  id: string;
  user_id: string;
  item_type: ItemType;
  item_id: string;
  source_deck_id: string | null;
  overrides: string | null; // JSON CardOverrides
  status: CardStatus;
  merged_into_card_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  field_meta: string | null; // JSON FieldRevisions
}

// ---------- card_content (локальный снимок, не синхронизируется) ----------

export type CardContentSource = 'pack' | 'server' | 'manual';

export interface CardContentRow {
  card_id: string;
  lemma: string;
  pos: string | null;
  ipa: string | null;
  audio_url: string | null;
  cefr: string | null;
  translation: string;
  definition: string | null;
  source: CardContentSource;
  content_version: number | null;
  refreshed_at: string;
}

// ---------- card_content_example (один-ко-многим, миграция 006) ----------

export interface CardContentExampleRow {
  card_id: string;
  position: number;
  text: string;
  translation: string;
}

// ---------- card_schedule (кеш FSRS, производное от review_log) ----------

export interface CardScheduleRow {
  card_id: string;
  due: string | null;
  stability: number | null;
  difficulty: number | null;
  elapsed_days: number | null;
  scheduled_days: number | null;
  reps: number | null;
  lapses: number | null;
  fsrs_state: number | null;
  last_review: string | null;
  first_review_at: string | null;
}

// ---------- review_log (только добавление) ----------

export interface ReviewLogRow {
  id: string;
  card_id: string;
  user_id: string;
  rating: Rating;
  reviewed_at: string;
  elapsed_ms: number;
  device_id: string;
  tz_offset_min: number;
  synced_at: string | null;
}

// ---------- user_deck ----------

export interface UserDeckRow {
  user_id: string;
  deck_id: string;
  added_at: string;
  fast_mode: 0 | 1;
  updated_at: string;
  deleted_at: string | null;
  field_meta: string | null; // JSON FieldRevisions (тип из @cards/contracts, но сама колонка — локальная)
}

// ---------- deck / deck_item (свои колоды, тип 'user' — локально, без синхронизации) ----------

export interface DeckRow {
  id: string;
  user_id: string;
  title: string;
  lang: string;
  native_lang: string;
  type: 'user';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DeckItemRow {
  deck_id: string;
  item_type: ItemType;
  item_id: string;
  position: number;
  added_at: string;
}

// ---------- sync_op (локальная исходящая очередь) ----------

export interface SyncOpRow {
  op_id: string;
  schema_version: number;
  entity: SyncEntity;
  entity_id: string;
  kind: SyncOpKind;
  fields: string | null; // JSON
  client_ts: string;
  device_id: string;
  user_id: string;
  created_at: string;
  sent_at: string | null;
  acked_at: string | null;
}
