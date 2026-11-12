import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';
import { latinToTifinagh, containsTifinagh } from './amazigh';

export type SearchMatchType = 'headword' | 'fuzzy' | 'inflected' | 'root' | 'meaning' | string;

export interface DictionarySearchResult {
  id: number;
  slug: string;
  headword_text: string;
  script_tifinagh: string | null;
  script_arabic: string | null;
  match_type: SearchMatchType;
  match_preview: string;
  similarity: number;
  part_of_speech: string | null;
  root: string | null;
}

/**
 * Parses root search syntax:
 *   "√fs" -> "F-S"
 *   "root:f-s" -> "F-S"
 *   "root:fs" -> "F-S"
 *   "f-s" -> "F-S"
 */
export function parseRootQuery(term: string): string | null {
  const clean = term.trim();
  const prefixMatch = clean.match(/^(?:√|root:)\s*([^\s-](?:-?[^\s-]){1,3})$/i);
  if (prefixMatch) {
    const raw = prefixMatch[1].replace(/-/g, '').toUpperCase();
    if (raw.length >= 2 && raw.length <= 4) {
      return raw.split('').join('-');
    }
  }
  const dashMatch = clean.match(/^[^\s-]{1,2}(?:-[^\s-]{1,2}){1,3}$/);
  if (dashMatch) {
    return clean.toUpperCase();
  }
  return null;
}

/**
 * Generates an instant Tifinagh script preview when the user is typing in Latin
 * (and not using root syntax). Returns null if the query is already Tifinagh/Arabic
 * or too short.
 */
export function getQueryTifinaghPreview(term: string): string | null {
  const clean = term.trim();
  if (clean.length < 2) return null;
  if (containsTifinagh(clean) || /[\u0600-\u06FF]/.test(clean)) return null;
  if (parseRootQuery(clean)) return null;
  // Only preview single-word or short Amazigh-looking queries containing Latin letters
  if (!/^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFFɣɛčǧḍṭẓḥṣṛʷ3\s'-]+$/.test(clean)) return null;
  const tif = latinToTifinagh(clean);
  return containsTifinagh(tif) ? tif : null;
}

/**
 * Calls `search_dictionary(term, max_results)` (v2), transparently falling back to
 * the v1 1-arg signature + lightweight root lookup if the v2 migration is not yet applied.
 */
export async function searchDictionary(
  supabase: SupabaseClient<Database>,
  term: string,
  maxResults = 12
): Promise<{ results: DictionarySearchResult[]; usedV2: boolean; error: string | null }> {
  const clean = term.trim();
  if (!clean) {
    return { results: [], usedV2: true, error: null };
  }

  const v2 = await supabase.rpc('search_dictionary', {
    term: clean,
    max_results: maxResults
  });

  if (!v2.error && v2.data) {
    return {
      results: (v2.data as unknown as DictionarySearchResult[]).map((row) => ({
        ...row,
        part_of_speech: row.part_of_speech ?? null,
        root: row.root ?? null,
        match_preview: row.match_preview ?? ''
      })),
      usedV2: true,
      error: null
    };
  }

  // Fallback for environments before 20261112120000_search_engine_v2.sql is applied
  const rootQuery = parseRootQuery(clean);
  const [v1, rootFallback] = await Promise.all([
    supabase.rpc('search_dictionary', { term: clean } as unknown as {
      term: string;
      max_results?: number;
    }),
    rootQuery
      ? supabase
          .from('definitions')
          .select(
            'definition_text, attributes, headwords!inner(id, slug, script_latin, script_tifinagh, script_arabic)'
          )
          .eq('attributes->>root', rootQuery)
          .limit(maxResults)
      : Promise.resolve({ data: null, error: null })
  ]);

  const byId = new Map<number, DictionarySearchResult>();

  if (rootFallback.data && rootQuery) {
    for (const row of rootFallback.data as unknown as Array<{
      definition_text: string;
      attributes: Record<string, string> | null;
      headwords: {
        id: number;
        slug: string;
        script_latin: string | null;
        script_tifinagh: string | null;
        script_arabic: string | null;
      };
    }>) {
      const hw = row.headwords;
      if (!hw || byId.has(hw.id)) continue;
      byId.set(hw.id, {
        id: hw.id,
        slug: hw.slug,
        headword_text: hw.script_latin ?? hw.slug,
        script_tifinagh: hw.script_tifinagh,
        script_arabic: hw.script_arabic,
        match_type: 'root',
        match_preview: row.definition_text,
        similarity: 0.72,
        part_of_speech: row.attributes?.part_of_speech ?? null,
        root: row.attributes?.root ?? rootQuery
      });
    }
  }

  if (v1.data) {
    for (const row of v1.data as unknown as DictionarySearchResult[]) {
      if (!byId.has(row.id)) {
        byId.set(row.id, {
          ...row,
          part_of_speech: row.part_of_speech ?? null,
          root: row.root ?? null,
          match_preview: row.match_preview ?? ''
        });
      }
    }
  }

  const results = Array.from(byId.values()).slice(0, maxResults);
  return {
    results,
    usedV2: false,
    error: v1.error?.message ?? null
  };
}
