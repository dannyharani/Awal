import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

export interface PlatformStats {
  totalWords: number;
  totalDefinitions: number;
  totalDialects: number;
  totalContributors: number;
  totalCourses: number;
  totalLessons: number;
  totalSteps: number;
  estimatedLearningHours: number;
  totalExamples: number;
  totalAudioClips: number;
  totalVotes: number;
  totalVerifiedDefinitions: number;
}

export async function getPlatformStats(
  supabase: SupabaseClient<Database>
): Promise<PlatformStats> {
  const [
    wordsRes,
    defsRes,
    dialectsRes,
    contributorsRes,
    coursesRes,
    publishedCoursesWithLessons,
    examplesRes,
    audioRes,
    votesRes,
    verifiedRes
  ] = await Promise.all([
    supabase.from('headwords').select('*', { count: 'exact', head: true }),
    supabase.from('definitions').select('*', { count: 'exact', head: true }),
    supabase.from('dialects').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase
      .from('courses')
      .select('id, modules ( id, lessons ( id, steps ( id ) ) )')
      .eq('is_published', true),
    supabase.from('examples').select('*', { count: 'exact', head: true }),
    supabase
      .from('definitions')
      .select('*', { count: 'exact', head: true })
      .not('audio_url', 'is', null),
    supabase.from('votes').select('*', { count: 'exact', head: true }),
    supabase
      .from('definitions')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true)
  ]);

  let totalLessons = 0;
  let totalSteps = 0;
  for (const course of (publishedCoursesWithLessons.data ?? []) as any[]) {
    for (const mod of course.modules ?? []) {
      const lessons = mod.lessons ?? [];
      totalLessons += lessons.length;
      for (const les of lessons) {
        totalSteps += (les.steps ?? []).length;
      }
    }
  }
  // Estimate ~18 mins per lesson + ~4 mins per interactive step, minimum 0.5h if any course content exists
  const rawMinutes = totalLessons * 18 + totalSteps * 4;
  const estimatedLearningHours =
    rawMinutes > 0 ? Math.max(1, Math.round((rawMinutes / 60) * 10) / 10) : 0;

  return {
    totalWords: wordsRes.count ?? 0,
    totalDefinitions: defsRes.count ?? 0,
    totalDialects: dialectsRes.count ?? 0,
    totalContributors: contributorsRes.count ?? 0,
    totalCourses: coursesRes.count ?? 0,
    totalLessons,
    totalSteps,
    estimatedLearningHours,
    totalExamples: examplesRes.count ?? 0,
    totalAudioClips: audioRes.count ?? 0,
    totalVotes: votesRes.count ?? 0,
    totalVerifiedDefinitions: verifiedRes.count ?? 0
  };
}
