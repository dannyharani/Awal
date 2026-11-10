/* eslint-disable @typescript-eslint/no-explicit-any */
import { saveLessonSchema, stepItemSchema, strictStepSchema } from '$lib/schemas';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

export const load = async ({ params, locals: { supabase } }) => {
  const { lessonId, courseId } = params;

  // Fetch Lesson + Steps (Ordered)
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select(`*, steps (*)`)
    .eq('id', Number(lessonId))
    .order('sort_order', { referencedTable: 'steps', ascending: true })
    .single();

  if (error || !lesson) throw redirect(302, `/courses/${courseId}/curriculum`);

  // Initialize the save form
  const form = await superValidate(zod4(saveLessonSchema));

  return { lesson, form };
};

// --- ACTIONS ---
export const actions = {
  saveLesson: async ({ request, params, locals: { supabase } }) => {
    // 1. Validate the Form Shell (the hidden input exists)
    const form = await superValidate(request, zod4(saveLessonSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    // 2. Parse & Validate the JSON Array strictly
    let validSteps;

    try {
      const rawJson = JSON.parse(form.data.steps_data);

      // Map the raw JSON to the structure expected by our strict schema
      // We do this to wrap 'type' and 'content' into the 'data' discriminator
      const shapedSteps = rawJson.map((s: any) => ({
        id: s.id,
        data: { type: s.type, content: s.content }
      }));

      // Validate the array
      const parsed = z.array(strictStepSchema).safeParse(shapedSteps);

      if (!parsed.success) {
        console.error('Validation Error:', parsed.error);
        return message(form, 'Invalid step data structure.', { status: 400 });
      }

      validSteps = parsed.data;
    } catch (e) {
      return message(form, 'Invalid JSON format.', { status: 400 });
    }

    const lessonId = parseInt(params.lessonId);
    if (isNaN(lessonId)) return fail(400, { form });

    // 3. Handle Deletions
    // Fetch all existing step IDs for this lesson
    const { data: existingSteps } = await supabase.from('steps').select('id').eq('lesson_id', lessonId);

    const existingIds = existingSteps?.map((s: { id: number }) => s.id) || [];

    // Get IDs currently present in the submission (only the numeric ones are in DB)
    const submittedIds = validSteps.filter((s) => typeof s.id === 'number').map((s) => s.id as number);

    // Identify IDs to remove (In DB but not in Submission)
    const idsToDelete = existingIds.filter((id: number) => !submittedIds.includes(id));

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase.from('steps').delete().in('id', idsToDelete);

      if (deleteError) {
        console.error('Delete Error:', deleteError);
        return message(form, 'Failed to remove deleted steps.', { status: 500 });
      }
    }

    // 4. Handle Upserts (Updates & Inserts)
    const upsertPromises = validSteps.map(async (step, index) => {
      // Common payload
      const payload = {
        lesson_id: lessonId,
        step_type: step.data.type,
        content: step.data.content,
        sort_order: index + 1
      };

      if (typeof step.id === 'number') {
        // UPDATE Existing Step
        return supabase.from('steps').update(payload).eq('id', step.id);
      } else {
        // INSERT New Step (Supabase ignores the temp string ID and generates a new int ID)
        return supabase.from('steps').insert(payload);
      }
    });

    const results = await Promise.all(upsertPromises);

    // Check for any errors in the batch
    const hasError = results.some((r: any) => r.error);
    if (hasError) {
      return message(form, 'Saved with some errors. Please check data.', { status: 500 });
    }

    // 5. Success
    // Re-validate form to return fresh state if needed, or just return message
    return message(form, 'Lesson saved successfully!');
  }
};
