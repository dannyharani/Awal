export interface AmazighCharHint {
  char: string;
  upper: string;
  hint: string;
  tifinagh: string;
}

export const AMAZIGH_SPECIAL_CHARS: AmazighCharHint[] = [
  { char: 'ɣ', upper: 'Ɣ', hint: 'gh (aɣrum)', tifinagh: 'ⵖ' },
  { char: 'ɛ', upper: 'Ɛ', hint: '3 / ʿayn (ɛziz)', tifinagh: 'ⵄ' },
  { char: 'č', upper: 'Č', hint: 'tch (učči)', tifinagh: 'ⵞ' },
  { char: 'ǧ', upper: 'Ǧ', hint: 'dj (taǧǧalt)', tifinagh: 'ⴵ' },
  { char: 'ḍ', upper: 'Ḍ', hint: 'emphatic d (aḍu)', tifinagh: 'ⴹ' },
  { char: 'ṭ', upper: 'Ṭ', hint: 'emphatic t (iṭij)', tifinagh: 'ⵟ' },
  { char: 'ẓ', upper: 'Ẓ', hint: 'emphatic z (iẓri)', tifinagh: 'ⵥ' },
  { char: 'ḥ', upper: 'Ḥ', hint: 'pharyngeal h (aḥlil)', tifinagh: 'ⵃ' },
  { char: 'ṣ', upper: 'Ṣ', hint: 'emphatic s (ṣṣber)', tifinagh: 'ⵚ' },
  { char: 'ṛ', upper: 'Ṛ', hint: 'emphatic r (ṛebbi)', tifinagh: 'ⵕ' },
  { char: 'ʷ', upper: 'ʷ', hint: 'labiovelar (akʷ, agʷ)', tifinagh: 'ʷ' }
];

const LATIN_TO_TIFINAGH_MAP: Record<string, string> = {
  a: 'ⴰ',
  ă: 'ⴰ',
  â: 'ⴰ',
  b: 'ⴱ',
  c: 'ⵛ',
  č: 'ⵞ',
  d: 'ⴷ',
  ḍ: 'ⴹ',
  e: 'ⴻ',
  ɛ: 'ⵄ',
  ε: 'ⵄ',
  '3': 'ⵄ',
  f: 'ⴼ',
  g: 'ⴳ',
  ǧ: 'ⴵ',
  ɣ: 'ⵖ',
  γ: 'ⵖ',
  h: 'ⵀ',
  ḥ: 'ⵃ',
  i: 'ⵉ',
  î: 'ⵉ',
  j: 'ⵊ',
  k: 'ⴽ',
  l: 'ⵍ',
  m: 'ⵎ',
  n: 'ⵏ',
  o: 'ⵓ',
  p: 'ⵒ',
  q: 'ⵇ',
  r: 'ⵔ',
  ṛ: 'ⵕ',
  s: 'ⵙ',
  ṣ: 'ⵚ',
  t: 'ⵜ',
  ṭ: 'ⵟ',
  u: 'ⵓ',
  û: 'ⵓ',
  v: 'ⵠ',
  w: 'ⵡ',
  x: 'ⵅ',
  y: 'ⵢ',
  z: 'ⵣ',
  ẓ: 'ⵥ',
  ʷ: 'ʷ'
};

/**
 * Converts Latin Amazigh script into standard Neo-Tifinagh (IRCAM).
 * Supports common digraphs (gh -> ⵖ, tch -> ⵞ, dj -> ⴵ, ch -> ⵛ, kh -> ⵅ).
 */
export function latinToTifinagh(input: string): string {
  if (!input) return '';
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/tch/g, 'č')
    .replace(/dj/g, 'ǧ')
    .replace(/gh/g, 'ɣ')
    .replace(/kh/g, 'x')
    .replace(/sh|ch/g, 'c');

  let result = '';
  for (const ch of normalized) {
    result += LATIN_TO_TIFINAGH_MAP[ch] ?? ch;
  }
  return result;
}

/**
 * Generates a consistent URL-safe slug for Amazigh headwords,
 * preserving standard Amazigh Latin characters.
 */
export function generateWordSlug(scriptLatin: string): string {
  return scriptLatin
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u00C0-\u024F\u1E00-\u1EFFɣɛčǧḍṭẓḥṣṛʷ\-_]/g, '');
}

export const PARTS_OF_SPEECH = [
  { value: 'noun', label: 'Noun (Isem)' },
  { value: 'verb', label: 'Verb (Amyag)' },
  { value: 'adjective', label: 'Adjective (Arbib)' },
  { value: 'adverb', label: 'Adverb (Amernu)' },
  { value: 'pronoun', label: 'Pronoun (Amqim)' },
  { value: 'preposition', label: 'Preposition (Tanzeɣt)' },
  { value: 'interjection', label: 'Interjection / Greeting' },
  { value: 'expression', label: 'Idiom / Expression' }
] as const;

export const GENDERS = [
  { value: 'masculine', label: 'Masculine (Amalay)' },
  { value: 'feminine', label: 'Feminine (Unti)' },
  { value: 'both', label: 'Masculine & Feminine' }
] as const;

export const GRAMMATICAL_NUMBERS = [
  { value: 'singular', label: 'Singular (Asuf)' },
  { value: 'plural', label: 'Plural (Asget)' },
  { value: 'collective', label: 'Collective / Uncountable' }
] as const;

export const WORD_RELATION_TYPES = [
  { value: 'synonym', label: 'Cross-Dialect Synonym (same meaning, different word)' },
  { value: 'variant', label: 'Phonetic / Spelling Variant (cognate across dialects)' },
  { value: 'derived', label: 'Derived / Related Word (same root)' },
  { value: 'antonym', label: 'Antonym (opposite meaning)' }
] as const;

export const ALPHABET_LATIN = [
  'A', 'B', 'C', 'Č', 'D', 'Ḍ', 'E', 'Ɛ', 'F', 'G', 'Ǧ', 'Ɣ',
  'H', 'Ḥ', 'I', 'J', 'K', 'L', 'M', 'N', 'Q', 'R', 'Ṛ', 'S',
  'Ṣ', 'T', 'Ṭ', 'U', 'W', 'X', 'Y', 'Z', 'Ẓ'
] as const;

export const COURSE_CATEGORIES = [
  { value: 'conversation', label: 'Daily Conversation (Asiwel)' },
  { value: 'grammar', label: 'Grammar & Structure (Tajerrumt)' },
  { value: 'vocabulary', label: 'Vocabulary & Phrases (Amawal)' },
  { value: 'alphabet', label: 'Reading & Writing (Agemmay)' },
  { value: 'culture', label: 'Culture & Literature (Tasekla)' }
] as const;

