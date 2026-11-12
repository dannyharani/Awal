-- =============================================================================
-- Search engine v2
--
--  * Accent / diacritic folding (French é→e, Arabic tashkeel stripped, alef variants)
--    stored in a generated column so reverse-meaning search works in EN / FR / AR.
--  * Trigram + btree indexes so search stays fast at 18k headwords / 55k definitions.
--  * search_dictionary(term, max_results) rewritten with ranked, de-duplicated results:
--      headword (exact / orthography-normalised / prefix / substring, Latin + Tifinagh + Arabic)
--      fuzzy    (typo-tolerant trigram match on the normalised Latin form → "did you mean")
--      inflected(construct state / plural)
--      root     (`√ktb`, `root:ktb`, `k-t-b` → every word sharing that consonantal root)
--      meaning  (reverse search: English / French / Arabic definition → Amazigh headword)
--  * Results also carry part_of_speech and root so the UI can show them.
--
-- Idempotent: safe to run more than once.
-- =============================================================================

-- 1. Text folding helper ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fold_text(input_text text)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE
  PARALLEL SAFE
  AS $$
    SELECT translate(
      translate(
        -- drop Arabic harakat (U+064B–U+065F), superscript alef (U+0670), tatweel (U+0640)
        regexp_replace(lower(COALESCE(input_text, '')), '[\u064B-\u065F\u0670\u0640]', '', 'g'),
        'àáâäãåçèéêëìíîïñòóôöõùúûüýÿœ',
        'aaaaaaceeeeiiiinooooouuuuyyo'
      ),
      -- unify alef forms, alef maqsura → ya, ta marbuta → ha
      'أإآٱىة',
      'اااايه'
    );
  $$;

GRANT EXECUTE ON FUNCTION public.fold_text(text) TO PUBLIC, anon, authenticated, service_role;

-- 2. Folded definition text (generated, kept in sync automatically) -----------
ALTER TABLE public.definitions
  ADD COLUMN IF NOT EXISTS definition_search text
  GENERATED ALWAYS AS (public.fold_text(definition_text)) STORED;

