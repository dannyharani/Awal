export const load = async ({ locals: { supabase, user, role } }) => {
  const [coursesReq, dialectsReq, enrollmentsReq, completedReq] = await Promise.all([
    supabase
      .from('courses')
      .select(
        `
        *,
        dialects ( id, name ),
        creator:profiles!courses_creator_id_fkey ( username, avatar_url ),
        modules ( id, title, sort_order, lessons ( id, title, sort_order ) )
      `
      )
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),

    supabase.from('dialects').select('id, name').order('name'),

    user
      ? supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
      : Promise.resolve({ data: [] }),

    user
      ? supabase
          .from('completed_lessons')
          .select('lesson_id')
          .eq('user_id', user.id)
      : Promise.resolve({ data: [] })
  ]);

  const completedLessonIds = new Set(
    (completedReq.data ?? [])
      .map((c: { lesson_id: number | null }) => c.lesson_id)
      .filter((id): id is number => typeof id === 'number')
  );

  return {
    courses: coursesReq.data ?? [],
    dialects: dialectsReq.data ?? [],
    enrollments: enrollmentsReq.data ?? [],
    completedLessonIds: Array.from(completedLessonIds),
    canAccessStudio: role === 'admin' || role === 'instructor'
  };
};
