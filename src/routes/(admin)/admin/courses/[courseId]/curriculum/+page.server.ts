import { fail, error as svelteError } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createModuleSchema, createLessonSchema } from '$lib/schemas';

export const load = async ({ params, locals: { supabase } }) => {
  const { courseId } = params;

  const [{ data: course, error }, { data: dialects }] = await Promise.all([
    supabase
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
      .single(),
    supabase.from('dialects').select('id, name').order('name')
  ]);

  if (error || !course) throw svelteError(404, 'Course not found');

  const moduleForm = await superValidate(zod4(createModuleSchema), { id: 'createModule' });
  const lessonForm = await superValidate(zod4(createLessonSchema), { id: 'createLesson' });

  return { course, dialects: dialects ?? [], moduleForm, lessonForm };
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
  },

  reorderModules: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const orderJson = String(formData.get('order_json') || '[]');
    try {
      const moduleIds: number[] = JSON.parse(orderJson);
      await Promise.all(
        moduleIds.map((id, index) =>
          supabase
            .from('modules')
            .update({ sort_order: index + 1 })
            .eq('id', id)
        )
      );
      return { success: true };
    } catch {
      return fail(400, { message: 'Invalid module order' });
    }
  },

  reorderLessons: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const moduleId = Number(formData.get('module_id'));
    const orderJson = String(formData.get('order_json') || '[]');
    try {
      const lessonIds: number[] = JSON.parse(orderJson);
      await Promise.all(
        lessonIds.map((id, index) =>
          supabase
            .from('lessons')
            .update({ sort_order: index + 1, module_id: moduleId })
            .eq('id', id)
        )
      );
      return { success: true };
    } catch {
      return fail(400, { message: 'Invalid lesson order' });
    }
  },

  togglePublish: async ({ params, request, locals: { supabase } }) => {
    const formData = await request.formData();
    const nextState = formData.get('is_published') === 'true';

    const { error } = await supabase
      .from('courses')
      .update({ is_published: nextState, updated_at: new Date().toISOString() })
      .eq('id', Number(params.courseId));

    if (error) return fail(500, { message: error.message });
    return { success: true };
  },

  updateCourse: async ({ params, request, locals: { supabase } }) => {
    const formData = await request.formData();
    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const difficulty_level = String(formData.get('difficulty_level') || 'beginner');
    const target_dialect_id = Number(formData.get('target_dialect_id')) || null;
    const instruction_language = String(formData.get('instruction_language') || 'en');
    const category = String(formData.get('category') || 'conversation');
    const rawTags = String(formData.get('tags') || '');
    const tags = rawTags
      ? rawTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    if (title.length < 3) {
      return fail(400, { message: 'Title is too short' });
    }

    const { error } = await supabase
      .from('courses')
      .update({
        title,
        description,
        difficulty_level,
        target_dialect_id,
        instruction_language,
        category,
        tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', Number(params.courseId));

    if (error) return fail(500, { message: error.message });
    return { success: true };
  },

  deleteModule: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const moduleId = Number(formData.get('module_id'));
    const { error } = await supabase.from('modules').delete().eq('id', moduleId);
    if (error) return fail(500, { message: error.message });
    return { success: true };
  },

  deleteLesson: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const lessonId = Number(formData.get('lesson_id'));
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    if (error) return fail(500, { message: error.message });
    return { success: true };
  }
};
