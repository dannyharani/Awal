import { error } from '@sveltejs/kit';

export const load = async ({ params, locals: { supabase } }) => {
  const { username } = params;

  // 1. Get the Profile ID from the Username
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, bio, avatar_url, role, reputation_points, created_at')
    .eq('username', username)
    .single();

  if (profileError || !profile) {
    throw error(404, 'User not found');
  }

  // 2. Fetch Stats & Recent Activity in parallel
  const [statsReq, activityReq] = await Promise.all([
    supabase.rpc('get_user_profile_stats', { target_user_id: profile.id }).single(),

    supabase
      .from('definitions')
      .select(
        `
                id,
                definition_text,
                vote_score,
                created_at,
                headword:headwords (slug, script_latin, script_tifinagh),
                dialect:dialects (name)
            `
      )
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10)
  ]);

  return {
    profile,
    stats: (statsReq.data ?? { definition_count: 0, total_upvotes: 0, reputation_score: 0 }) as { definition_count: number; total_upvotes: number; reputation_score: number },
    contributions: (activityReq.data ?? []) as any
  };
};
