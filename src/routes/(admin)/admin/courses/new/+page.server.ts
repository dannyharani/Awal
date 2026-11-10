import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters'; // Note: 'zod4' is alias for 'zod' in newer versions, use whichever works for your version
import { createCourseSchema } from '$lib/schemas';

export const load = async ({ locals: { supabase } }) => {
  // 1. Fetch dialects for the dropdown
  const { data: dialects } = await supabase.from('dialects').select('id, name').order('name');

  // 2. Initialize form
  const form = await superValidate(zod4(createCourseSchema));

  return {
    form,
    dialects: dialects || []
  };
};

export const actions = {
  default: async ({ request, locals: { supabase, safeGetSession } }) => {
    // 1. Check Auth
    const { session } = await safeGetSession();
    if (!session) return fail(401, { message: 'Unauthorized' });

    // 2. Validate Form
    const form = await superValidate(request, zod4(createCourseSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    // 3. Insert into Supabase
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: form.data.title,
        description: form.data.description,
        difficulty_level: form.data.difficulty_level,
        target_dialect_id: form.data.target_dialect_id,
        creator_id: session.user.id,
        is_published: false
      })
      .select('id')
      .single();

    if (error) {
      // Return the form with a status message so data isn't lost
      return message(form, 'Database error: ' + error.message, { status: 500 });
    }

    // 4. Redirect to the Builder
    throw redirect(303, `admin/courses/${data.id}/curriculum`);
  }
};
