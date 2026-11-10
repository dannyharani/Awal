import { error as svelteError, fail } from '@sveltejs/kit';

export const load = async ({ params, locals: { supabase, user } }) => {
  const { slug, lessonId } = params;

  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .select(
      `
      id,
      title,
      slug,
      modules (
        id,
        title,
        sort_order,
        lessons ( id, title, sort_order )
      )
    `
    )
    .eq('slug', slug)
    .order('sort_order', { referencedTable: 'modules', ascending: true })
    .order('sort_order', { referencedTable: 'modules.lessons', ascending: true })
    .single();

  if (courseErr || !course) {
    throw svelteError(404, 'Course not found');
  }

  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .select(
      `
      *,
      steps (
        *,
        headword:headwords!steps_linked_headword_id_fkey (
          id,
          slug,
          script_latin,
          script_tifinagh,
          definitions ( id, definition_text, audio_url, attributes )
        )
      )
    `
    )
    .eq('id', Number(lessonId))
    .order('sort_order', { referencedTable: 'steps', ascending: true })
    .single();

  if (lessonErr || !lesson) {
    throw svelteError(404, 'Lesson not found');
  }

  // Compute flat ordered list of lessons to determine prev/next lesson
  const flatLessons: Array<{ id: number; title: string }> = [];
  for (const mod of course.modules ?? []) {
    for (const les of mod.lessons ?? []) {
      flatLessons.push({ id: les.id, title: les.title });
    }
  }

  const currentIdx = flatLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIdx > 0 ? flatLessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx >= 0 && currentIdx < flatLessons.length - 1 ? flatLessons[currentIdx + 1] : null;

  let isCompleted = false;
  if (user) {
    const { data: comp } = await supabase
      .from('completed_lessons')
      .select('id')
      .eq('user_id', user.id)
      .eq('lesson_id', lesson.id)
      .maybeSingle();
    isCompleted = Boolean(comp);
  }

  return {
    course,
    lesson,
    prevLesson,
    nextLesson,
    isCompleted,
    user
  };
};

export const actions = {
  completeLesson: async ({ params, locals: { supabase, user } }) => {
    if (!user) {
      return fail(401, { message: 'Sign in to save your progress and earn XP.' });
    }

    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', params.slug)
      .single();

    if (!course) return fail(404, { message: 'Course not found' });

    const { data: result, error } = await supabase.rpc('complete_lesson', {
      p_course_id: course.id,
      p_lesson_id: Number(params.lessonId)
    });

    if (error) {
      console.error('complete_lesson RPC error:', error);
      return fail(500, { message: 'Failed to save lesson progress' });
    }

    return {
      completed: true,
      result
    };
  }
};
