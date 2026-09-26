// snake_case (SQL-строки cards-user.db) <-> camelCase (@cards/contracts).
import type { Card, Goal, ItemPreview, ReviewLog, UserDeck, UserLevel, UserProfile } from '@cards/contracts';
import type { CardContentRow, CardRow, ReviewLogRow, UserDeckRow, UserProfileRow } from './types';

// ---------- user_profile ----------

export function rowToUserProfile(row: UserProfileRow): UserProfile {
  return {
    userId: row.user_id,
    nativeLang: row.native_lang as UserProfile['nativeLang'],
    targetLang: row.target_lang as UserProfile['targetLang'],
    level: row.level as UserLevel,
    goals: JSON.parse(row.goals) as Goal[],
    dailyMinutes: row.daily_minutes as UserProfile['dailyMinutes'],
    newPerDay: row.new_per_day,
    waitlistLangs: JSON.parse(row.waitlist_langs) as string[],
    updatedAt: row.updated_at,
  };
}

export function userProfileToRow(profile: UserProfile): UserProfileRow {
  return {
    user_id: profile.userId,
    native_lang: profile.nativeLang,
    target_lang: profile.targetLang,
    level: profile.level,
    goals: JSON.stringify(profile.goals),
    daily_minutes: profile.dailyMinutes,
    new_per_day: profile.newPerDay,
    waitlist_langs: JSON.stringify(profile.waitlistLangs),
    updated_at: profile.updatedAt,
    field_meta: null,
  };
}

// ---------- card ----------

export function rowToCard(row: CardRow): Card {
  return {
    id: row.id,
    userId: row.user_id,
    itemType: row.item_type,
    itemId: row.item_id,
    sourceDeckId: row.source_deck_id ?? undefined,
    overrides: row.overrides ? (JSON.parse(row.overrides) as Card['overrides']) : undefined,
    state: row.state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

export function cardToRow(card: Card): CardRow {
  return {
    id: card.id,
    user_id: card.userId,
    item_type: card.itemType,
    item_id: card.itemId,
    source_deck_id: card.sourceDeckId ?? null,
    overrides: card.overrides ? JSON.stringify(card.overrides) : null,
    state: card.state,
    created_at: card.createdAt,
    updated_at: card.updatedAt,
    deleted_at: card.deletedAt ?? null,
    field_meta: null,
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

export function rowToUserDeck(row: UserDeckRow): UserDeck {
  return {
    userId: row.user_id,
    deckId: row.deck_id,
    addedAt: row.added_at,
    fastMode: row.fast_mode === 1,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

export function userDeckToRow(deck: UserDeck): UserDeckRow {
  return {
    user_id: deck.userId,
    deck_id: deck.deckId,
    added_at: deck.addedAt,
    fast_mode: deck.fastMode ? 1 : 0,
    updated_at: deck.updatedAt,
    deleted_at: deck.deletedAt ?? null,
    field_meta: null,
  };
}

// ---------- card_content -> ItemPreview (для карточки на экране) ----------

export function cardContentRowToItemPreview(row: CardContentRow, itemType: ItemPreview['itemType'], itemId: string): ItemPreview {
  return {
    itemType,
    itemId,
    lemma: row.lemma,
    pos: row.pos ?? '',
    ipa: row.ipa ?? undefined,
    audioUrl: row.audio_url ?? undefined,
    cefr: (row.cefr ?? 'A1') as ItemPreview['cefr'],
    translation: row.translation,
    example: row.example ?? undefined,
    exampleHighlight: row.example_highlight ? (JSON.parse(row.example_highlight) as [number, number]) : undefined,
    exampleTranslation: row.example_translation ?? undefined,
  };
}
