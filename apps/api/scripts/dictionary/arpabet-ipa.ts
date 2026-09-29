// ARPAbet (CMUdict) -> IPA, американское произношение. Таблица — стандартное
// соответствие (39 фонем ARPAbet, см. cmudict.phones), написана по общей
// лингвистической номенклатуре, а не скопирована из чужого датасета: сама
// готовая конвертация CMUdict->IPA (репозиторий menelik3/cmudict-ipa) без
// указанной лицензии, брать её для коммерческого продукта рискованно — сырой
// CMUdict (BSD-2-Clause) можно, поэтому конвертируем сами.
//
// Ударение в CMUdict — цифра на гласной фонеме (0 — нет, 1 — основное,
// 2 — второстепенное), не позиция начала слога (слоги CMUdict не размечает).
// Здесь ударение ставится прямо перед гласной фонемой, которая его несёт —
// упрощение, не полная реконструкция границ слога, но других данных для
// этого в источнике просто нет.
const VOWELS: Record<string, string> = {
  AA: 'ɑ',
  AE: 'æ',
  // AH — по ударению: безударная (AH0) не «ʌ», а редуцированная «ə» (schwa) —
  // стандартный частный случай, без него безударные слоги звучали бы неверно.
  AH: 'ʌ',
  AO: 'ɔ',
  AW: 'aʊ',
  AY: 'aɪ',
  EH: 'ɛ',
  // ER — по ударению: безударная (ER0) — «ɚ», а не «ɝ».
  ER: 'ɝ',
  EY: 'eɪ',
  IH: 'ɪ',
  IY: 'i',
  OW: 'oʊ',
  OY: 'ɔɪ',
  UH: 'ʊ',
  UW: 'u',
};

const CONSONANTS: Record<string, string> = {
  B: 'b',
  CH: 'tʃ',
  D: 'd',
  DH: 'ð',
  F: 'f',
  G: 'g',
  HH: 'h',
  JH: 'dʒ',
  K: 'k',
  L: 'l',
  M: 'm',
  N: 'n',
  NG: 'ŋ',
  P: 'p',
  R: 'ɹ',
  S: 's',
  SH: 'ʃ',
  T: 't',
  TH: 'θ',
  V: 'v',
  W: 'w',
  Y: 'j',
  Z: 'z',
  ZH: 'ʒ',
};

const PRIMARY_STRESS = 'ˈ';
const SECONDARY_STRESS = 'ˌ';

// Одна фонема CMUdict ("AH0", "T", "ER1", ...) -> символ(ы) IPA, с ударением
// перед гласной, если оно есть.
function phonemeToIpa(phoneme: string): string {
  const match = /^([A-Z]+)([012])?$/.exec(phoneme);
  if (!match) return '';
  const [, base, stress] = match;

  if (base in CONSONANTS) return CONSONANTS[base];

  const vowel = VOWELS[base];
  if (!vowel) return '';

  // AH0 -> schwa, ER0 -> ɚ — безударные частные случаи конкретных гласных,
  // не общее правило для всех гласных.
  const symbol =
    stress === '0' && base === 'AH' ? 'ə' : stress === '0' && base === 'ER' ? 'ɚ' : vowel;

  if (stress === '1') return PRIMARY_STRESS + symbol;
  if (stress === '2') return SECONDARY_STRESS + symbol;

  return symbol;
}

export function arpabetToIpa(phonemes: readonly string[]): string {
  return phonemes.map(phonemeToIpa).join('');
}
