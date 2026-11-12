import type { PageServerLoad } from './$types';
import { SYSTEM_USERNAMES } from '$lib/constants';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const profilesRes = await supabase
    .from('profiles')
    .select(
      'id, username, first_name, last_name, bio, avatar_url, role, reputation_points, created_at'
    )
    .order('reputation_points', { ascending: false, nullsFirst: false })
    .limit(100);

  // Automated import accounts own tens of thousands of rows; never rank them as community members.
  const profiles = (profilesRes.data ?? []).filter(
    (p) => !(SYSTEM_USERNAMES as readonly string[]).includes(p.username)
  );

  const defCountByUser = new Map<string, number>();
  const exampleCountByUser = new Map<string, number>();
  const lessonCountByUser = new Map<string, number>();

  // Preferred: one aggregate query (PostgREST caps plain selects at 1,000 rows, which would
  // silently under-count on a large dictionary). Provided by the search_engine_v2 migration.
  const countsRes = await supabase.rpc('get_contribution_counts');

  if (!countsRes.error && countsRes.data) {
    for (const row of countsRes.data) {
      defCountByUser.set(row.user_id, Number(row.definitions_count));
      exampleCountByUser.set(row.user_id, Number(row.examples_count));
      lessonCountByUser.set(row.user_id, Number(row.lessons_completed));
    }
  } else {
    // Fallback until the migration is applied: count rows per listed member individually.
    await Promise.all(
      profiles.map(async (p) => {
        const [d, e, l] = await Promise.all([
          supabase.from('definitions').select('*', { count: 'exact', head: true }).eq('user_id', p.id),
          supabase.from('examples').select('*', { count: 'exact', head: true }).eq('user_id', p.id),
          supabase.from('completed_lessons').select('*', { count: 'exact', head: true }).eq('user_id', p.id)
        ]);
        defCountByUser.set(p.id, d.count ?? 0);
        exampleCountByUser.set(p.id, e.count ?? 0);
        lessonCountByUser.set(p.id, l.count ?? 0);
      })
    );
  }

  const members = profiles.map((p) => {
    const definitionsCount = defCountByUser.get(p.id) ?? 0;
    const examplesCount = exampleCountByUser.get(p.id) ?? 0;
    const lessonsCompletedCount = lessonCountByUser.get(p.id) ?? 0;
    return {
      ...p,
      reputation_points: p.reputation_points ?? 0,
      definitionsCount,
      examplesCount,
      lessonsCompletedCount,
      totalContributions: definitionsCount + examplesCount
    };
  });

  return {
    members
  };
};
