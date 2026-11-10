-- Phase 2: Educator Studio, Multilingual Courses & Interactive Lesson Player Migration

-- 1. Enhance public.courses with slug, instruction_language, and sort_order
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS instruction_language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Backfill slug for any existing courses
UPDATE public.courses
SET slug = lower(regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || id::text
WHERE slug IS NULL OR slug = '';

ALTER TABLE public.courses
  ALTER COLUMN slug SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'courses_slug_key'
  ) THEN
    ALTER TABLE public.courses ADD CONSTRAINT courses_slug_key UNIQUE (slug);
  END IF;
END $$;

-- 2. Ensure completed_lessons has UNIQUE(user_id, lesson_id)
DELETE FROM public.completed_lessons a
USING public.completed_lessons b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.lesson_id = b.lesson_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'completed_lessons_user_lesson_unique'
  ) THEN
    ALTER TABLE public.completed_lessons
      ADD CONSTRAINT completed_lessons_user_lesson_unique UNIQUE (user_id, lesson_id);
  END IF;
END $$;

-- 3. Ensure enrollments has UNIQUE(user_id, course_id)
DELETE FROM public.enrollments a
USING public.enrollments b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.course_id = b.course_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_user_course_unique'
  ) THEN
    ALTER TABLE public.enrollments
      ADD CONSTRAINT enrollments_user_course_unique UNIQUE (user_id, course_id);
  END IF;
END $$;

