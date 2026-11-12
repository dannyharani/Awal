import { getPlatformStats } from '$lib/server/stats';
import { getLocale } from '$lib/paraglide/runtime';
import { SYSTEM_USERNAMES } from '$lib/constants';

const BROWSE_PAGE_SIZE = 60;

type DefinitionItem = {
  id: number;
  dialect_id: number | null;
  definition_text: string;
  language_code: string | null;
  is_verified: boolean | null;
  attributes: Record<string, unknown> | null;
  dialects: { name: string } | null;
};

type WordItem = {
  id: number;
  slug: string;
  script_latin: string;
  script_tifinagh: string | null;
  definitions: DefinitionItem[];
};

const WORD_SELECT =
  'id, slug, script_latin, script_tifinagh, definitions(id, dialect_id, definition_text, language_code, is_verified, attributes, dialects(name))';

/** Order a word's definitions so the reader's language comes first, then English. */
function preferLanguage<T extends { definitions?: DefinitionItem[] | null }>(word: T, locale: string): T {
  const rank = (code: string | null) => {
    const order = [locale, 'en', 'fr', 'ar'];
    const i = order.indexOf(code ?? '');
    return i === -1 ? order.length : i;
  };
  if (!word.definitions || word.definitions.length < 2) return word;
  return {
    ...word,
    definitions: [...word.definitions].sort((a, b) => rank(a.language_code) - rank(b.language_code))
  };
}

/** Escape LIKE wildcards in user-supplied text. */
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** A stable pseudo-random integer for today (UTC), so "word of the day" doesn't change per reload. */
function daySeed(): number {
  const d = new Date();
  const day = Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86_400_000);
  return (Math.imul(day ^ 0x9e3779b9, 2654435761) >>> 0) % 2_147_483_647;
}

