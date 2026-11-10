export const load = async ({ url, locals: { supabase } }) => {
  const letterFilter = url.searchParams.get('letter')?.trim() || null;
  const dialectFilter = url.searchParams.get('dialect')
    ? Number(url.searchParams.get('dialect'))
    : null;

  // Run core queries in parallel
  const [randomReq, recentReq, statsReq, dialectsReq, allWordsReq] = await Promise.all([
    supabase.rpc('get_random_word').single(),

    supabase
      .from('headwords')
      .select('id, slug, script_latin, script_tifinagh, created_at, definitions(count)')
      .order('created_at', { ascending: false })
      .limit(6),

    supabase.rpc('get_dictionary_stats').single(),

    supabase.from('dialects').select('id, name').order('name'),

    supabase
      .from('headwords')
      .select('id, slug, script_latin, script_tifinagh, definitions(id, dialect_id, definition_text)')
      .order('script_latin', { ascending: true })
      .limit(100)
  ]);

  const allWords = (allWordsReq.data ?? []) as Array<{
    id: number;
    slug: string;
    script_latin: string;
    script_tifinagh: string | null;
    definitions: Array<{ id: number; dialect_id: number | null; definition_text: string }>;
  }>;

  // Filter words if letter or dialect filter is active
  const browsedWords = allWords.filter((w) => {
    if (letterFilter) {
      const firstChar = w.script_latin.trim().charAt(0).toUpperCase();
      if (firstChar !== letterFilter.toUpperCase()) return false;
    }
    if (dialectFilter) {
      const hasDialect = w.definitions?.some((d) => d.dialect_id === dialectFilter);
      if (!hasDialect) return false;
    }
    return true;
  });

  // Words needing definitions or Tifinagh script
  const wordsNeedingHelp = allWords
    .filter((w) => !w.definitions || w.definitions.length === 0 || !w.script_tifinagh)
    .slice(0, 6);

  return {
    wordOfTheDay: randomReq.data as {
      slug: string;
      script_latin: string;
      script_tifinagh: string | null;
    } | null,
    recentWords: (recentReq.data ?? []) as Array<{
      id: number;
      slug: string;
      script_latin: string;
      script_tifinagh: string | null;
      created_at: string;
      definitions: Array<{ count: number }>;
    }>,
    stats: (statsReq.data ?? { total_words: 0, total_definitions: 0 }) as {
      total_words: number;
      total_definitions: number;
    },
    dialects: dialectsReq.data ?? [],
    browsedWords,
    wordsNeedingHelp,
    activeLetter: letterFilter,
    activeDialect: dialectFilter
  };
};
