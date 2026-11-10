import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { headwordSchema } from '$lib/schemas';
import { generateWordSlug, latinToTifinagh } from '$lib/utils/amazigh';

export const load = async ({ url, locals: { user } }) => {
  // 1. Auth Check
  if (!user) throw redirect(302, '/login');

  // 2. Pre-fill from URL (if coming from Search Bar or /word/ not-found page)
  const term = url.searchParams.get('term') || url.searchParams.get('word') || '';
  const tifinagh = url.searchParams.get('tifinagh') || '';
  const form = await superValidate(zod4(headwordSchema));

  if (term) {
    form.data.script_latin = term;
  }
  if (tifinagh) {
    form.data.script_tifinagh = tifinagh;
  } else if (term) {
    form.data.script_tifinagh = latinToTifinagh(term);
  }

  return { form };
};

export const actions = {
  default: async ({ request, locals: { supabase, user } }) => {
    const form = await superValidate(request, zod4(headwordSchema));

    if (!user) return fail(401, { form });
    if (!form.valid) return fail(400, { form });

    const { script_latin, script_tifinagh, script_arabic } = form.data;

    // Generate Slug consistently with client preview
    const slug = generateWordSlug(script_latin);
    if (!slug) {
      return message(form, 'Please provide a valid Latin script word.', { status: 400 });
    }

    // Insert Headword
    const { error } = await supabase.from('headwords').insert({
      slug,
      script_latin: script_latin.trim(),
      script_tifinagh: script_tifinagh?.trim() || null,
      script_arabic: script_arabic?.trim() || null
    });

    if (error) {
      if (error.code === '23505') {
        return message(form, 'This word already exists in the dictionary.', {
          status: 400
        });
      }
      return message(form, 'Database error. Please try again.', {
        status: 500
      });
    }

    return message(form, {
      text: 'Word created successfully!',
      slug: slug
    });
  }
};
