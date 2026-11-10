import { describe, it, expect } from 'vitest';
import { latinToTifinagh, generateWordSlug } from './amazigh';

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
});
