import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { headwordSchema } from '$lib/schemas';

export const load = async ({ url, locals: { user } }) => {
  // 1. Auth Check
  if (!user) throw redirect(302, '/login');

  // 2. Pre-fill from URL (if coming from Search Bar)
  const term = url.searchParams.get('term') || '';
  const form = await superValidate(zod4(headwordSchema));

  if (term) {
    form.data.script_latin = term;
  }

  return { form };
};

export const actions = {
  default: async ({ request, locals: { supabase, user } }) => {
    const form = await superValidate(request, zod4(headwordSchema));

    if (!user) return fail(401, { form });
    if (!form.valid) return fail(400, { form });

    const { script_latin, script_tifinagh, script_arabic } = form.data;

    // Generate Slug
    const slug = script_latin.toLowerCase().trim().replace(/\s+/g, '-');

    // Insert Headword
    const { error } = await supabase.from('headwords').insert({
      slug,
      script_latin,
      script_tifinagh: script_tifinagh || null,
      script_arabic: script_arabic || null
    });

    if (error) {
      if (error.code === '23505') {
        // 400 Bad Request for duplicates
        return message(form, 'This word already exists in the dictionary.', {
          status: 400
        });
      }
      return message(form, 'Database error. Please try again.', {
        status: 500
      });
    }

    // SUCCESS: Do NOT redirect. Return the form with a success message.
    return message(form, {
      text: 'Word created successfully!',
      slug: slug
    });
  }
};
