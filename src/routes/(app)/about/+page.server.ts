import { getPlatformStats } from '$lib/server/stats';

export const load = async ({ locals: { supabase } }) => {
  const [platformStats, dialectsRes] = await Promise.all([
    getPlatformStats(supabase),
    supabase
      .from('dialects')
      .select('id, name, region_description, definitions(count)')
      .order('name')
  ]);

  return {
    platformStats,
    dialects: (dialectsRes.data ?? []) as unknown as Array<{
      id: number;
      name: string;
      region_description: string | null;
      definitions: Array<{ count: number }>;
    }>
  };
};
