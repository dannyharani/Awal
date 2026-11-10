import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const [profilesRes, defsRes, examplesRes, completedRes] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, username, first_name, last_name, bio, avatar_url, role, reputation_points, created_at'
      )
      .order('reputation_points', { ascending: false, nullsFirst: false })
      .limit(100),
    supabase.from('definitions').select('user_id'),
    supabase.from('examples').select('user_id'),
    supabase.from('completed_lessons').select('user_id')
  ]);

  const defCountByUser = new Map<string, number>();
  for (const row of defsRes.data ?? []) {
    if (row.user_id) {
      defCountByUser.set(row.user_id, (defCountByUser.get(row.user_id) ?? 0) + 1);
    }
  }

  const exampleCountByUser = new Map<string, number>();
  for (const row of examplesRes.data ?? []) {
    if (row.user_id) {
      exampleCountByUser.set(row.user_id, (exampleCountByUser.get(row.user_id) ?? 0) + 1);
    }
  }

  const lessonCountByUser = new Map<string, number>();
  for (const row of completedRes.data ?? []) {
    if (row.user_id) {
      lessonCountByUser.set(row.user_id, (lessonCountByUser.get(row.user_id) ?? 0) + 1);
    }
  }

  const members = (profilesRes.data ?? []).map((p) => {
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
