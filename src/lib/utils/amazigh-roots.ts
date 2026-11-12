/**
 * Heuristic consonantal-root estimation for Amazigh (Tamaziɣt) headwords.
 *
 * IMPORTANT: this is an *estimate*, not a linguistic analysis. It exists so that
 * bulk-imported dictionary entries can be grouped into "word families" (words that
 * share a consonant skeleton) for search and for the "same root" panel. Entries
 * produced here are flagged `root_estimated: true` so moderators/contributors can
 * tell them apart from human-curated roots.
 *
 * Rules:
 *  - Only lexical categories (noun / adjective / verb) get a root; function words don't.
 *  - Nominal morphology is stripped first: initial vowel (a-, i-, u-), the feminine
 *    circumfix t-…-t, and the labialisation mark ʷ.
 *  - The consonant skeleton is what remains after removing vowels. Doubled consonants
 *    (gemination) are collapsed because they mark derivation rather than the root.
 *  - Skeletons with fewer than 2 or more than 4 consonants are rejected: 1-consonant
 *    "roots" would group thousands of unrelated words, 5+ are loans or compounds.
 *
 * Output format: upper-case consonants joined with dashes, e.g. `F-S`, `Ṣ-B-R`.
 * This file must stay dependency-free: it is also imported by Node scripts.
 */

export const ROOT_LEXICAL_POS = ['noun', 'adjective', 'verb'];

const VOWELS = new Set(['a', 'e', 'i', 'u', 'o']);
const NOMINAL_POS = new Set(['noun', 'adjective']);

export function estimateRoot(latin: string | null | undefined, partOfSpeech?: string | null): string | null {
  if (!latin) return null;
  const pos = (partOfSpeech ?? '').toLowerCase();
  if (!ROOT_LEXICAL_POS.includes(pos)) return null;

  let word = latin
    .normalize('NFC')
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // optional segments: a(d) -> a
    .split(/[\s/,;]/)[0]
    .replace(/[^a-zčǧḍṭẓḥṣṛɣɛʷ]/g, '')
    .replace(/ʷ/g, '');

  if (word.length < 2) return null;

  if (NOMINAL_POS.has(pos)) {
    const feminine = /^t[aiu]/.test(word) && word.endsWith('t') && word.length > 3;
    word = word.replace(/^t?[aiu]/, '');
    if (feminine) word = word.slice(0, -1);
  }

  const skeleton: string[] = [];
  for (const ch of word) {
    if (VOWELS.has(ch)) continue;
    if (skeleton[skeleton.length - 1] === ch) continue; // collapse gemination
    skeleton.push(ch);
  }

  if (skeleton.length < 2 || skeleton.length > 4) return null;
  return skeleton.map((c) => c.toUpperCase()).join('-');
}

/**
 * The naive root the first seeding run produced (vowels stripped, no morphology
 * handling, capped at 10 chars, no separators). Kept only so the backfill script can
 * recognise — and safely replace — roots it generated itself without ever touching
 * a root a human typed in.
 */
export function legacyNaiveRoot(latin: string | null | undefined): string {
  if (!latin) return '';
  const clean = latin.replace(/[^a-zčǧḍṭẓḥṣṛɣɛ]/gi, '');
  return clean.replace(/[aeiu]/gi, '').toUpperCase().slice(0, 10);
}
