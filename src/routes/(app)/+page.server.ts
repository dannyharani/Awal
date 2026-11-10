export const load = async ({ locals: { supabase } }) => {
  // Run these queries in parallel for speed
  const [randomReq, recentReq, statsReq] = await Promise.all([
    supabase.rpc('get_random_word').single(),

    supabase
      .from('headwords')
      .select('slug, script_latin, script_tifinagh, created_at')
      .order('created_at', { ascending: false })
      .limit(6),

    supabase.rpc('get_dictionary_stats').single()
  ]);

  return {
    wordOfTheDay: randomReq.data as { slug: string; script_latin: string; script_tifinagh: string | null } | null,
    recentWords: (recentReq.data ?? []) as Array<{ slug: string; script_latin: string; script_tifinagh: string | null; created_at: string }>,
    stats: (statsReq.data ?? { total_words: 0, total_definitions: 0 }) as { total_words: number; total_definitions: number }
  };
};
