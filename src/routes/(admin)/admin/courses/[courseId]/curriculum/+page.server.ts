import { fail } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
// Import your schemas
import { createModuleSchema, createLessonSchema } from '$lib/schemas'; // Make sure to export createModuleSchema in schemas.ts too if you haven't

export const load = async ({ params, locals: { supabase } }) => {
  const { courseId } = params;

  // 1. Fetch Course Hierarchy (Same as before)
  const { data: course, error } = await supabase
    .from('courses')
    .select(
      `
      *,
      modules (
        id, 
        title, 
        sort_order,
        lessons ( id, title, sort_order, steps ( id ) )
      )
    `
    )
    .eq('id', Number(courseId))
    .order('sort_order', { referencedTable: 'modules', ascending: true })
    .order('sort_order', { referencedTable: 'modules.lessons', ascending: true })
    .single();

  if (error || !course) throw new Error('Course not found');

  // 2. Init Forms
  // We give them specific IDs so Superforms doesn't get confused
  const moduleForm = await superValidate(zod4(createModuleSchema), { id: 'createModule' });
  const lessonForm = await superValidate(zod4(createLessonSchema), { id: 'createLesson' });

  return { course, moduleForm, lessonForm };
};

export const actions = {
  createModule: async ({ request, params, locals: { supabase } }) => {
    const form = await superValidate(request, zod4(createModuleSchema));
    if (!form.valid) return fail(400, { form });

    const { count } = await supabase
      .from('modules')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', Number(params.courseId));

    const { error } = await supabase.from('modules').insert({
      course_id: parseInt(params.courseId),
      title: form.data.title,
      sort_order: (count || 0) + 1
    });

    if (error) return message(form, error.message, { status: 500 });
    return { form };
  },

  createLesson: async ({ request, locals: { supabase } }) => {
    const form = await superValidate(request, zod4(createLessonSchema));
    if (!form.valid) return fail(400, { form });

    const { count } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('module_id', form.data.module_id);

    const { error } = await supabase.from('lessons').insert({
      module_id: form.data.module_id,
      title: form.data.title,
      sort_order: (count || 0) + 1
    });

    if (error) return message(form, error.message, { status: 500 });

    return { lessonForm: form };
  }
};
