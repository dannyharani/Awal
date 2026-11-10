<script lang="ts">
  import { enhance } from '$app/forms';
  import { superForm } from 'sveltekit-superforms';
  import { locales } from '$lib/paraglide/runtime';
  import {
    GripVertical,
    Plus,
    ArrowUp,
    ArrowDown,
    Trash2,
    Settings2,
    Eye,
    CheckCircle2,
    ArrowLeft
  } from '@lucide/svelte';

  // UI Components
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import { Label } from '$lib/components/ui/label';

  let { data } = $props();

  // Local reactive state of modules & lessons for instant Drag-and-Drop reordering
  // svelte-ignore state_referenced_locally
  let modulesList = $state(
    (data.course.modules ?? []).map((m: any) => ({
      ...m,
      lessons: [...(m.lessons ?? [])]
    }))
  );

  $effect(() => {
    modulesList = (data.course.modules ?? []).map((m: any) => ({
      ...m,
      lessons: [...(m.lessons ?? [])]
    }));
  });

  // --- Module Form ---
  // svelte-ignore state_referenced_locally
  const {
    form: mForm,
    enhance: mEnhance,
    delayed: mDelayed
  } = superForm(data.moduleForm, {
    resetForm: true
  });

  // --- Lesson Form ---
  // svelte-ignore state_referenced_locally
  const {
    form: lForm,
    enhance: lEnhance,
    delayed: lDelayed,
    message: lMessage
  } = superForm(data.lessonForm, {
    id: 'createLesson',
    resetForm: true,
    onResult: ({ result }) => {
      if (result.type === 'success') {
        dialogOpen = false;
      }
    }
  });

  // --- State for Dialogs ---
  let dialogOpen = $state(false);
  let editCourseOpen = $state(false);
  let orderSaved = $state(false);

  // Drag-and-drop state for modules
  let draggedModuleIdx = $state<number | null>(null);
  let dragOverModuleIdx = $state<number | null>(null);
  let moduleReorderForm: HTMLFormElement;

  // Drag-and-drop state for lessons within a module
  let draggedLesson = $state<{ modIdx: number; lesIdx: number } | null>(null);
  let dragOverLesson = $state<{ modIdx: number; lesIdx: number } | null>(null);
  let activeReorderModuleId = $state<number>(0);
  let activeReorderLessonIds = $state<number[]>([]);
  let lessonReorderForm: HTMLFormElement;

  function openAddLesson(moduleId: number) {
    $lForm.module_id = moduleId;
    dialogOpen = true;
  }

  // --- Module Reordering ---
  function onModuleDragStart(modIdx: number, e: DragEvent) {
    // Do not start module drag if a lesson drag is active
    if (draggedLesson !== null) return;
    draggedModuleIdx = modIdx;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', `mod:${modIdx}`);
    }
  }

  function onModuleDragOver(modIdx: number, e: DragEvent) {
    if (draggedModuleIdx === null || draggedModuleIdx === modIdx) return;
    e.preventDefault();
    dragOverModuleIdx = modIdx;
  }

  function onModuleDrop(targetIdx: number, e: DragEvent) {
    if (draggedModuleIdx === null || draggedModuleIdx === targetIdx) {
      draggedModuleIdx = null;
      dragOverModuleIdx = null;
      return;
    }
    e.preventDefault();
    const updated = [...modulesList];
    const [moved] = updated.splice(draggedModuleIdx, 1);
    updated.splice(targetIdx, 0, moved);
    modulesList = updated;
    draggedModuleIdx = null;
    dragOverModuleIdx = null;
    setTimeout(() => moduleReorderForm?.requestSubmit(), 10);
  }

  function moveModule(modIdx: number, dir: -1 | 1) {
    const target = modIdx + dir;
    if (target < 0 || target >= modulesList.length) return;
    const updated = [...modulesList];
    const [moved] = updated.splice(modIdx, 1);
    updated.splice(target, 0, moved);
    modulesList = updated;
    setTimeout(() => moduleReorderForm?.requestSubmit(), 10);
  }

  // --- Lesson Reordering ---
  function onLessonDragStart(modIdx: number, lesIdx: number, e: DragEvent) {
    e.stopPropagation();
    draggedLesson = { modIdx, lesIdx };
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', `les:${modIdx}:${lesIdx}`);
    }
  }

  function onLessonDragOver(modIdx: number, lesIdx: number, e: DragEvent) {
    if (!draggedLesson || draggedLesson.modIdx !== modIdx) return;
    if (draggedLesson.lesIdx === lesIdx) return;
    e.preventDefault();
    e.stopPropagation();
    dragOverLesson = { modIdx, lesIdx };
  }

  function onLessonDrop(modIdx: number, targetLesIdx: number, e: DragEvent) {
    if (!draggedLesson || draggedLesson.modIdx !== modIdx) return;
    e.preventDefault();
    e.stopPropagation();

    const fromIdx = draggedLesson.lesIdx;
    if (fromIdx === targetLesIdx) {
      draggedLesson = null;
      dragOverLesson = null;
      return;
    }

    const lessons = [...modulesList[modIdx].lessons];
    const [moved] = lessons.splice(fromIdx, 1);
    lessons.splice(targetLesIdx, 0, moved);
    modulesList[modIdx].lessons = lessons;

    activeReorderModuleId = modulesList[modIdx].id;
    activeReorderLessonIds = lessons.map((l: any) => l.id);

    draggedLesson = null;
    dragOverLesson = null;
    setTimeout(() => lessonReorderForm?.requestSubmit(), 10);
  }

  function moveLesson(modIdx: number, lesIdx: number, dir: -1 | 1) {
    const lessons = [...modulesList[modIdx].lessons];
    const target = lesIdx + dir;
    if (target < 0 || target >= lessons.length) return;
    const [moved] = lessons.splice(lesIdx, 1);
    lessons.splice(target, 0, moved);
    modulesList[modIdx].lessons = lessons;

    activeReorderModuleId = modulesList[modIdx].id;
    activeReorderLessonIds = lessons.map((l: any) => l.id);
    setTimeout(() => lessonReorderForm?.requestSubmit(), 10);
  }
