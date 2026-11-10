import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { settingsSchema } from '$lib/schemas';
import { cookieName, cookieMaxAge } from '$lib/paraglide/runtime';

export const load = async ({ locals: { supabase, user } }) => {
  if (!user) throw redirect(302, '/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (!profile) throw redirect(302, '/login');

  const form = await superValidate(zod4(settingsSchema));
  form.data.preferred_locale = profile.preferred_locale;

  return { form, profile };
};

export const actions = {
  updatePreferences: async ({ request, cookies, locals: { supabase, user } }) => {
    const form = await superValidate(request, zod4(settingsSchema));

    if (!user) return fail(401, { form });
    if (!form.valid) return fail(400, { form });

    const { preferred_locale } = form.data;

    const { error } = await supabase
      .from('profiles')
      .update({ preferred_locale })
      .eq('id', user.id);

    if (error) {
      return message(form, 'Failed to update settings.', { status: 500 });
    }

    cookies.set(cookieName, preferred_locale, {
      path: '/',
      maxAge: cookieMaxAge,
      httpOnly: false,
      sameSite: 'lax'
    });

    return message(form, 'Preferences saved.');
  }
};
