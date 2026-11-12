import { describe, it, expect } from 'vitest';
import {
  latinToTifinagh,
  tifinaghToLatin,
  generateWordSlug,
  lookupAmazighGlossary,
  tifinaghBreakdown,
  containsTifinagh
} from './amazigh';

describe('Amazigh utilities', () => {
  it('transliterates Tamazight Latin words into Neo-Tifinagh', () => {
    expect(latinToTifinagh('aman')).toBe('ⴰⵎⴰⵏ');
    expect(latinToTifinagh('Tamaziɣt')).toBe('ⵜⴰⵎⴰⵣⵉⵖⵜ');
    expect(latinToTifinagh('aɣrum')).toBe('ⴰⵖⵔⵓⵎ');
    expect(latinToTifinagh(' azul ')).toBe('ⴰⵣⵓⵍ');
  });

  it('generates URL-safe slugs preserving Amazigh Latin characters', () => {
    expect(generateWordSlug('Aɣrum')).toBe('aɣrum');
    expect(generateWordSlug('Tamaziɣt')).toBe('tamaziɣt');
    expect(generateWordSlug('Aɛrab')).toBe('aɛrab');
    expect(generateWordSlug('  Tafukt n tmeddit  ')).toBe('tafukt-n-tmeddit');
  });

  it('looks up Amazigh glossary terms by Latin or Tifinagh', () => {
    const asafu = lookupAmazighGlossary('Asafu');
    expect(asafu).toBeDefined();
    expect(asafu?.tifinagh).toBe('ⴰⵙⴰⴼⵓ');

    const awal = lookupAmazighGlossary('Awal');
    expect(awal?.tifinagh).toBe('ⴰⵡⴰⵍ');
    expect(awal?.slug).toBe('awal');

    const amezday = lookupAmazighGlossary('ⴰⵎⵣⴷⴰⵢ');
    expect(amezday?.word).toBe('Amezday');
  });

  it('breaks Neo-Tifinagh words into character-by-character phonetic tokens', () => {
    expect(containsTifinagh('ⴰⵙⴰⴼⵓ')).toBe(true);
    expect(containsTifinagh('asafu')).toBe(false);

    const tokens = tifinaghBreakdown('ⴰⵙⴰⴼⵓ');
    expect(tokens.map((t) => t.latin).join('')).toBe('asafu');
    expect(tokens.every((t) => t.isTifinagh)).toBe(true);

    const phrase = tifinaghBreakdown('ⵜⴰⵎⴰⵣⵉⵖⵜ ⵏ');
    expect(phrase.filter((t) => t.isTifinagh).map((t) => t.latin).join('')).toBe('tamaziɣtn');
    expect(tifinaghToLatin('ⴰⵎⴷⵓⵢ')).toBe('amduy');
    expect(tifinaghToLatin('ⵉⵖⵔⴰ ⴰⴷⵍⵉⵙ ⴰ')).toBe('iɣra adlis a');
  });
});
