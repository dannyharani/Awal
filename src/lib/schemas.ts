import { z } from 'zod';

export const definitionSchema = z.object({
  headword_id: z.coerce.number().int().default(0),
  dialect_id: z.coerce.number().int().min(1, 'Please select a dialect').default(0),
  definition_text: z.string().min(12, 'Definition is too short').max(500).default(''),

  // NEW FIELDS
  example_sentence: z.string().max(200, 'Sentence too long').optional().default(''),
  example_translation: z.string().max(200, 'Translation too long').optional().default(''),

  // File validation: Optional, max 5MB
  audio: z
    .instanceof(File, { message: 'Invalid file' })
    .refine((f) => f.size < 500 * 1024, 'Max 500KB')
    .optional()
});

export const headwordSchema = z.object({
  // Latin is required because we generate the URL slug from it
  script_latin: z
    .string()
    .min(2, 'Word is too short')
    .max(50, 'Word is too long')
    .regex(/^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s-]+$/, 'Invalid characters in Latin script'), // Allows standard extended Latin

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

import { locales } from '$lib/paraglide/runtime';

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

  target_dialect_id: z.coerce.number().int().min(1, 'Please select a dialect').default(0) // Default 0 acts as a placeholder
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
  step_id: z.number(), // We need this to know which row to update
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

// 2. The Shape of a Single Step in the JSON Array
export const stepItemSchema = z.object({
  id: z.union([z.number(), z.string()]), // Number = DB ID, String = Temp ID
  type: z.enum(['text', 'video', 'flashcard', 'quiz']),
  content: z.record(z.any(), z.any()) // We validate strictly below based on type
});

// 3. The Form Schema (Hidden Input)
export const saveLessonSchema = z.object({
  steps_data: z.string() // The JSON string
});

export const strictStepSchema = z.object({
  // ID can be a database ID (number) or a temp ID (string)
  id: z.union([z.number(), z.string()]),

  // Discriminated union to validate content based on type
  data: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('text'),
      content: z.object({ markdown: z.string().optional().default('') })
    }),
    z.object({
      type: z.literal('video'),
      content: z.object({
        // Note: Accepting 'url' or 'video_url' to match your UI implementation
        url: z.string().optional(),
        video_url: z.string().optional()
      })
    }),
    z.object({
      type: z.literal('flashcard'),
      content: z.record(z.string(), z.any()) // Define strictly if you have flashcard fields
    }),
    z.object({
      type: z.literal('quiz'),
      content: z.object({
        questions: z.array(z.any()).optional()
      })
    })
  ])
});
