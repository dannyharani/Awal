import type { LayoutServerLoad } from './$types';
export const load: LayoutServerLoad = async ({ locals: { safeGetSession, paraglide }, cookies }) => {
  const { session, user } = await safeGetSession();
  return {
    session,
    user,
    cookies: cookies.getAll(),
    lang: paraglide?.lang ?? 'en'
  };
};
