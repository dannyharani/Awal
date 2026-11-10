-- Add category and tags to courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'conversation',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- Update the seeded sample course
UPDATE public.courses
SET category = 'alphabet',
    tags = ARRAY['script', 'tifinagh', 'greetings', 'daily-words', 'foundations']
WHERE slug = 'tamazight-foundations';

-- Create an index on category for fast filtering
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
