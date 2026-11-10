/* eslint-disable @typescript-eslint/no-explicit-any */
import { saveLessonSchema, strictStepSchema } from '$lib/schemas';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

export const load = async ({ params, locals: { supabase } }) => {
  const { lessonId, courseId } = params;

  const { data: lesson, error } = await supabase
    .from('lessons')
    .select(`*, steps (*)`)
    .eq('id', Number(lessonId))
    .order('sort_order', { referencedTable: 'steps', ascending: true })
    .single();

  if (error || !lesson) throw redirect(302, `/admin/courses/${courseId}/curriculum`);

  const form = await superValidate(zod4(saveLessonSchema));

  return { lesson, form };
};

export const actions = {
  saveLesson: async ({ request, params, locals: { supabase } }) => {
    const form = await superValidate(request, zod4(saveLessonSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    let validSteps;

    try {
      const rawJson = JSON.parse(form.data.steps_data);

      const shapedSteps = rawJson.map((s: any) => ({
        id: s.id,
        linked_headword_id: s.linked_headword_id ?? null,
        data: { type: s.type, content: s.content ?? {} }
      }));

      const parsed = z.array(strictStepSchema).safeParse(shapedSteps);

      if (!parsed.success) {
        console.error('Validation Error:', parsed.error);
        return message(form, 'Invalid step data structure.', { status: 400 });
      }

      validSteps = parsed.data;
    } catch {
      return message(form, 'Invalid JSON format.', { status: 400 });
    }

    const lessonId = parseInt(params.lessonId);
    if (isNaN(lessonId)) return fail(400, { form });

    // Handle Deletions
    const { data: existingSteps } = await supabase
      .from('steps')
      .select('id')
      .eq('lesson_id', lessonId);

    const existingIds = existingSteps?.map((s: { id: number }) => s.id) || [];
    const submittedIds = validSteps
      .filter((s) => typeof s.id === 'number')
      .map((s) => s.id as number);
    const idsToDelete = existingIds.filter((id: number) => !submittedIds.includes(id));

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('steps')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('Delete Error:', deleteError);
        return message(form, 'Failed to remove deleted steps.', { status: 500 });
      }
    }

    // Handle Upserts (Updates & Inserts with updated sort_order)
    const upsertPromises = validSteps.map(async (step, index) => {
      const payload = {
        lesson_id: lessonId,
        step_type: step.data.type,
        linked_headword_id: step.linked_headword_id ?? null,
        content: step.data.content,
        sort_order: index + 1
      };

      if (typeof step.id === 'number') {
        return supabase.from('steps').update(payload).eq('id', step.id);
      } else {
        return supabase.from('steps').insert(payload);
      }
    });

    const results = await Promise.all(upsertPromises);

    const hasError = results.some((r: any) => r.error);
    if (hasError) {
      return message(form, 'Saved with some errors. Please check data.', { status: 500 });
    }

    return message(form, 'Lesson saved successfully!');
  }
};
