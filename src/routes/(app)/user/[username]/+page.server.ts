import { error, fail } from '@sveltejs/kit';

export const load = async ({ params, locals: { supabase, role, user } }) => {
  const { username } = params;

  // 1. Get the Profile ID from the Username
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, bio, avatar_url, role, reputation_points, created_at, is_blocked')
    .eq('username', username)
    .single();

  if (profileError || !profile) {
    throw error(404, 'User not found');
  }

  // 2. Fetch Stats & Recent Activity in parallel
  const [statsReq, activityReq] = await Promise.all([
    supabase.rpc('get_user_profile_stats', { target_user_id: profile.id }).single(),

    supabase
      .from('definitions')
      .select(
        `
                id,
                definition_text,
                vote_score,
                created_at,
                headword:headwords (slug, script_latin, script_tifinagh),
                dialect:dialects (name)
            `
      )
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10)
  ]);

  return {
    profile,
    callerRole: role,
    isOwner: role === 'owner',
    stats: (statsReq.data ?? { definition_count: 0, total_upvotes: 0, reputation_score: 0 }) as { definition_count: number; total_upvotes: number; reputation_score: number },
    contributions: (activityReq.data ?? []) as any
  };
};

export const actions = {
  updateUserRole: async ({ request, locals: { supabase, role, user } }) => {
    if (!user || role !== 'owner') {
      return fail(403, { message: 'Only the platform creator/owner can change roles.' });
    }

    const formData = await request.formData();
    const targetUserId = String(formData.get('target_user_id') || '');
    const newRole = String(formData.get('new_role') || '');

    const validRoles = ['user', 'moderator', 'instructor', 'admin', 'owner'];
    if (!targetUserId || !validRoles.includes(newRole)) {
      return fail(400, { message: 'Invalid role or user ID' });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId);

    if (updateError) {
      return fail(500, { message: updateError.message });
    }

    return { success: true, updatedRole: newRole };
  },

  toggleBlockUser: async ({ request, locals: { supabase, role, user } }) => {
    if (!user || role !== 'owner') {
      return fail(403, { message: 'Only the platform creator/owner can block or unblock users.' });
    }

    const formData = await request.formData();
    const targetUserId = String(formData.get('target_user_id') || '');
    const blockAction = formData.get('block_action') === 'block';

    if (!targetUserId) {
      return fail(400, { message: 'Target user ID is required' });
    }

    // Owner cannot block themselves
    if (targetUserId === user.id) {
      return fail(400, { message: 'You cannot block yourself.' });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_blocked: blockAction } as any)
      .eq('id', targetUserId);

    if (updateError) {
      return fail(500, { message: updateError.message });
    }

    return { success: true, isBlocked: blockAction };
  }
};
