import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { definitionSchema } from '$lib/schemas';
import { getLocale } from '$lib/paraglide/runtime';
import { lookupAmazighGlossary, latinToTifinagh } from '$lib/utils/amazigh';

export const load: PageServerLoad = async ({ params, locals: { supabase, user, role } }) => {
  const { slug } = params;

  // 1. Fetch the Headword
  const { data: headword, error: headwordError } = await supabase
    .from('headwords')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (headwordError || !headword) {
    const glossary = lookupAmazighGlossary(slug);
    const candidateWord = glossary?.word ?? decodeURIComponent(slug).replace(/[-_]+/g, ' ').trim();
    const candidateTifinagh = glossary?.tifinagh ?? latinToTifinagh(candidateWord);

    // Also look for similar words in the dictionary to suggest
    const searchPrefix = candidateWord.slice(0, 3);
    const { data: similarWords } = await supabase
      .from('headwords')
      .select('id, slug, script_latin, script_tifinagh')
      .ilike('script_latin', `%${searchPrefix}%`)
      .limit(6);

    return {
      wordNotFound: true,
      searchedSlug: slug,
      candidateWord,
      candidateTifinagh,
      glossary: glossary ?? null,
      similarWords: (similarWords ?? []) as Array<{
        id: number;
        slug: string;
        script_latin: string;
        script_tifinagh: string | null;
      }>,
      headword: null,
      dialects: [],
      definitions: [],
      relatedWords: [],
      userVotes: {},
      userExampleVotes: {},
      role,
      form: null
    };
  }

  // 2. Fetch Definitions, Dialects, and Word Relations in parallel
  const [defsRes, dialectsRes, relationsRes] = await Promise.all([
    supabase
      .from('definitions')
      .select(
        `
        *,
        author:profiles!definitions_user_id_fkey (id, username, avatar_url, role),
        dialects (id, name, region_description),
        examples (
          *,
          author:profiles!examples_user_id_fkey (username)
        ),
        verifier:profiles!definitions_verified_by_fkey (username),
        comments:definition_comments (
          id,
          definition_id,
          user_id,
          parent_id,
          content,
          is_edited,
          created_at,
          author:profiles!definition_comments_user_id_fkey (username, avatar_url, role)
        )
      `
      )
      .eq('headword_id', headword.id)
      .order('is_verified', { ascending: false })
      .order('vote_score', { ascending: false }),

    supabase.from('dialects').select('id, name, region_description').order('name'),

    supabase
      .from('word_relations')
      .select(
        `
        id,
        relation_type,
        user_id,
        source_headword_id,
        target_headword_id,
        source:headwords!word_relations_source_headword_id_fkey (id, slug, script_latin, script_tifinagh),
        target:headwords!word_relations_target_headword_id_fkey (id, slug, script_latin, script_tifinagh)
      `
      )
      .or(`source_headword_id.eq.${headword.id},target_headword_id.eq.${headword.id}`)
  ]);

  if (defsRes.error) {
    console.error('Error fetching definitions:', defsRes.error);
    error(500, 'Error loading definitions');
  }

  const definitions = defsRes.data ?? [];
  const dialects = dialectsRes.data ?? [];

  // Normalize bidirectional word relations relative to current headword
  const relatedWords = (relationsRes.data ?? [])
    .map((rel) => {
      const other = rel.source_headword_id === headword.id ? rel.target : rel.source;
      if (!other || Array.isArray(other)) return null;
      return {
        id: rel.id,
        relation_type: rel.relation_type,
        user_id: rel.user_id,
        word: other
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const userVotes: Record<number, number> = {};
  const userExampleVotes: Record<number, number> = {};

  if (user && definitions.length > 0) {
    const defIds = definitions.map((d) => d.id);
    const exIds = definitions.flatMap((d) => (d.examples ?? []).map((ex: { id: number }) => ex.id));

    const voteQueries = [
      supabase
        .from('votes')
        .select('definition_id, value')
        .eq('user_id', user.id)
        .in('definition_id', defIds)
    ];

    if (exIds.length > 0) {
      voteQueries.push(
        supabase
          .from('votes')
          .select('example_id, value')
          .eq('user_id', user.id)
          .in('example_id', exIds) as never
      );
    }

    const [defVotesRes, exVotesRes] = await Promise.all(voteQueries);

    if (defVotesRes?.data) {
      defVotesRes.data.forEach((v) => {
        if (v.definition_id !== null && v.value !== null) {
          userVotes[v.definition_id] = v.value;
        }
      });
    }

    if (exVotesRes?.data) {
      (exVotesRes.data as unknown as Array<{ example_id: number | null; value: number | null }>).forEach((v) => {
        if (v.example_id !== null && v.value !== null) {
          userExampleVotes[v.example_id] = v.value;
        }
      });
    }
  }

  const form = await superValidate({ headword_id: headword.id }, zod4(definitionSchema));

  return {
    wordNotFound: false,
    searchedSlug: slug,
    candidateWord: headword.script_latin,
    candidateTifinagh: headword.script_tifinagh,
    glossary: null,
    similarWords: [],
    headword,
    dialects,
    definitions,
    relatedWords,
    userVotes,
    userExampleVotes,
    role,
    form
  };
};

function buildAttributesJson(data: Record<string, unknown>): Record<string, string> {
  const attrs: Record<string, string> = {};
  const keys = [
    'part_of_speech',
    'gender',
    'grammatical_number',
    'construct_state',
    'plural',
    'root',
    'verb_stems'
  ];
  for (const key of keys) {
    const val = typeof data[key] === 'string' ? data[key].trim() : '';
    if (val) {
      attrs[key] = val;
    }
  }
  return attrs;
}

export const actions: Actions = {
  addDefinition: async ({ request, locals: { supabase, user } }) => {
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

    let audio_url: string | null = null;

    if (audio instanceof File && audio.size > 0) {
      const safeName = audio.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${user.id}/${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from('pronunciations')
        .upload(fileName, audio);

      if (uploadError) {
        console.error('Upload error:', uploadError);
      } else {
        const {
          data: { publicUrl }
        } = supabase.storage.from('pronunciations').getPublicUrl(fileName);
        audio_url = publicUrl;
      }
    }

    const currentLang = getLocale();
    const attributes = buildAttributesJson(form.data);

    const { data: defData, error: insertError } = await supabase
      .from('definitions')
      .insert({
        headword_id,
        user_id: user.id,
        dialect_id,
        definition_text: definition_text.trim(),
        attributes,
        audio_url,
        language_code: currentLang,
        is_verified: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert definition error:', insertError);
      return fail(500, { form, message: 'Database error' });
    }

    if (example_sentence?.trim() && defData) {
      await supabase.from('examples').insert({
        definition_id: defData.id,
        user_id: user.id,
        sentence_text: example_sentence.trim(),
        translation_text: example_translation?.trim() || null
      });
    }

    return { form };
  },

  vote: async ({ request, locals: { supabase, user } }) => {
    if (!user) return fail(401, { message: 'Unauthorized' });

    const formData = await request.formData();
    const definitionIdRaw = formData.get('definition_id');
    const exampleIdRaw = formData.get('example_id');
    const value = Number(formData.get('value'));

    if (value !== 1 && value !== -1) {
      return fail(400, { message: 'Invalid vote value' });
    }

    if (definitionIdRaw) {
      const definitionId = Number(definitionIdRaw);
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', user.id)
        .eq('definition_id', definitionId)
        .maybeSingle();

      if (existingVote) {
        if (existingVote.value === value) {
          await supabase.from('votes').delete().eq('id', existingVote.id);
        } else {
          await supabase.from('votes').update({ value }).eq('id', existingVote.id);
        }
      } else {
        await supabase.from('votes').insert({ user_id: user.id, definition_id: definitionId, value });
      }
    } else if (exampleIdRaw) {
      const exampleId = Number(exampleIdRaw);
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', user.id)
        .eq('example_id', exampleId)
        .maybeSingle();

      if (existingVote) {
        if (existingVote.value === value) {
          await supabase.from('votes').delete().eq('id', existingVote.id);
        } else {
          await supabase.from('votes').update({ value }).eq('id', existingVote.id);
        }
      } else {
        await supabase.from('votes').insert({ user_id: user.id, example_id: exampleId, value });
      }
    }

    return { success: true };
  },

  updateDefinition: async ({ request, locals: { supabase, user, role } }) => {
    if (!user) return fail(401, { message: 'Unauthorized' });

    const formData = await request.formData();
    const definitionId = Number(formData.get('definition_id'));
    const definitionText = String(formData.get('definition_text') || '').trim();
    const dialectId = Number(formData.get('dialect_id'));
    const audio = formData.get('audio');

    const attributes = buildAttributesJson({
      part_of_speech: formData.get('part_of_speech'),
      gender: formData.get('gender'),
      grammatical_number: formData.get('grammatical_number'),
      construct_state: formData.get('construct_state'),
      plural: formData.get('plural'),
      root: formData.get('root'),
      verb_stems: formData.get('verb_stems')
    });

    const updatePayload: {
      definition_text: string;
      dialect_id: number;
      attributes: Record<string, string>;
      audio_url?: string;
    } = {
      definition_text: definitionText,
      dialect_id: dialectId,
      attributes
    };

    if (audio instanceof File && audio.size > 0 && audio.size < 500 * 1024) {
      const safeName = audio.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${user.id}/${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from('pronunciations')
        .upload(fileName, audio);

      if (!uploadError) {
        const {
          data: { publicUrl }
        } = supabase.storage.from('pronunciations').getPublicUrl(fileName);
        updatePayload.audio_url = publicUrl;
      }
    }

    const isModerator = role === 'admin' || role === 'moderator' || role === 'instructor';
    let query = supabase.from('definitions').update(updatePayload).eq('id', definitionId);
    if (!isModerator) {
      query = query.eq('user_id', user.id);
    }

    const { error: updateErr } = await query;

    if (updateErr) {
      console.error('Update error:', updateErr);
      return fail(500, { message: 'Failed to update definition' });
    }

    return { success: true };
  },

  deleteDefinition: async ({ request, locals: { supabase, user, role } }) => {
    if (!user) return fail(401, { message: 'Unauthorized' });

    const formData = await request.formData();
    const definitionId = Number(formData.get('definition_id'));
    const isModerator = role === 'admin' || role === 'moderator' || role === 'instructor';

    let query = supabase.from('definitions').delete().eq('id', definitionId);
    if (!isModerator) {
      query = query.eq('user_id', user.id);
    }

    const { error: delErr } = await query;
    if (delErr) return fail(500, { message: 'Failed to delete' });
    return { success: true };
  },

  verifyDefinition: async ({ request, locals: { supabase, user, role } }) => {
    if (!user || (role !== 'admin' && role !== 'moderator' && role !== 'instructor')) {
      return fail(403, { message: 'Only instructors and moderators can verify definitions.' });
    }

    const formData = await request.formData();
    const definitionId = Number(formData.get('definition_id'));
    const nextState = formData.get('is_verified') === 'true';

    const { error: verifyErr } = await supabase
      .from('definitions')
      .update({
        is_verified: nextState,
        verified_by: nextState ? user.id : null
      })
      .eq('id', definitionId);

    if (verifyErr) return fail(500, { message: 'Failed to update verification status' });
    return { success: true };
  },

  addExample: async ({ request, locals: { supabase, user } }) => {
    if (!user) return fail(401, { message: 'Unauthorized' });

    const formData = await request.formData();
    const definitionId = Number(formData.get('definition_id'));
    const sentence = String(formData.get('sentence') || '').trim();
    const translation = String(formData.get('translation') || '').trim();

    if (!sentence) {
      return fail(400, { message: 'Example sentence cannot be empty' });
    }

    const { error: exErr } = await supabase.from('examples').insert({
      definition_id: definitionId,
      user_id: user.id,
      sentence_text: sentence,
      translation_text: translation || null
    });

    if (exErr) return fail(500, { message: 'Failed to add example' });
    return { success: true };
  },

  deleteExample: async ({ request, locals: { supabase, user, role } }) => {
    if (!user) return fail(401, { message: 'Unauthorized' });

    const formData = await request.formData();
    const exampleId = Number(formData.get('example_id'));
    const isModerator = role === 'admin' || role === 'moderator' || role === 'instructor';

    let query = supabase.from('examples').delete().eq('id', exampleId);
    if (!isModerator) {
      query = query.eq('user_id', user.id);
    }

    const { error: delErr } = await query;
    if (delErr) return fail(500, { message: 'Failed to delete example' });
    return { success: true };
  },

  deleteAudio: async ({ request, locals: { supabase, user, role } }) => {
    if (!user) return fail(401, { message: 'Unauthorized' });

    const formData = await request.formData();
    const definitionId = Number(formData.get('definition_id'));
    const audioUrl = String(formData.get('audio_url') || '');
    const isModerator = role === 'admin' || role === 'moderator' || role === 'instructor';

    const { data: def, error: fetchError } = await supabase
      .from('definitions')
      .select('user_id')
      .eq('id', definitionId)
      .single();

    if (fetchError || (!isModerator && def.user_id !== user.id)) {
      return fail(403, { message: 'Unauthorized' });
    }

    const path = audioUrl.split('/pronunciations/')[1];
    if (path) {
      const { error: storageError } = await supabase.storage.from('pronunciations').remove([path]);
      if (storageError) console.error('Storage delete error:', storageError);
    }

    const { error: dbError } = await supabase
      .from('definitions')
      .update({ audio_url: null })
      .eq('id', definitionId);

    if (dbError) return fail(500, { message: 'Failed to update definition' });
    return { success: true };
  },

  updateHeadword: async ({ request, locals: { supabase, user } }) => {
    if (!user) return fail(401, { message: 'Unauthorized' });

    const formData = await request.formData();
    const headwordId = Number(formData.get('headword_id'));
    const scriptTifinagh = String(formData.get('script_tifinagh') || '').trim();
    const scriptArabic = String(formData.get('script_arabic') || '').trim();

    const { error: hwErr } = await supabase
      .from('headwords')
      .update({
        script_tifinagh: scriptTifinagh || null,
        script_arabic: scriptArabic || null
      })
      .eq('id', headwordId);

    if (hwErr) return fail(500, { message: 'Failed to update headword scripts' });
    return { success: true };
  },

  addComment: async ({ request, locals: { supabase, user } }) => {
    if (!user) return fail(401, { message: 'Unauthorized' });

    const formData = await request.formData();
    const definitionId = Number(formData.get('definition_id'));
    const parentIdRaw = formData.get('parent_id');
    const parentId = parentIdRaw ? Number(parentIdRaw) : null;
    const content = String(formData.get('content') || '').trim();

    if (!content || content.length > 1000) {
      return fail(400, { message: 'Comment must be between 1 and 1000 characters.' });
    }

    const { error: commentErr } = await supabase.from('definition_comments').insert({
      definition_id: definitionId,
      user_id: user.id,
      parent_id: parentId,
      content
    });

    if (commentErr) return fail(500, { message: 'Failed to post comment' });
    return { success: true };
  },

  deleteComment: async ({ request, locals: { supabase, user, role } }) => {
    if (!user) return fail(401, { message: 'Unauthorized' });

    const formData = await request.formData();
    const commentId = Number(formData.get('comment_id'));
    const isModerator = role === 'admin' || role === 'moderator' || role === 'instructor';

    let query = supabase.from('definition_comments').delete().eq('id', commentId);
    if (!isModerator) {
      query = query.eq('user_id', user.id);
    }

    const { error: delErr } = await query;
    if (delErr) return fail(500, { message: 'Failed to delete comment' });
    return { success: true };
  },

  addWordRelation: async ({ request, locals: { supabase, user } }) => {
    if (!user) return fail(401, { message: 'Unauthorized' });

    const formData = await request.formData();
    const sourceHeadwordId = Number(formData.get('source_headword_id'));
    const targetSlug = String(formData.get('target_slug') || '')
      .toLowerCase()
      .trim();
    const relationType = String(formData.get('relation_type') || 'synonym');

    if (!targetSlug) {
      return fail(400, { message: 'Please specify a word to link.' });
    }

    const { data: targetWord } = await supabase
      .from('headwords')
      .select('id')
      .or(`slug.eq.${targetSlug},script_latin.ilike.${targetSlug}`)
      .limit(1)
      .maybeSingle();

    if (!targetWord) {
      return fail(404, { message: `Word "${targetSlug}" not found in dictionary. Add it first!` });
    }

    if (targetWord.id === sourceHeadwordId) {
      return fail(400, { message: 'Cannot link a word to itself.' });
    }

    const { error: relErr } = await supabase.from('word_relations').insert({
      source_headword_id: sourceHeadwordId,
      target_headword_id: targetWord.id,
      relation_type: relationType,
      user_id: user.id
    });

    if (relErr) {
      return fail(400, { message: 'This word relation already exists or could not be linked.' });
    }

    return { success: true };
  },

  deleteWordRelation: async ({ request, locals: { supabase, user, role } }) => {
    if (!user) return fail(401, { message: 'Unauthorized' });

    const formData = await request.formData();
    const relationId = Number(formData.get('relation_id'));
    const isModerator = role === 'admin' || role === 'moderator' || role === 'instructor';

    let query = supabase.from('word_relations').delete().eq('id', relationId);
    if (!isModerator) {
      query = query.eq('user_id', user.id);
    }

    const { error: delErr } = await query;
    if (delErr) return fail(500, { message: 'Failed to remove relation' });
    return { success: true };
  }
};
