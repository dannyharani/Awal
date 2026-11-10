import { z } from 'zod';
import { locales } from '$lib/paraglide/runtime';

export const definitionSchema = z.object({
  headword_id: z.coerce.number().int().default(0),
  dialect_id: z.coerce.number().int().min(1, 'Please select a dialect').default(0),
  definition_text: z.string().min(3, 'Definition is too short').max(500).default(''),

  // Linguistic / Grammar Attributes (stored in definitions.attributes JSONB)
  part_of_speech: z.string().max(40).optional().default(''),
  gender: z.string().max(30).optional().default(''),
  grammatical_number: z.string().max(30).optional().default(''),
  construct_state: z.string().max(60).optional().default(''),
  plural: z.string().max(60).optional().default(''),
  root: z.string().max(30).optional().default(''),
  verb_stems: z.string().max(100).optional().default(''),

  // Example sentence
  example_sentence: z.string().max(200, 'Sentence too long').optional().default(''),
  example_translation: z.string().max(200, 'Translation too long').optional().default(''),

  // File validation: Optional, max 500KB
  audio: z
    .instanceof(File, { message: 'Invalid file' })
    .refine((f) => f.size < 500 * 1024, 'Max 500KB')
    .optional()
});

export const headwordSchema = z.object({
  // Latin is required because we generate the URL slug from it
  script_latin: z
    .string()
    .min(1, 'Word is too short')
    .max(50, 'Word is too long')
    .regex(
      /^[a-zA-Z\u00C0-\u02AF\u1E00-\u1EFFɣƔɛƐčČǧǦḍḌṭṬẓẒḥḤṣṢṛṚʷγγε\s'-]+$/,
      'Invalid characters in Latin script'
    ),

  // Optional scripts
  script_tifinagh: z.string().max(50).optional(),
  script_arabic: z.string().max(50).optional()
});

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),

  first_name: z.string().max(50).optional(),
  last_name: z.string().max(50).optional(),

  bio: z.string().max(160, 'Bio must be less than 160 characters').optional(),

  // Avatar is strictly a file object for the form
  avatar: z
    .instanceof(File, { message: 'Invalid file' })
    .refine((f) => f.size < 2 * 1024 * 1024, 'Max size 2MB') // 2MB limit
    .optional()
});

export const settingsSchema = z.object({
  preferred_locale: z.enum([...locales] as [string, ...string[]], {
    message: 'Please select a valid language.'
  }),
  theme: z.enum(['light', 'dark', 'system']).optional().default('system')
});

export const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long'),

  description: z.string().max(500, 'Description is too long').optional().default(''),

  difficulty_level: z
    .enum(['beginner', 'intermediate', 'advanced'], {
      message: 'Please select a valid difficulty'
    })
    .default('beginner'),

  target_dialect_id: z.coerce.number().int().min(1, 'Please select a dialect').default(0)
});

export const createLessonSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  module_id: z.coerce.number().int()
});

export const createModuleSchema = z.object({
  title: z.string().min(2, 'Title too short').max(100)
});

const textContent = z.object({
  markdown: z.string().min(1, 'Content cannot be empty')
});

const videoContent = z.object({
  video_url: z.string().url('Invalid video URL'),
  duration_seconds: z.coerce.number().optional()
});

const quizContent = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        answers: z.array(z.string()),
        correct_index: z.number().int()
      })
    )
    .min(1, 'Must have at least one question')
});

export const createStepSchema = z.object({
  lesson_id: z.coerce.number(),
  step_type: z.enum(['text', 'video', 'flashcard', 'quiz']),

  // Dynamic content validation
  content: z.union([textContent, videoContent, quizContent, z.record(z.string(), z.any())])
});

export const textStepSchema = z.object({
  step_id: z.number(),
  content: z.object({
    markdown: z.string().default('')
  })
});

export const videoStepSchema = z.object({
  step_id: z.number(),
  content: z.object({
    video_url: z.string().url('Invalid URL').default(''),
    duration: z.coerce.number().optional()
  })
});

export const stepItemSchema = z.object({
  id: z.union([z.number(), z.string()]),
  type: z.enum(['text', 'video', 'flashcard', 'quiz']),
  content: z.record(z.any(), z.any())
});

export const saveLessonSchema = z.object({
  steps_data: z.string()
});

export const strictStepSchema = z.object({
  id: z.union([z.number(), z.string()]),

  data: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('text'),
      content: z.object({ markdown: z.string().optional().default('') })
    }),
    z.object({
      type: z.literal('video'),
      content: z.object({
        url: z.string().optional(),
        video_url: z.string().optional()
      })
    }),
    z.object({
      type: z.literal('flashcard'),
      content: z.record(z.string(), z.any())
    }),
    z.object({
      type: z.literal('quiz'),
      content: z.object({
        questions: z.array(z.any()).optional()
      })
    })
  ])
});
