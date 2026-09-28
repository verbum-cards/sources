import type { Goal, ItemType } from '@cards/contracts';

import { wordByLemma, type MockWord } from './words';

// T1.7: тестовый набор слов для дебаг-экрана проверки FSRS (см. FsrsDebugScreen)
// и для первой сессии онбординга (F1, см. onboarding-logic.ts). Слова сами по
// себе описаны один раз в WORDS (mocks/words.ts) — здесь только порядок и
// ссылки по лемме, плюс проверка, что у каждого слова есть goals (не у всех
// в WORDS они есть — у слов из колод, например).
export interface DebugWord extends MockWord {
  goals: readonly Goal[];
}

export const DEBUG_ITEM_TYPE: ItemType = 'sense';

// Порядок и состав — как раньше (было 48 полных объектов прямо здесь).
const DEBUG_LEMMAS: readonly string[] = [
  'wander',
  'fierce',
  'tenant',
  'borrow',
  'crowded',
  'neighbor',
  'suddenly',
  'improve',
  'exhausted',
  'deadline',
  'rely',
  'sincere',
  'gather',
  'stubborn',
  'threat',
  'whisper',
  'generous',
  'journey',
  'avoid',
  'curious',
  'handle',
  'narrow',
  'thrive',
  'reluctant',
  'achieve',
  'brief',
  'cozy',
  'valuable',
  'level',
  'opponent',
  'controller',
  'score',
  'player',
  'team',
  'win',
  'lose',
  'rule',
  'turn',
  'password',
  'update',
  'install',
  'device',
  'screen',
  'battery',
  'charger',
  'click',
  'connect',
  'file',
];

function toDebugWord(lemma: string): DebugWord {
  const word = wordByLemma(lemma);
  if (!word.goals) {
    throw new Error(`DEBUG_WORDS: у слова "${lemma}" нет goals в WORDS`);
  }

  return { ...word, goals: word.goals };
}

export const DEBUG_WORDS: readonly DebugWord[] = DEBUG_LEMMAS.map(toDebugWord);