export const load = async ({ url, locals: { supabase } }) => {
  const locale = getLocale();
  const letterFilter = url.searchParams.get('letter')?.trim() || null;
  const dialectFilter = url.searchParams.get('dialect') ? Number(url.searchParams.get('dialect')) : null;
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const isFiltering = Boolean(letterFilter || dialectFilter);

  // --- Id range, used for the day-stable word of the day and the shuffle pool -------------
  const [minRes, maxRes] = await Promise.all([
    supabase.from('headwords').select('id').order('id', { ascending: true }).limit(1),
    supabase.from('headwords').select('id').order('id', { ascending: false }).limit(1)
  ]);
  const minId = minRes.data?.[0]?.id ?? 1;
  const maxId = maxRes.data?.[0]?.id ?? 1;
  const span = Math.max(1, maxId - minId + 1);
  const wotdCandidate = minId + (daySeed() % span);
  const poolIds = Array.from({ length: 14 }, (_, idx) => minId + ((daySeed() + idx * 7919) % span));

  // --- Automated import accounts (excluded from "recent" and contributor lists) ----------
  const systemRes = await supabase.from('profiles').select('id').in('username', [...SYSTEM_USERNAMES]);
  const systemIds = (systemRes.data ?? []).map((p) => p.id);

  // --- Browse query (split headwords + definitions to stay fast even at 55k definitions) --
  const from = (page - 1) * BROWSE_PAGE_SIZE;
  const runBrowse = async (): Promise<{ words: WordItem[]; total: number }> => {
    if (!isFiltering) return { words: [], total: 0 };

    if (!dialectFilter) {
      let q = supabase
        .from('headwords')
        .select('id, slug, script_latin, script_tifinagh', { count: 'exact' });
      if (letterFilter) q = q.ilike('script_latin', `${likeEscape(letterFilter)}%`);
      const { data: hwRows, count } = await q
        .order('script_latin', { ascending: true })
        .range(from, from + BROWSE_PAGE_SIZE - 1);

      const ids = (hwRows ?? []).map((h) => h.id);
      if (ids.length === 0) return { words: [], total: count ?? 0 };

      const { data: defs } = await supabase
        .from('definitions')
        .select('id, headword_id, dialect_id, definition_text, language_code, is_verified, attributes, dialects(name)')
        .in('headword_id', ids);

      const defsByHw = new Map<number, DefinitionItem[]>();
      for (const d of (defs ?? []) as unknown as Array<DefinitionItem & { headword_id: number }>) {
        const list = defsByHw.get(d.headword_id) ?? [];
        list.push(d);
        defsByHw.set(d.headword_id, list);
      }

      return {
        words: (hwRows ?? []).map((h) => ({
          id: h.id,
          slug: h.slug,
          script_latin: h.script_latin ?? h.slug,
          script_tifinagh: h.script_tifinagh,
          definitions: defsByHw.get(h.id) ?? []
        })),
        total: count ?? 0
      };
    }

    // Dialect filter active: query definitions first, deduplicate headwords cleanly
    let dq = supabase
      .from('definitions')
      .select('headword_id, headwords!inner(id, slug, script_latin, script_tifinagh)', {
        count: 'estimated'
      })
      .eq('dialect_id', dialectFilter);
    if (letterFilter) dq = dq.ilike('headwords.script_latin', `${likeEscape(letterFilter)}%`);

    const { data: dRows, count } = await dq
      .order('headword_id', { ascending: true })
      .range(from * 3, from * 3 + BROWSE_PAGE_SIZE * 3 - 1);

    const uniqueHws = new Map<number, WordItem>();
    for (const row of (dRows ?? []) as unknown as Array<{
      headwords: { id: number; slug: string; script_latin: string | null; script_tifinagh: string | null };
    }>) {
      const h = row.headwords;
      if (!h || uniqueHws.has(h.id)) continue;
      uniqueHws.set(h.id, {
        id: h.id,
        slug: h.slug,
        script_latin: h.script_latin ?? h.slug,
        script_tifinagh: h.script_tifinagh,
        definitions: []
      });
      if (uniqueHws.size >= BROWSE_PAGE_SIZE) break;
    }

    const ids = Array.from(uniqueHws.keys());
    if (ids.length > 0) {
      const { data: defs } = await supabase
        .from('definitions')
        .select('id, headword_id, dialect_id, definition_text, language_code, is_verified, attributes, dialects(name)')
        .in('headword_id', ids)
        .eq('dialect_id', dialectFilter);

      for (const d of (defs ?? []) as unknown as Array<DefinitionItem & { headword_id: number }>) {
        uniqueHws.get(d.headword_id)?.definitions.push(d);
      }
    }

    return {
      words: Array.from(uniqueHws.values()),
      total: count ? Math.max(uniqueHws.size, Math.ceil(count / 3)) : uniqueHws.size
    };
  };

  // --- Recently added by people (not by imports) ----------------------------------------
  const recentDefsQuery = () => {
    let q = supabase.from('definitions').select('headword_id, created_at');
    if (systemIds.length > 0) q = q.not('user_id', 'in', `(${systemIds.join(',')})`);
    return q.order('created_at', { ascending: false }).limit(30);
  };

  const [
    wotdRes,
    poolRes,
    recentDefsRes,
    platformStats,
    dialectsReq,
    browseResult,
    needDefRes,
    needTifRes,
    needVerifyDefsRes,
    featuredCoursesReq,
    topContributorsReq
  ] = await Promise.all([
    supabase.from('headwords').select(WORD_SELECT).gte('id', wotdCandidate).order('id').limit(1),
    supabase.from('headwords').select(WORD_SELECT).in('id', poolIds),
    recentDefsQuery(),
    getPlatformStats(supabase),
    supabase.from('dialects').select('id, name, region_description').order('name'),
    runBrowse(),
    supabase.rpc('get_incomplete_headwords', { max_results: 6 }),
    supabase
      .from('headwords')
      .select('id, slug, script_latin, script_tifinagh')
      .or('script_tifinagh.is.null,script_tifinagh.eq.')
      .limit(6),
    supabase.from('definitions').select('headword_id').eq('is_verified', false).limit(6),
    supabase
      .from('courses')
      .select(
        'id, title, slug, description, difficulty_level, category, tags, dialects(name), modules(count)'
      )
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .limit(3),
    supabase
      .from('profiles')
      .select('id, username, first_name, last_name, avatar_url, role, reputation_points')
      .order('reputation_points', { ascending: false, nullsFirst: false })
      .limit(10)
  ]);

  const prefer = (rows: unknown) =>
    ((rows ?? []) as unknown as WordItem[]).map((w) => preferLanguage(w, locale));

  // Word of the day (falls back to wrapping around if the candidate is past the last id)
  let wordOfTheDay = prefer(wotdRes.data)[0] ?? null;
  if (!wordOfTheDay) {
    const first = await supabase.from('headwords').select(WORD_SELECT).order('id').limit(1);
    wordOfTheDay = prefer(first.data)[0] ?? null;
  }

  const allWordsPool = prefer(poolRes.data);
  if (wordOfTheDay && !allWordsPool.some((w) => w.id === wordOfTheDay.id)) {
    allWordsPool.unshift(wordOfTheDay);
  }

  // Recent: collapse definitions → unique headwords, newest first
  const recentIds: number[] = [];
  for (const row of recentDefsRes.data ?? []) {
    if (row.headword_id && !recentIds.includes(row.headword_id)) recentIds.push(row.headword_id);
    if (recentIds.length === 6) break;
  }
  let recentWords: WordItem[] = [];
  if (recentIds.length > 0) {
    const { data } = await supabase
      .from('headwords')
      .select(WORD_SELECT + ', created_at')
      .in('id', recentIds);
    const byId = new Map(prefer(data).map((w) => [w.id, w]));
    recentWords = recentIds.map((id) => byId.get(id)).filter((w): w is WordItem => Boolean(w));
  }

  // Unverified headwords via indexed lookup
  const verifyHwIds = Array.from(
    new Set((needVerifyDefsRes.data ?? []).map((r) => r.headword_id).filter((id): id is number => Boolean(id)))
  );
  let wordsNeedingVerification: WordItem[] = [];
  if (verifyHwIds.length > 0) {
    const { data } = await supabase.from('headwords').select(WORD_SELECT).in('id', verifyHwIds);
    wordsNeedingVerification = prefer(data);
  }

  const wordsNeedingDefinition: WordItem[] = !needDefRes.error && needDefRes.data
    ? needDefRes.data.map((h) => ({
        id: h.id,
        slug: h.slug,
        script_latin: h.script_latin ?? h.slug,
        script_tifinagh: h.script_tifinagh,
        definitions: []
      }))
    : [];

  const wordsNeedingTifinagh: WordItem[] = (needTifRes.data ?? []).map((h) => ({
    id: h.id,
    slug: h.slug,
    script_latin: h.script_latin ?? h.slug,
    script_tifinagh: h.script_tifinagh,
    definitions: []
  }));

  const wordsNeedingHelp = [
    ...new Map(
      [...wordsNeedingDefinition, ...wordsNeedingTifinagh, ...wordsNeedingVerification].map((w) => [
        w.id,
        w
      ])
    ).values()
  ].slice(0, 6);

  // Build daily quiz question from real pool words (English definitions preferred)
  const quizCandidates = allWordsPool
    .map((w) => {
      const enDef =
        w.definitions.find((d) => d.language_code === 'en') ?? w.definitions[0];
      return enDef?.definition_text
        ? {
            slug: w.slug,
            latin: w.script_latin,
            tifinagh: w.script_tifinagh ?? '',
            answer: enDef.definition_text
          }
        : null;
    })
    .filter((c): c is NonNullable<typeof c> => Boolean(c && c.answer.length <= 70));

  let dailyChallenge: {
    slug: string;
    latin: string;
    tifinagh: string;
    options: Array<{ label: string; correct: boolean }>;
  } = {
    slug: 'awal',
    latin: 'Awal',
    tifinagh: 'ⴰⵡⴰⵍ',
    options: [
      { label: 'Word, speech, or promise', correct: true },
      { label: 'Mountain range', correct: false },
      { label: 'Morning star', correct: false }
    ]
  };

  if (quizCandidates.length >= 3) {
    const target = quizCandidates[1 % quizCandidates.length];
    const distractors = quizCandidates
      .filter((c) => c.slug !== target.slug && c.answer.toLowerCase() !== target.answer.toLowerCase())
      .slice(0, 2);
    if (distractors.length === 2) {
      const rawOptions = [
        { label: target.answer, correct: true },
        { label: distractors[0].answer, correct: false },
        { label: distractors[1].answer, correct: false }
      ];
      // Deterministic daily shuffle
      const offset = daySeed() % 3;
      const options = [rawOptions[offset], rawOptions[(offset + 1) % 3], rawOptions[(offset + 2) % 3]];
      dailyChallenge = {
        slug: target.slug,
        latin: target.latin,
        tifinagh: target.tifinagh,
        options
      };
    }
  }

  return {
    wordOfTheDay,
    allWordsPool,
    recentWords,
    platformStats,
    dialects: dialectsReq.data ?? [],
    browsedWords: prefer(browseResult.words),
    browseTotal: browseResult.total,
    browsePage: page,
    browsePageSize: BROWSE_PAGE_SIZE,
    wordsNeedingHelp,
    wordsNeedingDefinition,
    wordsNeedingTifinagh,
    wordsNeedingVerification,
    dailyChallenge,
    featuredCourses: (featuredCoursesReq.data ?? []) as unknown as Array<{
      id: number;
      title: string;
      slug: string;
      description: string | null;
      difficulty_level: string | null;
      category: string;
      tags: string[];
      dialects: { name: string } | null;
      modules: Array<{ count: number }>;
    }>,
    topContributors: (topContributorsReq.data ?? [])
      .filter((p) => !(SYSTEM_USERNAMES as readonly string[]).includes(p.username))
      .slice(0, 6),
    activeLetter: letterFilter,
    activeDialect: dialectFilter
  };
};
