import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { profileSchema } from '$lib/schemas';

export const load = async ({ locals: { supabase, user } }) => {
  if (!user) throw redirect(302, '/login');

  // 1. Fetch current profile data
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  // 2. Populate form with existing data
  const form = await superValidate(zod4(profileSchema));

  if (profile) {
    form.data.username = profile.username;
    form.data.first_name = profile.first_name ?? '';
    form.data.last_name = profile.last_name ?? '';
    form.data.bio = profile.bio ?? '';
  }

  return { form, profile };
};

export const actions = {
  updateProfile: async ({ request, locals: { supabase, user } }) => {
    const form = await superValidate(request, zod4(profileSchema));

    if (!user) return fail(401, { form });
    if (!form.valid) return fail(400, { form });

    const { username, first_name, last_name, bio, avatar } = form.data;
    let avatar_url = null;

    // 1. Handle Avatar Upload (If provided)
    if (avatar instanceof File && avatar.size > 0) {
      // Create a unique path: user_id/timestamp.ext
      const fileExt = avatar.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatar);

      if (uploadError) {
        return message(form, 'Failed to upload image.', { status: 500 });
      }

      // Get Public URL
      const {
        data: { publicUrl }
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      avatar_url = publicUrl;
    }

    // 2. Prepare Update Object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      username,
      first_name,
      last_name,
      bio,
      updated_at: new Date()
    };

    // Only update avatar_url if a new one was uploaded
    if (avatar_url) {
      updateData.avatar_url = avatar_url;
    }

    // 3. Update Profile in DB
    const { error } = await supabase.from('profiles').update(updateData).eq('id', user.id);

    if (error) {
      if (error.code === '23505') {
        // Unique violation for username
        return message(form, 'Username already taken.', { status: 400 });
      }
      return message(form, 'Database error.', { status: 500 });
    }

    return message(form, 'Profile updated successfully!');
  }
};