-- 3. Indexes ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS headwords_latin_norm_trgm_idx
  ON public.headwords USING gin (public.normalize_amazigh_latin(script_latin) public.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS headwords_tifinagh_trgm_idx
  ON public.headwords USING gin (script_tifinagh public.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS definitions_search_trgm_idx
  ON public.definitions USING gin (definition_search public.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS definitions_headword_id_idx
  ON public.definitions (headword_id);

CREATE INDEX IF NOT EXISTS definitions_dialect_headword_idx
  ON public.definitions (dialect_id, headword_id);

CREATE INDEX IF NOT EXISTS definitions_unverified_idx
  ON public.definitions (headword_id)
  WHERE is_verified = false;

CREATE INDEX IF NOT EXISTS definitions_root_idx
  ON public.definitions ((attributes->>'root'))
  WHERE attributes->>'root' IS NOT NULL;

CREATE INDEX IF NOT EXISTS examples_definition_id_idx
  ON public.examples (definition_id);

-- 4. search_dictionary --------------------------------------------------------
DROP FUNCTION IF EXISTS public.search_dictionary(text);
DROP FUNCTION IF EXISTS public.search_dictionary(text, integer);

CREATE OR REPLACE FUNCTION public.search_dictionary(term text, max_results integer DEFAULT 10)
  RETURNS TABLE (
    id              bigint,
    slug            text,
    headword_text   text,
    script_tifinagh text,
    script_arabic   text,
    match_type      text,
    match_preview   text,
    similarity      real,
    part_of_speech  text,
    root            text
  )
  LANGUAGE plpgsql
  STABLE
  AS $function$
#variable_conflict use_column
DECLARE
  clean_term text := trim(COALESCE(term, ''));
  lim        integer := LEAST(GREATEST(COALESCE(max_results, 10), 1), 50);
  norm_term  text;
  fold_term  text;
  like_clean text;
  like_norm  text;
  like_fold  text;
  term_re    text;
  root_query text;
BEGIN
  IF char_length(clean_term) < 1 THEN
    RETURN;
  END IF;

  norm_term  := public.normalize_amazigh_latin(clean_term);
  fold_term  := public.fold_text(clean_term);

  -- Escape LIKE wildcards so "50%" or "a_b" are searched literally.
  like_clean := replace(replace(replace(clean_term, '\', '\\'), '%', '\%'), '_', '\_');
  like_norm  := replace(replace(replace(norm_term,  '\', '\\'), '%', '\%'), '_', '\_');
  like_fold  := replace(replace(replace(fold_term,  '\', '\\'), '%', '\%'), '_', '\_');
  term_re    := regexp_replace(fold_term, '([.*+?^$(){}|\[\]\\])', '\\\1', 'g');

  -- Root query syntax:  √ktb  |  root:ktb  |  k-t-b
  IF clean_term ~* '^(√|root:)\s*[^\s-]{2,4}$' THEN
    root_query := regexp_replace(
      upper(regexp_replace(clean_term, '^(√|root:)\s*', '', 'i')),
      '(.)(?=.)', '\1-', 'g');
  ELSIF clean_term ~ '^[^\s-]{1,2}(-[^\s-]{1,2}){1,3}$' THEN
    root_query := upper(clean_term);
  END IF;

  RETURN QUERY
  WITH cand AS (
    -- A. Headword matches (Latin, orthography-normalised Latin, Tifinagh, Arabic) + fuzzy
    SELECT
      h.id AS cid,
      CASE WHEN lex.score > 0 THEN 'headword' ELSE 'fuzzy' END AS mtype,
      NULL::text AS preview,
      GREATEST(
        lex.score,
        (similarity(public.normalize_amazigh_latin(h.script_latin), norm_term) * 0.85)
      ) AS score,
      0 AS lang_pref
    FROM public.headwords h
    CROSS JOIN LATERAL (
      SELECT
        CASE
          WHEN lower(h.script_latin) = lower(clean_term) THEN 1.0
          WHEN h.script_tifinagh = clean_term OR h.script_arabic = clean_term THEN 1.0
          WHEN public.normalize_amazigh_latin(h.script_latin) = norm_term THEN 0.97
          WHEN lower(h.script_latin) LIKE lower(like_clean) || '%' THEN 0.90
          WHEN public.normalize_amazigh_latin(h.script_latin) LIKE like_norm || '%' THEN 0.88
          WHEN h.script_tifinagh LIKE like_clean || '%' THEN 0.88
          WHEN h.script_latin ILIKE '%' || like_clean || '%'
            OR public.normalize_amazigh_latin(h.script_latin) LIKE '%' || like_norm || '%'
            OR h.script_tifinagh LIKE '%' || like_clean || '%'
            OR h.script_arabic LIKE '%' || like_clean || '%' THEN 0.70
          ELSE 0.0
        END AS score
    ) lex
    WHERE
      h.script_latin ILIKE '%' || like_clean || '%'
      OR public.normalize_amazigh_latin(h.script_latin) LIKE '%' || like_norm || '%'
      OR public.normalize_amazigh_latin(h.script_latin) % norm_term
      OR h.script_tifinagh LIKE '%' || like_clean || '%'
      OR h.script_arabic LIKE '%' || like_clean || '%'

    UNION ALL

    -- B. Inflected forms stored on definitions.attributes (construct state / plural)
    SELECT
      d.headword_id,
      'inflected',
      CASE
        WHEN d.attributes->>'construct_state' IS NOT NULL
         AND (d.attributes->>'construct_state' = clean_term
              OR public.normalize_amazigh_latin(d.attributes->>'construct_state') = norm_term)
          THEN 'Construct state: ' || (d.attributes->>'construct_state')
        ELSE 'Plural: ' || (d.attributes->>'plural')
      END,
      0.82,
      0
    FROM public.definitions d
    WHERE d.headword_id IS NOT NULL
      AND (
        (d.attributes ? 'construct_state'
          AND (d.attributes->>'construct_state' = clean_term
               OR public.normalize_amazigh_latin(d.attributes->>'construct_state') = norm_term))
        OR
        (d.attributes ? 'plural'
          AND (d.attributes->>'plural' = clean_term
               OR public.normalize_amazigh_latin(d.attributes->>'plural') = norm_term))
      )

    UNION ALL

    -- C. Consonantal root family
    SELECT
      d.headword_id,
      'root',
      'Root ' || root_query,
      0.72,
      0
    FROM public.definitions d
    WHERE root_query IS NOT NULL
      AND d.headword_id IS NOT NULL
      AND d.attributes->>'root' = root_query

    UNION ALL

    -- D. Reverse meaning search (EN / FR / AR definition → Amazigh headword)
    SELECT
      d.headword_id,
      'meaning',
      d.definition_text,
      CASE
        WHEN d.definition_search = fold_term THEN 0.86
        WHEN d.definition_search ~ ('(^|[^[:alnum:]])' || term_re || '([^[:alnum:]]|$)') THEN 0.76
        WHEN d.definition_search LIKE like_fold || '%' THEN 0.70
        ELSE 0.60
      END,
      CASE WHEN d.language_code = 'en' THEN 2 WHEN d.language_code = 'fr' THEN 1 ELSE 0 END
    FROM public.definitions d
    WHERE d.headword_id IS NOT NULL
      AND (char_length(clean_term) >= 3 OR clean_term ~ '[\u0600-\u06FF]')
      AND d.definition_search LIKE '%' || like_fold || '%'
  ),
  best AS (
    SELECT DISTINCT ON (c.cid) c.cid, c.mtype, c.preview, c.score
    FROM cand c
    WHERE c.score > 0 AND c.cid IS NOT NULL
    ORDER BY c.cid, c.score DESC, c.lang_pref DESC
  ),
  top AS (
    SELECT b.cid, b.mtype, b.preview, b.score
    FROM best b
    JOIN public.headwords hh ON hh.id = b.cid
    ORDER BY b.score DESC, char_length(hh.script_latin) ASC, hh.script_latin ASC
    LIMIT lim
  )
  SELECT
    h.id,
    h.slug,
    h.script_latin,
    h.script_tifinagh,
    h.script_arabic,
    t.mtype,
    COALESCE(t.preview, bd.definition_text, ''),
    t.score::real,
    bd.attributes->>'part_of_speech',
    bd.attributes->>'root'
  FROM top t
  JOIN public.headwords h ON h.id = t.cid
  LEFT JOIN LATERAL (
    SELECT d2.definition_text, d2.attributes
    FROM public.definitions d2
    WHERE d2.headword_id = t.cid
    ORDER BY (d2.language_code = 'en') DESC, d2.is_verified DESC NULLS LAST, d2.vote_score DESC NULLS LAST
    LIMIT 1
  ) bd ON true
  ORDER BY t.score DESC, char_length(h.script_latin) ASC, h.script_latin ASC;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.search_dictionary(text, integer) TO PUBLIC, anon, authenticated, service_role;

-- 5. Contribution counts -------------------------------------------------------
-- PostgREST caps every response at 1,000 rows, so counting contributions by fetching
-- `select user_id from definitions` silently under-counts once the dictionary is large.
CREATE INDEX IF NOT EXISTS definitions_user_id_idx ON public.definitions (user_id);
CREATE INDEX IF NOT EXISTS examples_user_id_idx ON public.examples (user_id);

CREATE OR REPLACE FUNCTION public.get_contribution_counts()
  RETURNS TABLE (
    user_id            uuid,
    definitions_count  bigint,
    examples_count     bigint,
    lessons_completed  bigint
  )
  LANGUAGE sql
  STABLE
  AS $$
    SELECT
      p.id,
      (SELECT count(*) FROM public.definitions d WHERE d.user_id = p.id),
      (SELECT count(*) FROM public.examples e WHERE e.user_id = p.id),
      (SELECT count(*) FROM public.completed_lessons c WHERE c.user_id = p.id)
    FROM public.profiles p;
  $$;

GRANT EXECUTE ON FUNCTION public.get_contribution_counts() TO PUBLIC, anon, authenticated, service_role;

-- 6. Fast lookup for headwords missing any definition (replaces unindexed LEFT JOIN) --
CREATE OR REPLACE FUNCTION public.get_incomplete_headwords(max_results integer DEFAULT 6)
  RETURNS TABLE (
    id              bigint,
    slug            text,
    script_latin    text,
    script_tifinagh text
  )
  LANGUAGE sql
  STABLE
  AS $$
    SELECT h.id, h.slug, h.script_latin, h.script_tifinagh
    FROM public.headwords h
    WHERE NOT EXISTS (
      SELECT 1 FROM public.definitions d WHERE d.headword_id = h.id
    )
    ORDER BY h.id DESC
    LIMIT LEAST(GREATEST(COALESCE(max_results, 6), 1), 24);
  $$;

GRANT EXECUTE ON FUNCTION public.get_incomplete_headwords(integer) TO PUBLIC, anon, authenticated, service_role;
