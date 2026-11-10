import { getPlatformStats } from '$lib/server/stats';

export const load = async ({ url, locals: { supabase } }) => {
  const letterFilter = url.searchParams.get('letter')?.trim() || null;
  const dialectFilter = url.searchParams.get('dialect')
    ? Number(url.searchParams.get('dialect'))
    : null;

  const [
    randomReq,
    recentReq,
    platformStats,
    dialectsReq,
    allWordsReq,
    featuredCoursesReq,
    topContributorsReq
  ] = await Promise.all([
    supabase.rpc('get_random_word').single(),

    supabase
      .from('headwords')
      .select(
        'id, slug, script_latin, script_tifinagh, created_at, definitions(id, definition_text, is_verified, dialects(name))'
      )
      .order('created_at', { ascending: false })
      .limit(6),

    getPlatformStats(supabase),

    supabase.from('dialects').select('id, name, region_description').order('name'),

    supabase
      .from('headwords')
      .select(
        'id, slug, script_latin, script_tifinagh, definitions(id, dialect_id, definition_text, is_verified, attributes, dialects(name))'
      )
      .order('script_latin', { ascending: true })
      .limit(120),

    supabase
      .from('courses')
      .select(
        'id, title, slug, description, difficulty_level, category, tags, dialects(name), modules(count)'
      )
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .limit(3),

    supabase
      .from('profiles')
      .select('id, username, first_name, last_name, avatar_url, role, reputation_points')
      .order('reputation_points', { ascending: false, nullsFirst: false })
      .limit(6)
  ]);

  type WordItem = {
    id: number;
    slug: string;
    script_latin: string;
    script_tifinagh: string | null;
    definitions: Array<{
      id: number;
      dialect_id: number | null;
      definition_text: string;
      is_verified: boolean | null;
      attributes: Record<string, unknown> | null;
      dialects: { name: string } | null;
    }>;
  };

  const allWords = (allWordsReq.data ?? []) as unknown as WordItem[];

  // Filter words if letter or dialect filter is active
  const browsedWords = allWords.filter((w) => {
    if (letterFilter) {
      const firstChar = (w.script_latin ?? '').trim().charAt(0).toUpperCase();
      if (firstChar !== letterFilter.toUpperCase()) return false;
    }
    if (dialectFilter) {
      const hasDialect = w.definitions?.some((d) => d.dialect_id === dialectFilter);
      if (!hasDialect) return false;
    }
    return true;
  });

  // Enrich wordOfTheDay with definition and dialect details if available
  const rawRandom = randomReq.data as {
    id?: number;
    slug: string;
    script_latin: string;
    script_tifinagh: string | null;
  } | null;

  const matchedWordOfTheDay = rawRandom
    ? allWords.find((w) => w.slug === rawRandom.slug) ?? {
        id: rawRandom.id ?? 0,
        slug: rawRandom.slug,
        script_latin: rawRandom.script_latin,
        script_tifinagh: rawRandom.script_tifinagh,
        definitions: []
      }
    : allWords[0] ?? null;

  // Categorized Contribution & Verification Queues
  const wordsNeedingDefinition = allWords
    .filter((w) => !w.definitions || w.definitions.length === 0)
    .slice(0, 6);

  const wordsNeedingTifinagh = allWords.filter((w) => !w.script_tifinagh).slice(0, 6);

  const wordsNeedingVerification = allWords
    .filter(
      (w) =>
        w.definitions &&
        w.definitions.length > 0 &&
        w.definitions.some((d) => !d.is_verified)
    )
    .slice(0, 6);

  const wordsNeedingHelp = allWords
    .filter(
      (w) =>
        !w.definitions ||
        w.definitions.length === 0 ||
        !w.script_tifinagh ||
        w.definitions.some((d) => !d.is_verified)
    )
    .slice(0, 6);

  return {
    wordOfTheDay: matchedWordOfTheDay,
    allWordsPool: allWords.slice(0, 40),
    recentWords: (recentReq.data ?? []) as unknown as Array<{
      id: number;
      slug: string;
      script_latin: string;
      script_tifinagh: string | null;
      created_at: string;
      definitions: Array<{
        id: number;
        definition_text: string;
        is_verified: boolean | null;
        dialects: { name: string } | null;
      }>;
    }>,
    platformStats,
    dialects: dialectsReq.data ?? [],
    browsedWords,
    wordsNeedingHelp,
    wordsNeedingDefinition,
    wordsNeedingTifinagh,
    wordsNeedingVerification,
    featuredCourses: (featuredCoursesReq.data ?? []) as unknown as Array<{
      id: number;
      title: string;
      slug: string;
      description: string | null;
      difficulty_level: string | null;
      category: string;
      tags: string[];
      dialects: { name: string } | null;
      modules: Array<{ count: number }>;
    }>,
    topContributors: topContributorsReq.data ?? [],
    activeLetter: letterFilter,
    activeDialect: dialectFilter
  };
};
