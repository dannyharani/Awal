import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { createCourseSchema } from '$lib/schemas';
import { generateWordSlug } from '$lib/utils/amazigh';

export const load = async ({ locals: { supabase } }) => {
  const { data: dialects } = await supabase.from('dialects').select('id, name').order('name');
  const form = await superValidate(zod4(createCourseSchema));

  return {
    form,
    dialects: dialects || []
  };
};

export const actions = {
  default: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession();
    if (!session) return fail(401, { message: 'Unauthorized' });

    const form = await superValidate(request, zod4(createCourseSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    const baseSlug = generateWordSlug(form.data.title) || 'course';
    const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

    const { count } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: form.data.title,
        slug,
        description: form.data.description,
        difficulty_level: form.data.difficulty_level,
        target_dialect_id: form.data.target_dialect_id,
        instruction_language: form.data.instruction_language || 'en',
        creator_id: session.user.id,
        is_published: false,
        sort_order: (count || 0) + 1
      })
      .select('id')
      .single();

    if (error) {
      return message(form, 'Database error: ' + error.message, { status: 500 });
    }

    throw redirect(303, `/admin/courses/${data.id}/curriculum`);
  }
};