</script>

<div class="mx-auto max-w-4xl px-4 py-10">
  <!-- Hidden Reorder Forms -->
  <form
    bind:this={moduleReorderForm}
    method="POST"
    action="?/reorderModules"
    use:enhance={() => {
      return async ({ update }) => {
        orderSaved = true;
        await update({ reset: false });
        setTimeout(() => (orderSaved = false), 2000);
      };
    }}
    class="hidden"
  >
    <input
      type="hidden"
      name="order_json"
      value={JSON.stringify(modulesList.map((m: any) => m.id))}
    />
  </form>

  <form
    bind:this={lessonReorderForm}
    method="POST"
    action="?/reorderLessons"
    use:enhance={() => {
      return async ({ update }) => {
        orderSaved = true;
        await update({ reset: false });
        setTimeout(() => (orderSaved = false), 2000);
      };
    }}
    class="hidden"
  >
    <input type="hidden" name="module_id" value={activeReorderModuleId} />
    <input type="hidden" name="order_json" value={JSON.stringify(activeReorderLessonIds)} />
  </form>

  <!-- Header -->
  <div class="mb-8 flex flex-wrap items-start justify-between gap-4">
    <div class="space-y-1">
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon" href="/admin/courses" class="-ml-2 h-8 w-8">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <Badge variant={data.course.is_published ? 'default' : 'outline'}>
          {data.course.is_published ? 'Published' : 'Draft'}
        </Badge>
        <Badge variant="secondary" class="uppercase">
          {data.course.instruction_language || 'en'}
        </Badge>
        {#if orderSaved}
          <span class="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <CheckCircle2 class="h-3.5 w-3.5" /> Order saved
          </span>
        {/if}
      </div>
      <h1 class="text-3xl font-bold">{data.course.title}</h1>
      <p class="text-muted-foreground text-sm">
        Curriculum Builder — Drag modules or lessons (or use the up/down arrows) to reorder.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" href="/courses/{data.course.slug}" class="gap-1.5">
        <Eye class="h-4 w-4" />
        Preview Course
      </Button>

      <Button
        variant="outline"
        size="sm"
        onclick={() => (editCourseOpen = true)}
        class="gap-1.5"
      >
        <Settings2 class="h-4 w-4" />
        Settings
      </Button>

      <form method="POST" action="?/togglePublish" use:enhance>
        <input
          type="hidden"
          name="is_published"
          value={data.course.is_published ? 'false' : 'true'}
        />
        <Button
          type="submit"
          size="sm"
          variant={data.course.is_published ? 'secondary' : 'default'}
        >
          {data.course.is_published ? 'Unpublish Course' : 'Publish Course'}
        </Button>
      </form>
    </div>
  </div>

  <!-- Modules & Lessons List -->
  <div class="space-y-6" role="list">
    {#if modulesList.length > 0}
      {#each modulesList as module, modIdx (module.id)}
        <div
          role="listitem"
          draggable="true"
          ondragstart={(e) => onModuleDragStart(modIdx, e)}
          ondragover={(e) => onModuleDragOver(modIdx, e)}
          ondrop={(e) => onModuleDrop(modIdx, e)}
          ondragend={() => {
            draggedModuleIdx = null;
            dragOverModuleIdx = null;
          }}
          class="transition-all {dragOverModuleIdx === modIdx
            ? 'ring-primary rounded-xl ring-2'
            : ''} {draggedModuleIdx === modIdx ? 'opacity-50' : ''}"
        >
          <Card.Root class="mb-4">
            <Card.Header class="pb-3">
              <div class="flex items-center gap-2.5">
                <div
                  class="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                  title="Drag to reorder module"
                >
                  <GripVertical class="h-5 w-5" />
                </div>

                <div class="flex items-center gap-0.5">
                  <button
                    type="button"
                    onclick={() => moveModule(modIdx, -1)}
                    disabled={modIdx === 0}
                    class="text-muted-foreground hover:text-foreground rounded p-0.5 disabled:opacity-25"
                    title="Move module up"
                  >
                    <ArrowUp class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onclick={() => moveModule(modIdx, 1)}
                    disabled={modIdx === modulesList.length - 1}
                    class="text-muted-foreground hover:text-foreground rounded p-0.5 disabled:opacity-25"
                    title="Move module down"
                  >
                    <ArrowDown class="h-3.5 w-3.5" />
                  </button>
                </div>

                <h3 class="text-xl font-semibold">{module.title}</h3>

                <div class="ml-auto flex items-center gap-2">
                  <span class="text-muted-foreground text-xs">Module {modIdx + 1}</span>
                  <form method="POST" action="?/deleteModule" use:enhance>
                    <input type="hidden" name="module_id" value={module.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      class="text-muted-foreground hover:text-destructive h-7 w-7"
                      title="Delete module"
                    >
                      <Trash2 class="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>
              </div>
            </Card.Header>
            <Separator />
            <Card.Content class="bg-muted/20 min-h-[100px] pt-4">
              {#if module.lessons && module.lessons.length > 0}
                <div class="space-y-2" role="list">
                  {#each module.lessons as lesson, lesIdx (lesson.id)}
                    <div
                      role="listitem"
                      draggable="true"
                      ondragstart={(e) => onLessonDragStart(modIdx, lesIdx, e)}
                      ondragover={(e) => onLessonDragOver(modIdx, lesIdx, e)}
                      ondrop={(e) => onLessonDrop(modIdx, lesIdx, e)}
                      ondragend={() => {
                        draggedLesson = null;
                        dragOverLesson = null;
                      }}
                      class="bg-background flex items-center rounded-md border p-3 shadow-sm transition-all {dragOverLesson?.modIdx ===
                        modIdx && dragOverLesson?.lesIdx === lesIdx
                        ? 'border-primary ring-primary/30 ring-2'
                        : ''} {draggedLesson?.modIdx === modIdx && draggedLesson?.lesIdx === lesIdx
                        ? 'opacity-50'
                        : ''}"
                    >
                      <div
                        class="text-muted-foreground hover:text-foreground mr-2 cursor-grab active:cursor-grabbing"
                        title="Drag to reorder lesson"
                      >
                        <GripVertical class="h-4 w-4" />
                      </div>

                      <div class="mr-3 flex items-center gap-0.5">
                        <button
                          type="button"
                          onclick={() => moveLesson(modIdx, lesIdx, -1)}
                          disabled={lesIdx === 0}
                          class="text-muted-foreground hover:text-foreground rounded p-0.5 disabled:opacity-25"
                          title="Move lesson up"
                        >
                          <ArrowUp class="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onclick={() => moveLesson(modIdx, lesIdx, 1)}
                          disabled={lesIdx === module.lessons.length - 1}
                          class="text-muted-foreground hover:text-foreground rounded p-0.5 disabled:opacity-25"
                          title="Move lesson down"
                        >
                          <ArrowDown class="h-3 w-3" />
                        </button>
                      </div>

                      <a
                        href="/admin/courses/{data.course.id}/lessons/{lesson.id}"
                        class="hover:text-primary flex-1 font-medium transition-colors hover:underline"
                      >
                        {lesson.title}
                      </a>

                      <span class="text-muted-foreground mr-3 text-xs">
                        {lesson.steps?.length ?? 0} steps
                      </span>

                      <form method="POST" action="?/deleteLesson" use:enhance>
                        <input type="hidden" name="lesson_id" value={lesson.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          class="text-muted-foreground hover:text-destructive h-7 w-7"
                          title="Delete lesson"
                        >
                          <Trash2 class="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    </div>
                  {/each}
                </div>
              {:else}
                <div
                  class="text-muted-foreground rounded-lg border-2 border-dashed py-6 text-center text-sm"
                >
                  No lessons in this module yet.
                </div>
              {/if}

              <div class="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-muted-foreground hover:text-primary"
                  onclick={() => openAddLesson(module.id)}
                >
                  <Plus class="mr-2 h-4 w-4" /> Add Lesson
                </Button>
              </div>
            </Card.Content>
          </Card.Root>
        </div>
      {/each}
    {:else}
      <div class="rounded-xl border-2 border-dashed py-12 text-center">
        <h3 class="text-lg font-medium">No modules yet</h3>
        <p class="text-muted-foreground">Start by adding your first module below.</p>
      </div>
    {/if}

    <Card.Root class="bg-muted/10 border-2 border-dashed">
      <Card.Content class="pt-6">
        <form method="POST" action="?/createModule" use:mEnhance class="flex items-end gap-4">
          <div class="grid w-full gap-1.5">
            <span class="text-sm leading-none font-medium">New Module Title</span>
            <Input
              name="title"
              bind:value={$mForm.title}
              placeholder="e.g. The Alphabet & Pronunciation"
              disabled={$mDelayed}
            />
          </div>
          <Button type="submit" disabled={$mDelayed}>
            {#if $mDelayed}Adding...{:else}<Plus class="mr-2 h-4 w-4" /> Add Module{/if}
          </Button>
        </form>
      </Card.Content>
    </Card.Root>
  </div>
</div>

<!-- Add Lesson Dialog -->
<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Add New Lesson</Dialog.Title>
      <Dialog.Description>Add a lesson to the selected module.</Dialog.Description>
    </Dialog.Header>

    <form method="POST" action="?/createLesson" use:lEnhance id="add-lesson-form" class="space-y-4">
      <input type="hidden" name="module_id" bind:value={$lForm.module_id} />

      <div class="space-y-2">
        <Label for="lesson-title">Lesson Title</Label>
        <Input
          id="lesson-title"
          name="title"
          bind:value={$lForm.title}
          placeholder="e.g. Greetings & Introductions"
        />
        {#if $lMessage}
          <p class="text-destructive text-sm">{$lMessage}</p>
        {/if}
      </div>
    </form>

    <Dialog.Footer>
      <Button type="submit" form="add-lesson-form" disabled={$lDelayed}>
        {#if $lDelayed}Saving...{:else}Create Lesson{/if}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Edit Course Settings Dialog -->
<Dialog.Root bind:open={editCourseOpen}>
  <Dialog.Content class="sm:max-w-[500px]">
    <Dialog.Header>
      <Dialog.Title>Course Settings</Dialog.Title>
      <Dialog.Description>Update metadata, dialect, and instruction language.</Dialog.Description>
    </Dialog.Header>

    <form
      method="POST"
      action="?/updateCourse"
      use:enhance={() => {
        return async ({ update }) => {
          editCourseOpen = false;
          await update();
        };
      }}
      class="space-y-4 py-2"
    >
      <div class="space-y-1.5">
        <Label>Course Title</Label>
        <Input name="title" value={data.course.title} required />
      </div>

      <div class="space-y-1.5">
        <Label>Description</Label>
        <Textarea name="description" value={data.course.description ?? ''} class="min-h-[90px]" />
      </div>

      <div class="grid grid-cols-3 gap-3">
        <div class="space-y-1.5">
          <Label class="text-xs">Difficulty</Label>
          <select
            name="difficulty_level"
            value={data.course.difficulty_level ?? 'beginner'}
            class="border-input bg-background flex h-9 w-full rounded-md border px-2 text-xs"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div class="space-y-1.5">
          <Label class="text-xs">Target Dialect</Label>
          <select
            name="target_dialect_id"
            value={data.course.target_dialect_id ?? ''}
            class="border-input bg-background flex h-9 w-full rounded-md border px-2 text-xs"
          >
            {#each data.dialects as d}
              <option value={d.id}>{d.name}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-1.5">
          <Label class="text-xs">Instruction Language</Label>
          <select
            name="instruction_language"
            value={data.course.instruction_language ?? 'en'}
            class="border-input bg-background flex h-9 w-full rounded-md border px-2 text-xs uppercase"
          >
            {#each locales as loc}
              <option value={loc}>{loc.toUpperCase()}</option>
            {/each}
          </select>
        </div>
      </div>

      <Dialog.Footer class="pt-3">
        <Button type="button" variant="ghost" onclick={() => (editCourseOpen = false)}>
          Cancel
        </Button>
        <Button type="submit">Save Settings</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
