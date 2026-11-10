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

export interface AmazighGlossaryEntry {
  word: string;
  tifinagh: string;
  slug: string;
  partOfSpeech: string;
  meaning: string;
  dialect: string;
  notes?: string;
}

export const AMAZIGH_GLOSSARY: Record<string, AmazighGlossaryEntry> = {
  awal: {
    word: 'Awal',
    tifinagh: 'ⴰⵡⴰⵍ',
    slug: 'awal',
    partOfSpeech: 'noun (m.)',
    meaning: 'Word, speech, language, or promise.',
    dialect: 'Pan-Amazigh',
    notes: 'Plural: Awalen (ⴰⵡⴰⵍⵏ) • Construct state: Wawal (ⵡⴰⵡⴰⵍ)'
  },
  amawal: {
    word: 'Amawal',
    tifinagh: 'ⴰⵎⴰⵡⴰⵍ',
    slug: 'amawal',
    partOfSpeech: 'noun (m.)',
    meaning: 'Dictionary, lexicon, or vocabulary collection.',
    dialect: 'Pan-Amazigh',
    notes: 'Derived from root W-L (awal = word). Construct state: Umawal.'
  },
  timsirin: {
    word: 'Timsirin',
    tifinagh: 'ⵜⵉⵎⵙⵉⵔⵉⵏ',
    slug: 'timsirin',
    partOfSpeech: 'noun (f. pl.)',
    meaning: 'Lessons, courses, or structured educational modules.',
    dialect: 'Pan-Amazigh',
    notes: 'Singular: Tamsirt (ⵜⴰⵎⵙⵉⵔⵜ)'
  },
  uraren: {
    word: 'Uraren',
    tifinagh: 'ⵓⵔⴰⵔⵏ',
    slug: 'uraren',
    partOfSpeech: 'noun (m. pl.)',
    meaning: 'Games, playful challenges, or traditional festivities.',
    dialect: 'Pan-Amazigh',
    notes: 'Singular: Urar (ⵓⵔⴰⵔ)'
  },
  amezday: {
    word: 'Amezday',
    tifinagh: 'ⴰⵎⵣⴷⴰⵢ',
    slug: 'amezday',
    partOfSpeech: 'noun / adj.',
    meaning: 'Community, collective, or common shared space.',
    dialect: 'Pan-Amazigh',
    notes: 'Derived from root Z-D-Y (to unite, connect, bring together).'
  },
  asiwel: {
    word: 'Asiwel',
    tifinagh: 'ⴰⵙⵉⵡⵍ',
    slug: 'asiwel',
    partOfSpeech: 'noun (m.)',
    meaning: 'Conversation, dialogue, speech, or spoken communication.',
    dialect: 'Pan-Amazigh',
    notes: 'Verbal noun of siwel (to speak, call, converse).'
  },
  tajerrumt: {
    word: 'Tajerrumt',
    tifinagh: 'ⵜⴰⵊⵕⵕⵓⵎⵜ',
    slug: 'tajerrumt',
    partOfSpeech: 'noun (f.)',
    meaning: 'Grammar and structural rules of language.',
    dialect: 'Pan-Amazigh',
    notes: 'Historically linked to the Amazigh grammarian Ibn Ajarrum.'
  },
  agemmay: {
    word: 'Agemmay',
    tifinagh: 'ⴰⴳⵎⵎⴰⵢ',
    slug: 'agemmay',
    partOfSpeech: 'noun (m.)',
    meaning: 'Alphabet, spelling system, or literacy.',
    dialect: 'Pan-Amazigh',
    notes: 'Refers to both Tifinagh (ⵜⵉⴼⵉⵏⴰⵖ) and Tamazight Latin scripts.'
  },
  tasekla: {
    word: 'Tasekla',
    tifinagh: 'ⵜⴰⵙⴽⵍⴰ',
    slug: 'tasekla',
    partOfSpeech: 'noun (f.)',
    meaning: 'Literature, poetic heritage, and written or oral arts.',
    dialect: 'Pan-Amazigh',
    notes: 'Encompasses both ancient oral poetry (Izlan, Isefra) and modern prose.'
  },
  tawalt: {
    word: 'Tawalt',
    tifinagh: 'ⵜⴰⵡⴰⵍⵜ',
    slug: 'tawalt',
    partOfSpeech: 'noun (f.)',
    meaning: 'A single word, short phrase, or turn of speech.',
    dialect: 'Pan-Amazigh',
    notes: 'Diminutive/feminine form of Awal (ⴰⵡⴰⵍ).'
  },
  anagam: {
    word: 'Anagam',
    tifinagh: 'ⴰⵏⴰⴳⴰⵎ',
    slug: 'anagam',
    partOfSpeech: 'noun (m.)',
    meaning: 'Seeker, researcher, or explorer of roots and meanings.',
    dialect: 'Pan-Amazigh',
    notes: 'Used for Awal’s daily triconsonantal root-finder challenge.'
  },
  assaghen: {
    word: 'Assaɣen',
    tifinagh: 'ⴰⵙⵙⴰⵖⵏ',
    slug: 'assaɣen',
    partOfSpeech: 'noun (m. pl.)',
    meaning: 'Connections, links, relationships, or bonds.',
    dialect: 'Pan-Amazigh',
    notes: 'Singular: Assaɣ (ⴰⵙⵙⴰⵖ)'
  },
  'assaɣen': {
    word: 'Assaɣen',
    tifinagh: 'ⴰⵙⵙⴰⵖⵏ',
    slug: 'assaɣen',
    partOfSpeech: 'noun (m. pl.)',
    meaning: 'Connections, links, relationships, or bonds.',
    dialect: 'Pan-Amazigh',
    notes: 'Singular: Assaɣ (ⴰⵙⵙⴰⵖ)'
  },
  azul: {
    word: 'Azul',
    tifinagh: 'ⴰⵣⵓⵍ',
    slug: 'azul',
    partOfSpeech: 'interjection',
    meaning: 'Hello, greetings, peace (literally: from the heart / toward goodness).',
    dialect: 'Pan-Amazigh',
    notes: 'Common response: Azul fell-ak (m.) / Azul fell-am (f.).'
  },
  tamazight: {
    word: 'Tamaziɣt',
    tifinagh: 'ⵜⴰⵎⴰⵣⵉⵖⵜ',
    slug: 'tamaziɣt',
    partOfSpeech: 'noun (f.)',
    meaning: 'The indigenous Amazigh language family of North Africa.',
    dialect: 'Pan-Amazigh',
    notes: 'Spoken across Tamazɣa from Siwa Oasis to the Canary Islands.'
  },
  'tamaziɣt': {
    word: 'Tamaziɣt',
    tifinagh: 'ⵜⴰⵎⴰⵣⵉⵖⵜ',
    slug: 'tamaziɣt',
    partOfSpeech: 'noun (f.)',
    meaning: 'The indigenous Amazigh language family of North Africa.',
    dialect: 'Pan-Amazigh',
    notes: 'Spoken across Tamazɣa from Siwa Oasis to the Canary Islands.'
  },
  tamazgha: {
    word: 'Tamazɣa',
    tifinagh: 'ⵜⴰⵎⴰⵣⵖⴰ',
    slug: 'tamazɣa',
    partOfSpeech: 'proper noun (f.)',
    meaning: 'The historical and cultural homeland of the Imaziɣen across North Africa.',
    dialect: 'Pan-Amazigh',
    notes: 'Spans Morocco, Algeria, Tunisia, Libya, Siwa (Egypt), Canary Islands, and the Sahel.'
  },
  'tamazɣa': {
    word: 'Tamazɣa',
    tifinagh: 'ⵜⴰⵎⴰⵣⵖⴰ',
    slug: 'tamazɣa',
    partOfSpeech: 'proper noun (f.)',
    meaning: 'The historical and cultural homeland of the Imaziɣen across North Africa.',
    dialect: 'Pan-Amazigh',
    notes: 'Spans Morocco, Algeria, Tunisia, Libya, Siwa (Egypt), Canary Islands, and the Sahel.'
  },
  tifinagh: {
    word: 'Tifinagh',
    tifinagh: 'ⵜⵉⴼⵉⵏⴰⵖ',
    slug: 'tifinagh',
    partOfSpeech: 'noun (f. pl.)',
    meaning: 'The indigenous alphabetic script used to write the Amazigh languages.',
    dialect: 'Pan-Amazigh',
    notes: 'Attested in rock inscriptions across North Africa for over two millennia.'
  },
  'addad-amaruz': {
    word: 'Addad Amaruz',
    tifinagh: 'ⴰⴷⴷⴰⴷ ⴰⵎⴰⵔⵓⵣ',
    slug: 'addad-amaruz',
    partOfSpeech: 'noun phrase',
    meaning: 'Construct State (annexed state) of an Amazigh noun after prepositions or post-verbal subject position.',
    dialect: 'Pan-Amazigh Grammar',
    notes: 'Contrasts with Addad Ilelli (Free State), e.g., Aman → Waman, Tamurt → Tmurt.'
  }
};

export function lookupAmazighGlossary(term: string): AmazighGlossaryEntry | undefined {
  const key = term.trim().toLowerCase();
  if (AMAZIGH_GLOSSARY[key]) return AMAZIGH_GLOSSARY[key];
  const slugKey = generateWordSlug(key);
  if (AMAZIGH_GLOSSARY[slugKey]) return AMAZIGH_GLOSSARY[slugKey];
  return Object.values(AMAZIGH_GLOSSARY).find(
    (entry) => entry.tifinagh === term.trim() || entry.word.toLowerCase() === key
  );
}


