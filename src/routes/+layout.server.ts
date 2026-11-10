import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({
  locals: { safeGetSession, supabase, paraglide },
  cookies
}) => {
  const { session, user, role } = await safeGetSession();
  let username: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();
    username = profile?.username ?? null;
  }

  return {
    session,
    user,
    role,
    username,
    cookies: cookies.getAll(),
    lang: paraglide?.lang ?? 'en'
  };
};
