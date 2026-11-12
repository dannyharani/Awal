import { describe, expect, it } from 'vitest';
import { parseRootQuery, getQueryTifinaghPreview } from './search';

describe('search helpers', () => {
  it('parses consonantal root query formats', () => {
    expect(parseRootQuery('√fs')).toBe('F-S');
    expect(parseRootQuery('root:zdm')).toBe('Z-D-M');
    expect(parseRootQuery('root: F-S')).toBe('F-S');
    expect(parseRootQuery('b-d-r')).toBe('B-D-R');
    expect(parseRootQuery('asafu')).toBeNull();
    expect(parseRootQuery('√a')).toBeNull();
  });

  it('produces Tifinagh preview only for Latin queries', () => {
    expect(getQueryTifinaghPreview('asafu')).toBe('ⴰⵙⴰⴼⵓ');
    expect(getQueryTifinaghPreview('aghrum')).toBe('ⴰⵖⵔⵓⵎ');
    expect(getQueryTifinaghPreview('ⴰⵙⴰⴼⵓ')).toBeNull();
    expect(getQueryTifinaghPreview('√fs')).toBeNull();
    expect(getQueryTifinaghPreview('a')).toBeNull();
  });
});