-- 4. Create RPC complete_lesson(p_course_id bigint, p_lesson_id bigint)
CREATE OR REPLACE FUNCTION public.complete_lesson(p_course_id bigint, p_lesson_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_already_completed boolean := false;
  v_total_lessons integer := 0;
  v_completed_count integer := 0;
  v_course_done boolean := false;
  v_xp_awarded integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.completed_lessons
    WHERE user_id = v_user_id AND lesson_id = p_lesson_id
  ) INTO v_already_completed;

  IF NOT v_already_completed THEN
    INSERT INTO public.completed_lessons (user_id, lesson_id, completed_at)
    VALUES (v_user_id, p_lesson_id, now())
    ON CONFLICT (user_id, lesson_id) DO NOTHING;

    UPDATE public.profiles
    SET reputation_points = COALESCE(reputation_points, 0) + 10
    WHERE id = v_user_id;

    v_xp_awarded := 10;
  END IF;

  -- Check total lessons in course vs completed lessons
  SELECT count(l.id)
  INTO v_total_lessons
  FROM public.lessons l
  JOIN public.modules m ON m.id = l.module_id
  WHERE m.course_id = p_course_id;

  SELECT count(cl.id)
  INTO v_completed_count
  FROM public.completed_lessons cl
  JOIN public.lessons l ON l.id = cl.lesson_id
  JOIN public.modules m ON m.id = l.module_id
  WHERE m.course_id = p_course_id
    AND cl.user_id = v_user_id;

  v_course_done := (v_total_lessons > 0 AND v_completed_count >= v_total_lessons);

  INSERT INTO public.enrollments (user_id, course_id, current_lesson_id, is_completed, last_accessed_at)
  VALUES (v_user_id, p_course_id, p_lesson_id, v_course_done, now())
  ON CONFLICT (user_id, course_id)
  DO UPDATE SET
    current_lesson_id = EXCLUDED.current_lesson_id,
    is_completed = EXCLUDED.is_completed,
    last_accessed_at = now();

  RETURN jsonb_build_object(
    'xp_awarded', v_xp_awarded,
    'completed_count', v_completed_count,
    'total_lessons', v_total_lessons,
    'course_completed', v_course_done
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_lesson(bigint, bigint) TO authenticated;

-- 5. Seed a rich published sample course if not already present
DO $$
DECLARE
  v_course_id bigint;
  v_dialect_id bigint;
  v_mod1_id bigint;
  v_mod2_id bigint;
  v_les1_id bigint;
  v_les2_id bigint;
  v_les3_id bigint;
  v_aman_id bigint;
  v_aghrum_id bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.courses WHERE slug = 'tamazight-foundations') THEN
    SELECT id INTO v_dialect_id FROM public.dialects ORDER BY id LIMIT 1;
    SELECT id INTO v_aman_id FROM public.headwords WHERE slug = 'aman' LIMIT 1;
    SELECT id INTO v_aghrum_id FROM public.headwords WHERE slug = 'aghrum' LIMIT 1;

    INSERT INTO public.courses (
      title,
      slug,
      description,
      difficulty_level,
      target_dialect_id,
      instruction_language,
      is_published,
      sort_order
    )
    VALUES (
      'Tamaziɣt Foundations: Script, Greetings & Daily Words',
      'tamazight-foundations',
      'Master the essentials of the Amazigh language: Neo-Tifinagh and Latin scripts, core greetings, and everyday vocabulary with dictionary-linked flashcards and quizzes.',
      'beginner',
      v_dialect_id,
      'en',
      true,
      1
    )
    RETURNING id INTO v_course_id;

    -- Module 1
    INSERT INTO public.modules (course_id, title, sort_order)
    VALUES (v_course_id, 'Module 1: Alphabet, Tifinagh & Greetings', 1)
    RETURNING id INTO v_mod1_id;

    -- Module 2
    INSERT INTO public.modules (course_id, title, sort_order)
    VALUES (v_course_id, 'Module 2: Essential Everyday Vocabulary', 2)
    RETURNING id INTO v_mod2_id;

    -- Lesson 1.1
    INSERT INTO public.lessons (module_id, title, sort_order)
    VALUES (v_mod1_id, 'Welcome to Tamaziɣt & Tifinagh Script', 1)
    RETURNING id INTO v_les1_id;

    -- Lesson 1.2
    INSERT INTO public.lessons (module_id, title, sort_order)
    VALUES (v_mod1_id, 'Essential Greetings (Azul, Amek telliḍ)', 2)
    RETURNING id INTO v_les2_id;

    -- Lesson 2.1
    INSERT INTO public.lessons (module_id, title, sort_order)
    VALUES (v_mod2_id, 'Nourishment & Nature: Aman & Aɣrum', 1)
    RETURNING id INTO v_les3_id;

    -- Steps for Lesson 1.1
    INSERT INTO public.steps (lesson_id, step_type, sort_order, content)
    VALUES
      (
        v_les1_id,
        'text',
        1,
        jsonb_build_object(
          'markdown',
          E'# Welcome to Tamaziɣt (ⵜⴰⵎⴰⵣⵉⵖⵜ)\n\nAmazigh is the indigenous language family of North Africa (Tamazɣa), spoken from the Siwa Oasis in Egypt across Libya, Tunisia, Algeria, Morocco, the Canary Islands, and the Sahara.\n\n## The Two Standard Scripts\n\n1. **Tamaziɣt Latin**: Uses standard Latin letters plus special phonological characters such as **ɣ** (`ⵖ`), **ɛ** (`ⵄ`), **č** (`ⵞ`), **ḍ** (`ⴹ`), **ṭ** (`ⵟ`), and **ẓ** (`ⵥ`).\n2. **Neo-Tifinagh (ⵜⵉⴼⵉⵏⴰⵖ)**: The ancient geometric script of North Africa, standardized by IRCAM.\n\n| Latin | Tifinagh | Sound Hint |\n| --- | --- | --- |\n| **a** | ⴰ | "a" as in father |\n| **m** | ⵎ | "m" as in mother |\n| **n** | ⵏ | "n" as in noon |\n| **ɣ** | ⵖ | voiced uvular fricative (French *r* / Arabic *gh*) |'
        )
      ),
      (
        v_les1_id,
        'quiz',
        2,
        jsonb_build_object(
          'questions',
          jsonb_build_array(
            jsonb_build_object(
              'question', 'Which Tifinagh letter represents the sound "m"?',
              'answers', jsonb_build_array('ⴰ', 'ⵎ', 'ⵏ', 'ⵖ'),
              'correct_index', 1,
              'explanation', 'ⵎ (yam) represents "m", as in ⴰⵎⴰⵏ (aman - water).'
            ),
            jsonb_build_object(
              'question', 'How is the word "aman" (water) written in Tifinagh?',
              'answers', jsonb_build_array('ⴰⵎⴰⵏ', 'ⴰⵖⵔⵓⵎ', 'ⵜⴰⵎⴰⵣⵉⵖⵜ', 'ⴰⵣⵓⵍ'),
              'correct_index', 0,
              'explanation', 'ⴰ (a) + ⵎ (m) + ⴰ (a) + ⵏ (n) spells ⴰⵎⴰⵏ (aman).'
            )
          )
        )
      );

    -- Steps for Lesson 1.2
    INSERT INTO public.steps (lesson_id, step_type, sort_order, content)
    VALUES
      (
        v_les2_id,
        'text',
        1,
        jsonb_build_object(
          'markdown',
          E'# Everyday Greetings\n\nWhether in Kabylia, the Rif, the Atlas mountains, or the Souss valley, greetings are warm and central to Amazigh hospitality.\n\n- **Azul (ⴰⵣⵓⵍ)** — Hello / Peace (literally "from the heart")\n- **Azul fell-awen (ⴰⵣⵓⵍ ⴼⵍⵍⴰⵡⵏ)** — Hello to you all\n- **Amek telliḍ? / Manzakîn?** — How are you?\n- **Tanemmirt (ⵜⴰⵏⵎⵎⵉⵔⵜ)** — Thank you\n- **Ar tufat (ⴰⵔ ⵜⵓⴼⴰⵜ)** — See you tomorrow / Goodbye'
        )
      ),
      (
        v_les2_id,
        'flashcard',
        2,
        jsonb_build_object(
          'deck_title', 'Core Greetings Deck',
          'cards',
          jsonb_build_array(
            jsonb_build_object(
              'front_latin', 'Azul',
              'front_tifinagh', 'ⴰⵣⵓⵍ',
              'back_text', 'Hello / Peace',
              'notes', 'Universal Amazigh greeting used across North Africa.'
            ),
            jsonb_build_object(
              'front_latin', 'Tanemmirt',
              'front_tifinagh', 'ⵜⴰⵏⵎⵎⵉⵔⵜ',
              'back_text', 'Thank you',
              'notes', 'Often followed by "bahra" or "aṭas" (very much).'
            ),
            jsonb_build_object(
              'front_latin', 'Ar tufat',
              'front_tifinagh', 'ⴰⵔ ⵜⵓⴼⴰⵜ',
              'back_text', 'See you later / Until tomorrow',
              'notes', 'Used when parting ways.'
            )
          )
        )
      );

    -- Steps for Lesson 2.1 (linked to Dictionary headwords!)
    INSERT INTO public.steps (lesson_id, step_type, sort_order, linked_headword_id, content)
    VALUES
      (
        v_les3_id,
        'flashcard',
        1,
        v_aman_id,
        jsonb_build_object(
          'deck_title', 'Essential Sustenance: Water & Bread',
          'cards',
          jsonb_build_array(
            jsonb_build_object(
              'front_latin', 'Aman',
              'front_tifinagh', 'ⴰⵎⴰⵏ',
              'back_text', 'Water (masculine plural noun)',
              'notes', 'Construct state (Addad Amaruz): waman. Shared across virtually all Amazigh dialects!'
            ),
            jsonb_build_object(
              'front_latin', 'Aɣrum',
              'front_tifinagh', 'ⴰⵖⵔⵓⵎ',
              'back_text', 'Bread (masculine singular noun)',
              'notes', 'Construct state: uɣrum. Pronounced with the uvular fricative ɣ (ⵖ).'
            )
          )
        )
      ),
      (
        v_les3_id,
        'quiz',
        2,
        v_aghrum_id,
        jsonb_build_object(
          'questions',
          jsonb_build_array(
            jsonb_build_object(
              'question', 'What does "Aɣrum" (ⴰⵖⵔⵓⵎ) mean in English?',
              'answers', jsonb_build_array('Water', 'Bread', 'Sun', 'Thank you'),
              'correct_index', 1,
              'explanation', 'Aɣrum (ⴰⵖⵔⵓⵎ) means bread, while Aman (ⴰⵎⴰⵏ) means water.'
            ),
            jsonb_build_object(
              'question', 'Which word means "Thank you" in Tamaziɣt?',
              'answers', jsonb_build_array('Azul', 'Tanemmirt', 'Aman', 'Aɣrum'),
              'correct_index', 1,
              'explanation', 'Tanemmirt (ⵜⴰⵏⵎⵎⵉⵔⵜ) means "Thank you".'
            )
          )
        )
      );
  END IF;
END $$;
