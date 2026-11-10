import { error as svelteError } from '@sveltejs/kit';

export const load = async ({ params, locals: { supabase, user, role } }) => {
  const { slug } = params;

  const { data: course, error } = await supabase
    .from('courses')
    .select(
      `
      *,
      dialects ( id, name ),
      creator:profiles!courses_creator_id_fkey ( username, avatar_url, role ),
      modules (
        id,
        title,
        sort_order,
        lessons (
          id,
          title,
          sort_order,
          steps ( id, step_type )
        )
      )
    `
    )
    .eq('slug', slug)
    .order('sort_order', { referencedTable: 'modules', ascending: true })
    .order('sort_order', { referencedTable: 'modules.lessons', ascending: true })
    .single();

  if (error || !course) {
    throw svelteError(404, 'Course not found');
  }

  let completedLessonIds: number[] = [];
  if (user) {
    const { data: completed } = await supabase
      .from('completed_lessons')
      .select('lesson_id')
      .eq('user_id', user.id);

    completedLessonIds = (completed ?? [])
      .map((c: { lesson_id: number | null }) => c.lesson_id)
      .filter((id): id is number => typeof id === 'number');
  }

  return {
    course,
    completedLessonIds,
    canEdit: role === 'admin' || role === 'instructor'
  };
};
