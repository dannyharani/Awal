import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { definitionSchema } from '$lib/schemas';
import { getLocale } from '$lib/paraglide/runtime';

export const load: PageServerLoad = async ({ params, locals: { supabase, user } }) => {
  const { slug } = params;

  // 1. Fetch the Headword (The Container)
  const { data: headword, error: headwordError } = await supabase
    .from('headwords')
    .select('*')
    .eq('slug', slug)
    .single();

  if (headwordError || !headword) {
    console.error('Error fetching headword:', headwordError);
    error(404, {
      message: `Word "${slug}" not found`
    });
  }

  // 2. Fetch the Definitions (The Content)
  const { data: definitions, error: defError } = await supabase
    .from('definitions')
    .select(
      `
			*,
			author:profiles!definitions_user_id_fkey (username, avatar_url, role),
			dialects (name, region_description),
            examples (*),
            verifier:profiles!definitions_verified_by_fkey (username)
		`
    )
    .eq('headword_id', headword.id)
    .order('vote_score', { ascending: false });

  if (defError) {
    console.error('Error fetching definitions:', defError);
    error(500, 'Error loading definitions');
  }

  const { data: dialects } = await supabase.from('dialects').select('id, name').order('name');

  const userVotes: Record<number, number> = {};

  if (user) {
    const { data: votes } = await supabase
      .from('votes')
      .select('definition_id, value')
      .eq('user_id', user.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .in('definition_id', definitions?.map((d: { id: any }) => d.id) ?? []);

    // Convert array to a Map for easy lookup: { def_id: 1, def_id_2: -1 }
    if (votes) {
      votes.forEach((v) => {
        if (v.definition_id !== null && v.value !== null) userVotes[v.definition_id] = v.value;
      });
    }
  }

  const form = await superValidate({ headword_id: headword.id }, zod4(definitionSchema));

  return {
    headword,
    dialects: dialects ?? [],
    definitions: definitions ?? [],
    userVotes,
    form
  };
};

export const actions: Actions = {
  addDefinition: async ({ request, locals: { supabase, user } }) => {
    // 1. Validate Form (Use definitionSchema)
    const form = await superValidate(request, zod4(definitionSchema));

    if (!form.valid) return fail(400, { form });
    if (!user) return fail(401, { form, message: 'Unauthorized' });

    const {
      headword_id,
      dialect_id,
      definition_text,
      example_sentence,
      example_translation,
      audio
    } = form.data;

    // 2. Handle Audio Upload (if exists)
    let audio_url = null;

    // Check if 'audio' is a File and has size > 0
    if (audio instanceof File && audio.size > 0) {
      const fileName = `${user.id}/${Date.now()}_${audio.name}`;
      const { error: uploadError } = await supabase.storage
        .from('pronunciations')
        .upload(fileName, audio);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // We don't fail the whole request, just log it. The definition is more important.
      } else {
        const {
          data: { publicUrl }
        } = supabase.storage.from('pronunciations').getPublicUrl(fileName);
        audio_url = publicUrl;
      }
    }

    const currentLang = getLocale();

    // 3. Insert Definition
    const { data: defData, error: insertError } = await supabase
      .from('definitions')
      .insert({
        headword_id,
        user_id: user.id,
        dialect_id,
        definition_text,
        audio_url, // Save the URL here
        language_code: currentLang,
        is_verified: false
      })
      .select()
      .single();

    if (insertError) {
      return fail(500, { form, message: 'Database error' });
    }

    // 4. Insert Example (if provided)
    if (example_sentence && defData) {
      await supabase.from('examples').insert({
        definition_id: defData.id, // Link to the new definition
        user_id: user.id,
        sentence_text: example_sentence,
        translation_text: example_translation
      });
    }

    return { form };
  },

  vote: async ({ request, locals: { supabase, user } }) => {
    if (!user) return fail(401, { message: 'Unauthorized' });

    const formData = await request.formData();
    const definitionId = Number(formData.get('definition_id'));
    const value = Number(formData.get('value')); // 1 or -1

    // 1. Check if vote exists
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', user.id)
      .eq('definition_id', definitionId)
      .single();

    if (existingVote) {
      if (existingVote.value === value) {
        // Scenario A: Same button clicked -> Remove vote (Toggle)
        await supabase
          .from('votes')
          .delete()
          .eq('user_id', user.id)
          .eq('definition_id', definitionId);
      } else {
        // Scenario B: Different button clicked -> Flip vote
        await supabase
          .from('votes')
          .update({ value })
          .eq('user_id', user.id)
          .eq('definition_id', definitionId);
      }
    } else {
      // Scenario C: New vote -> Insert
      await supabase.from('votes').insert({ user_id: user.id, definition_id: definitionId, value });
    }

    return { success: true };
  },

  updateDefinition: async ({ request, locals: { supabase, user } }) => {
    const formData = await request.formData();
    const definitionId = Number(formData.get('definition_id'));
    const definitionText = String(formData.get('definition_text') || '');
    const dialectId = Number(formData.get('dialect_id'));

    if (!user) return fail(401, { message: 'Unauthorized' });

    // 1. Verify Ownership & Update
    const { error } = await supabase
      .from('definitions')
      .update({
        definition_text: definitionText,
        dialect_id: dialectId,
        is_verified: false // Optional: Reset verification on edit?
      })
      .eq('id', definitionId)
      .eq('user_id', user.id); // Security: ONLY update if user_id matches

    if (error) {
      console.error('Update error:', error);
      return fail(500, { message: 'Failed to update definition' });
    }

    return { success: true };
  },

  deleteDefinition: async ({ request, locals: { supabase, user } }) => {
    const formData = await request.formData();
    const definitionId = Number(formData.get('definition_id'));

    if (!user) return fail(401, { message: 'Unauthorized' });

    const { error } = await supabase
      .from('definitions')
      .delete()
      .eq('id', definitionId)
      .eq('user_id', user.id); // Security: Owner only

    if (error) return fail(500, { message: 'Failed to delete' });
    return { success: true };
  },

  addExample: async ({ request, locals: { supabase, user } }) => {
    const formData = await request.formData();
    const definitionId = Number(formData.get('definition_id'));
    const sentence = String(formData.get('sentence') || '');
    const translation = String(formData.get('translation') || '');

    if (!user) return fail(401, { message: 'Unauthorized' });

    const { error } = await supabase.from('examples').insert({
      definition_id: definitionId,
      user_id: user.id,
      sentence_text: sentence,
      translation_text: translation
    });

    if (error) return fail(500, { message: 'Failed to add example' });
    return { success: true };
  },

  deleteExample: async ({ request, locals: { supabase, user } }) => {
    const formData = await request.formData();
    const exampleId = Number(formData.get('example_id'));

    if (!user) return fail(401, { message: 'Unauthorized' });

    const { error } = await supabase.from('examples').delete().eq('id', exampleId);
    // Note: In a real app, verify user_id matches the definition owner or example owner

    if (error) return fail(500, { message: 'Failed to delete example' });
    return { success: true };
  },

  deleteAudio: async ({ request, locals: { supabase, user } }) => {
    const formData = await request.formData();
    const definitionId = Number(formData.get('definition_id'));
    const audioUrl = String(formData.get('audio_url')); // We need the URL to find the file path

    if (!user) return fail(401, { message: 'Unauthorized' });

    // 1. Verify Ownership
    const { data: def, error: fetchError } = await supabase
      .from('definitions')
      .select('user_id')
      .eq('id', definitionId)
      .single();

    if (fetchError || def.user_id !== user.id) {
      return fail(403, { message: 'Unauthorized' });
    }

    // 2. Extract File Path from URL
    // URL format: .../storage/v1/object/public/pronunciations/{user_id}/{filename}
    // We just need: {user_id}/{filename}
    const path = audioUrl.split('/pronunciations/')[1];

    if (path) {
      // 3. Delete from Storage
      const { error: storageError } = await supabase.storage.from('pronunciations').remove([path]);

      if (storageError) console.error('Storage delete error:', storageError);
    }

    // 4. Update Database (Set audio_url to null)
    const { error: dbError } = await supabase
      .from('definitions')
      .update({ audio_url: null })
      .eq('id', definitionId);

    if (dbError) return fail(500, { message: 'Failed to update definition' });

    return { success: true };
  }
};
