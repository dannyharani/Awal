import { fail } from '@sveltejs/kit';

export const load = async ({ locals: { supabase } }) => {
  const { data: courses, error } = await supabase
    .from('courses')
    .select(
      `
      *,
      dialects ( id, name ),
      creator:profiles!courses_creator_id_fkey ( username ),
      modules ( id, lessons ( id ) )
    `
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading studio courses:', error);
  }

  return {
    courses: courses ?? []
  };
};

export const actions = {
  reorderCourses: async ({ request, locals: { supabase, user, role } }) => {
    if (!user || (role !== 'admin' && role !== 'instructor')) {
      return fail(403, { message: 'Forbidden' });
    }

    const formData = await request.formData();
    const orderJson = String(formData.get('order_json') || '[]');

    try {
      const orderedIds: number[] = JSON.parse(orderJson);
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase
            .from('courses')
            .update({ sort_order: index + 1 })
            .eq('id', id)
        )
      );
      return { success: true };
    } catch (err) {
      console.error('Reorder courses error:', err);
      return fail(400, { message: 'Invalid course order payload' });
    }
  },

  togglePublish: async ({ request, locals: { supabase, user, role } }) => {
    if (!user || (role !== 'admin' && role !== 'instructor')) {
      return fail(403, { message: 'Forbidden' });
    }

    const formData = await request.formData();
    const courseId = Number(formData.get('course_id'));
    const nextState = formData.get('is_published') === 'true';

    const { error } = await supabase
      .from('courses')
      .update({ is_published: nextState, updated_at: new Date().toISOString() })
      .eq('id', courseId);

    if (error) return fail(500, { message: error.message });
    return { success: true };
  },

  deleteCourse: async ({ request, locals: { supabase, user, role } }) => {
    if (!user || (role !== 'admin' && role !== 'instructor')) {
      return fail(403, { message: 'Forbidden' });
    }

    const formData = await request.formData();
    const courseId = Number(formData.get('course_id'));

    const { error } = await supabase.from('courses').delete().eq('id', courseId);
    if (error) return fail(500, { message: error.message });
    return { success: true };
  }
};
