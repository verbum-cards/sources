// snake_case (SQL-строки cards-user.db) <-> camelCase (@cards/contracts).
import type {
  CardStored,
  FieldRevisions,
  Goal,
  ReviewLog,
  UserDeckStored,
  UserLevel,
  UserProfileStored,
} from '@cards/contracts';

import type { CardRow, ReviewLogRow, UserDeckRow, UserProfileRow } from './types';

function parseFieldRevisions(fieldMeta: string | null): FieldRevisions {
  return fieldMeta ? (JSON.parse(fieldMeta) as FieldRevisions) : {};
}

// ---------- user_profile ----------

// fieldRevisions читается из field_meta и возвращается как есть в
// userProfileToRow — маппер не имеет права стирать метаданные конфликтов
// при апдейте, только код, который меняет конкретное поле, вправе их менять.
export function rowToUserProfile(row: UserProfileRow): UserProfileStored {
  return {
    userId: row.user_id,
    name: row.name,
    nativeLang: row.native_lang as UserProfileStored['nativeLang'],
    targetLang: row.target_lang as UserProfileStored['targetLang'],
    level: row.level as UserLevel,
    goals: JSON.parse(row.goals) as Goal[],
    dailyMinutes: row.daily_minutes as UserProfileStored['dailyMinutes'],
    newPerDay: row.new_per_day,
    waitlistLangs: JSON.parse(row.waitlist_langs) as string[],
    updatedAt: row.updated_at,
    fieldRevisions: parseFieldRevisions(row.field_meta),
  };
}

export function userProfileToRow(profile: UserProfileStored): UserProfileRow {
  return {
    user_id: profile.userId,
    name: profile.name,
    native_lang: profile.nativeLang,
    target_lang: profile.targetLang,
    level: profile.level,
    goals: JSON.stringify(profile.goals),
    daily_minutes: profile.dailyMinutes,
    new_per_day: profile.newPerDay,
    waitlist_langs: JSON.stringify(profile.waitlistLangs),
    updated_at: profile.updatedAt,
    field_meta: JSON.stringify(profile.fieldRevisions),
  };
}

// ---------- card ----------

export function rowToCard(row: CardRow): CardStored {
  return {
    id: row.id,
    userId: row.user_id,
    itemType: row.item_type,
    itemId: row.item_id,
    sourceDeckId: row.source_deck_id,
    overrides: row.overrides ? (JSON.parse(row.overrides) as CardStored['overrides']) : null,
    status: row.status,
    mergedIntoCardId: row.merged_into_card_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    fieldRevisions: parseFieldRevisions(row.field_meta),
  };
}

export function cardToRow(card: CardStored): CardRow {
  return {
    id: card.id,
    user_id: card.userId,
    item_type: card.itemType,
    item_id: card.itemId,
    source_deck_id: card.sourceDeckId,
    overrides: card.overrides ? JSON.stringify(card.overrides) : null,
    status: card.status,
    merged_into_card_id: card.mergedIntoCardId,
    created_at: card.createdAt,
    updated_at: card.updatedAt,
    deleted_at: card.deletedAt,
    field_meta: JSON.stringify(card.fieldRevisions),
  };
}

// ---------- review_log ----------

export function rowToReviewLog(row: ReviewLogRow): ReviewLog {
  return {
    id: row.id,
    cardId: row.card_id,
    userId: row.user_id,
    rating: row.rating,
    reviewedAt: row.reviewed_at,
    elapsedMs: row.elapsed_ms,
    deviceId: row.device_id,
    tzOffsetMin: row.tz_offset_min,
  };
}

export function reviewLogToRow(log: ReviewLog): ReviewLogRow {
  return {
    id: log.id,
    card_id: log.cardId,
    user_id: log.userId,
    rating: log.rating,
    reviewed_at: log.reviewedAt,
    elapsed_ms: log.elapsedMs,
    device_id: log.deviceId,
    tz_offset_min: log.tzOffsetMin,
    synced_at: null,
  };
}

// ---------- user_deck ----------

export function rowToUserDeck(row: UserDeckRow): UserDeckStored {
  return {
    userId: row.user_id,
    deckId: row.deck_id,
    addedAt: row.added_at,
    fastMode: row.fast_mode === 1,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    fieldRevisions: parseFieldRevisions(row.field_meta),
  };
}

export function userDeckToRow(deck: UserDeckStored): UserDeckRow {
  return {
    user_id: deck.userId,
    deck_id: deck.deckId,
    added_at: deck.addedAt,
    fast_mode: deck.fastMode ? 1 : 0,
    updated_at: deck.updatedAt,
    deleted_at: deck.deletedAt,
    field_meta: JSON.stringify(deck.fieldRevisions),
  };
}
