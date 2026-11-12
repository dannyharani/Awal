import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const rawWord = (url.searchParams.get('word') ?? '').trim().toLowerCase();
  if (!/^[a-z]{3,16}$/.test(rawWord)) {
    return json({ valid: false });
  }

  const { data: hw } = await supabase
    .from('headwords')
    .select('id, slug, script_latin, script_tifinagh')
    .or(`slug.eq.${rawWord},script_latin.ilike.${rawWord}`)
    .limit(1)
    .maybeSingle();

  if (!hw) {
    return json({ valid: false });
  }

  const { data: defs } = await supabase
    .from('definitions')
    .select('definition_text, language_code')
    .eq('headword_id', hw.id)
    .limit(5);

  const enDef = defs?.find((d) => d.language_code === 'en') ?? defs?.[0];

  return json({
    valid: true,
    slug: hw.slug,
    word: (hw.script_latin ?? rawWord).toLowerCase(),
    tifinagh: hw.script_tifinagh ?? '',
    meaning: enDef?.definition_text ?? 'Verified dictionary word'
  });
};
