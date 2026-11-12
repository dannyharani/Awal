import type { PageServerLoad } from './$types';
import { latinToTifinagh } from '$lib/utils/amazigh';

export interface TawaltWord {
  word: string;
  slug: string;
  tifinagh: string;
  meaning: string;
  dialect: string | null;
}

const FALLBACK_TAWALT_WORDS: TawaltWord[] = [
  {
    word: 'adrar',
    slug: 'adrar',
    tifinagh: 'ⴰⴷⵔⴰⵔ',
    meaning: 'Mountain',
    dialect: 'General Amazigh'
  },
  {
    word: 'ussan',
    slug: 'ussan',
    tifinagh: 'ⵓⵙⵙⴰⵏ',
    meaning: 'Days',
    dialect: 'General Amazigh'
  },
  {
    word: 'izlan',
    slug: 'izlan',
    tifinagh: 'ⵉⵣⵍⴰⵏ',
    meaning: 'Poems / traditional songs',
    dialect: 'Middle Atlas'
  },
  {
    word: 'tiddi',
    slug: 'tiddi',
    tifinagh: 'ⵜⵉⴷⴷⵉ',
    meaning: 'Height / stature',
    dialect: 'General Amazigh'
  },
  {
    word: 'amzil',
    slug: 'amzil',
    tifinagh: 'ⴰⵎⵣⵉⵍ',
    meaning: 'Blacksmith',
    dialect: 'General Amazigh'
  }
];

function stableDayIndex(length: number): number {
  if (length <= 0) return 0;
  const utcDay = Math.floor(Date.now() / 86_400_000);
  return utcDay % length;
}

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const { data: candidates } = await supabase
    .from('headwords')
    .select('id, slug, script_latin, script_tifinagh')
    .like('slug', '_____')
    .limit(100);

  const cleanCandidates = (candidates ?? []).filter((hw) =>
    /^[a-z]{5}$/.test((hw.script_latin ?? '').trim().toLowerCase())
  );

  let pool: TawaltWord[] = [];

  if (cleanCandidates.length > 0) {
    const ids = cleanCandidates.map((hw) => hw.id);
    const { data: defs } = await supabase
      .from('definitions')
      .select('headword_id, definition_text, language_code, dialects (name)')
      .in('headword_id', ids)
      .eq('is_verified', true)
      .limit(200);

    const bestDefByHeadword = new Map<
      number,
      { text: string; lang: string | null; dialect: string | null }
    >();

    for (const def of defs ?? []) {
      if (!def.headword_id) continue;
      const text = (def.definition_text ?? '').trim();
      if (!text) continue;
      const dialect = Array.isArray(def.dialects)
        ? def.dialects[0]?.name ?? null
        : (def.dialects as { name?: string } | null)?.name ?? null;
      const existing = bestDefByHeadword.get(def.headword_id);
      if (!existing || (existing.lang !== 'en' && def.language_code === 'en')) {
        bestDefByHeadword.set(def.headword_id, {
          text,
          lang: def.language_code ?? null,
          dialect
        });
      }
    }

    for (const hw of cleanCandidates) {
      const def = bestDefByHeadword.get(hw.id);
      if (!def || def.lang !== 'en') continue;
      const cleanWord = (hw.script_latin ?? '').trim().toLowerCase();
      pool.push({
        word: cleanWord,
        slug: hw.slug,
        tifinagh: hw.script_tifinagh || latinToTifinagh(cleanWord),
        meaning: def.text,
        dialect: def.dialect
      });
    }
  }

  if (pool.length === 0) {
    pool = FALLBACK_TAWALT_WORDS;
  }

  const dailyIndex = stableDayIndex(pool.length);
  const orderedPool = [...pool.slice(dailyIndex), ...pool.slice(0, dailyIndex)].slice(0, 25);

  return {
    tawaltPool: orderedPool,
    puzzleNumber: Math.floor(Date.now() / 86_400_000) - 20700
  };
};
