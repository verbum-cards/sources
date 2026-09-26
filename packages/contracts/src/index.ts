// Общие типы для mobile, api, web и backoffice.
// Источник правды по смыслу — docs/data-model.md и docs/sync-protocol.md.
// Это стартовая версия: при реализации T1.4 типы дополняются схемами Zod.

export type Lang = 'en' | 'ru' | 'tr';
export type Cefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type Uuid = string;
export type IsoDate = string;

// ---------- Общий контент словаря ----------

export interface Lexeme {
  id: Uuid;
  lang: Lang;
  lemma: string;
  pos: string;
  ipa?: string;
  audioUrl?: string;
  frequencyRank?: number;
}

export type ReviewStatus = 'unverified' | 'verified' | 'rejected';

export interface Sense {
  id: Uuid;
  lexemeId: Uuid;
  conceptId: Uuid;
  cefr: Cefr;
  tags: string[];
  frequencyRank?: number;
  status: ReviewStatus;
}

export interface Expression {
  id: Uuid;
  lang: Lang;
  text: string;
  cefr: Cefr;
  tags: string[];
  audioUrl?: string;
  conceptIds: Uuid[];
  status: ReviewStatus;
}

export type ItemType = 'sense' | 'expression';

export interface Translation {
  id: Uuid;
  targetType: ItemType;
  targetId: Uuid;
  lang: Lang;
  text: string;
  source: 'dictionary' | 'llm' | 'via_concept';
  verified: boolean;
}

export interface Example {
  id: Uuid;
  targetType: ItemType;
  targetId: Uuid;
  lang: Lang;
  text: string;
  highlight?: [start: number, end: number];
  audioUrl?: string;
  translations: Partial<Record<Lang, string>>;
}

// ---------- Колоды ----------

export interface DeckContext {
  situation: string;
  roles: { learner: string; partner: string; learnerGoal: string; partnerGoal?: string };
  register: 'polite' | 'neutral' | 'casual';
  branches: string[];
  cultureNotes: string[];
}

export interface Deck {
  id: Uuid;
  lang: Lang;
  nativeLang: Lang;
  title: string;
  goalTags: string[];
  type: 'official' | 'user' | 'shared';
  context?: DeckContext; // обязателен для official (FR-49)
}

export interface DeckItem {
  deckId: Uuid;
  itemType: ItemType;
  itemId: Uuid;
  cefr: Cefr;
  position: number;
  importance: 1 | 2 | 3;
}

// ---------- Пользовательские данные ----------

export type Goal = 'travel' | 'work' | 'move' | 'exam' | 'media' | 'self';

export interface UserProfile {
  userId: Uuid;
  nativeLang: Lang;
  targetLang: Lang;
  level: Cefr | 'unknown';
  goals: Goal[];
  dailyMinutes: 5 | 10 | 15;
  newPerDay: number;
  waitlistLangs: string[];
}

export type CardState = 'new' | 'learning' | 'review' | 'suspended' | 'known';

export interface Card {
  id: Uuid; // UUID v7, создаёт клиент
  userId: Uuid;
  itemType: ItemType;
  itemId: Uuid;
  sourceDeckId?: Uuid;
  overrides?: Partial<{ translation: string; example: string; note: string }>;
  state: CardState;
  createdAt: IsoDate;
  deletedAt?: IsoDate;
}

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewLog {
  id: Uuid;
  cardId: Uuid;
  userId: Uuid;
  rating: Rating;
  reviewedAt: IsoDate;
  elapsedMs: number;
  deviceId: string;
}

// ---------- Синхронизация (docs/sync-protocol.md) ----------

export type SyncEntity = 'card' | 'review_log' | 'user_profile' | 'user_deck';

export interface SyncOp {
  opId: Uuid;
  schemaVersion: number;
  deviceId: string;
  userId: Uuid;
  entity: SyncEntity;
  entityId: Uuid;
  kind: 'upsert' | 'delete';
  fields?: Record<string, unknown>;
  clientTs: IsoDate;
}

export interface SyncPushRequest { deviceId: string; ops: SyncOp[] }
export interface SyncPushResponse { accepted: Uuid[]; cursor: number }
export interface SyncPullResponse { ops: (SyncOp & { serverSeq: number })[]; nextCursor: number; hasMore: boolean }
