import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { createServerClient } from '@supabase/ssr';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import { setLocale } from '$lib/paraglide/runtime';
import type { Database } from '$lib/database.types';

export const handleSupabase: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return event.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => event.cookies.set(name, value, { ...options, path: '/' }));
      }
    }
  });

  event.locals.safeGetSession = async () => {
    const {
      data: { session }
    } = await event.locals.supabase.auth.getSession();

    if (!session) {
      return { session: null, user: null, role: null };
    }

    const {
      data: { user },
      error
    } = await event.locals.supabase.auth.getUser();

    if (error || !user) {
      return { session: null, user: null, role: null };
    }

    const { data: profile } = await event.locals.supabase.from('profiles').select('role').eq('id', user.id).single();

    return { session, user, role: (profile?.role as 'admin' | 'user' | 'moderator' | 'instructor' | null) ?? null };
  };

  const { session, user, role } = await event.locals.safeGetSession();

  event.locals.session = session;
  event.locals.user = user;
  event.locals.role = role; // Store role in locals for easy access

  if (event.url.pathname.startsWith('/admin') && role !== 'admin' && role !== 'instructor') {
    return new Response('Forbidden', { status: 403 });
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};

const handleParaglide: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request, locale }) => {
    setLocale(locale);

    event.request = request;
    event.url = new URL(request.url);
    event.locals.paraglide = { lang: locale };

    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
    });
  });

export const handle: Handle = sequence(handleParaglide, handleSupabase);
