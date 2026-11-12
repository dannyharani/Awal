import { describe, expect, it } from 'vitest';
import { estimateRoot, legacyNaiveRoot } from './amazigh-roots';

describe('estimateRoot', () => {
  it('strips nominal prefixes and the feminine circumfix', () => {
    expect(estimateRoot('afus', 'noun')).toBe('F-S');
    expect(estimateRoot('tafukt', 'noun')).toBe('F-K');
    expect(estimateRoot('amawal', 'noun')).toBe('M-W-L');
  });

  it('keeps verb stems intact and collapses gemination', () => {
    expect(estimateRoot('zdem', 'verb')).toBe('Z-D-M');
    expect(estimateRoot('ṣṣber', 'verb')).toBe('Ṣ-B-R');
  });

  it('rejects ambiguous or non-lexical entries', () => {
    expect(estimateRoot('aba', 'noun')).toBeNull(); // single consonant
    expect(estimateRoot('ddu', 'verb')).toBeNull(); // collapses to one consonant
    expect(estimateRoot('a(d)', 'demonstrative')).toBeNull(); // function word
    expect(estimateRoot('abankryas', 'noun')).toBeNull(); // 5+ consonants: loan
    expect(estimateRoot('', 'noun')).toBeNull();
  });

  it('ignores optional segments and extra tokens', () => {
    expect(estimateRoot('afus (n)', 'noun')).toBe('F-S');
  });
});

describe('legacyNaiveRoot', () => {
  it('reproduces the first-pass seeding formula', () => {
    expect(legacyNaiveRoot('abadir')).toBe('BDR');
    expect(legacyNaiveRoot('tafukt')).toBe('TFKT');
  });
});
