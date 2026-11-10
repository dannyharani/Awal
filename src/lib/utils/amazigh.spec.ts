import { describe, it, expect } from 'vitest';
import { latinToTifinagh, generateWordSlug, lookupAmazighGlossary } from './amazigh';

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
    const awal = lookupAmazighGlossary('Awal');
    expect(awal?.tifinagh).toBe('ⴰⵡⴰⵍ');
    expect(awal?.slug).toBe('awal');

    const amezday = lookupAmazighGlossary('ⴰⵎⵣⴷⴰⵢ');
    expect(amezday?.word).toBe('Amezday');
  });
});
