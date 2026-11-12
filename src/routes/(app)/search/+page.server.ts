import type { PageServerLoad } from './$types';
import { searchDictionary, getQueryTifinaghPreview, parseRootQuery } from '$lib/utils/search';
import { lookupAmazighGlossary } from '$lib/utils/amazigh';

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
  const q = url.searchParams.get('q')?.trim() ?? '';
  const typeFilter = url.searchParams.get('type')?.trim() || 'all';
  const posFilter = url.searchParams.get('pos')?.trim() || 'all';

  if (!q) {
    return {
      query: '',
      results: [],
      tifinaghPreview: null,
      rootQuery: null,
      glossary: null,
      usedV2: true,
      typeFilter,
      posFilter
    };
  }

  const { results, usedV2 } = await searchDictionary(supabase, q, 45);
  const glossary = lookupAmazighGlossary(q) ?? null;

  return {
    query: q,
    results,
    tifinaghPreview: getQueryTifinaghPreview(q),
    rootQuery: parseRootQuery(q),
    glossary,
    usedV2,
    typeFilter,
    posFilter
  };
};
