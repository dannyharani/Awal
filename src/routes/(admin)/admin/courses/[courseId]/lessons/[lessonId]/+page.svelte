<script lang="ts">
  import { enhance as svelteKitEnhance } from '$app/forms';
  import { superForm } from 'sveltekit-superforms';
  import { page } from '$app/state';
  import {
    FileText,
    Video,
    BrainCircuit,
    CircleQuestionMark,
    ArrowLeft,
    GripVertical,
    ArrowUp,
    ArrowDown,
    Layers,
    Trash2,
    Save,
    CheckCircle2,
    Pencil,
    Check,
    X
  } from '@lucide/svelte';

  // UI Components
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Input } from '$lib/components/ui/input';

  // Editors
  import TextEdit from '$lib/components/courses/lessons/TextEdit.svelte';
  import VideoEdit from '$lib/components/courses/lessons/VideoEdit.svelte';
  import FlashcardEdit from '$lib/components/courses/lessons/FlashcardEdit.svelte';
  import QuizEdit from '$lib/components/courses/lessons/QuizEdit.svelte';

  // Types
  import type { Step } from '$lib/types';

  let { data } = $props();
  // svelte-ignore state_referenced_locally
  const { enhance, delayed, message } = superForm(data.form, {});

  // Lesson Title Editing State
  // svelte-ignore state_referenced_locally
  let lessonTitle = $state(data.lesson.title);
  let editingLessonHeader = $state(false);
  // svelte-ignore state_referenced_locally
  let headerLessonTitle = $state(data.lesson.title);

  // 1. Initialize Local State
  // svelte-ignore state_referenced_locally
  let steps = $state<Step[]>(
    data.lesson.steps.map((s: any) => ({
      id: s.id,
      type: s.step_type,
      sort_order: s.sort_order,
      linked_headword_id: s.linked_headword_id ?? null,
      content: s.content ?? {},
      isNew: false
    }))
  );

  // svelte-ignore state_referenced_locally
  let selectedStepId = $state<string | number | null>(steps.length > 0 ? steps[0].id : null);

  let selectedStep = $derived(steps.find((s) => s.id === selectedStepId));

  // Drag-and-drop state for steps
  let draggedIdx = $state<number | null>(null);
  let dragOverIdx = $state<number | null>(null);

  function onStepDragStart(idx: number, e: DragEvent) {
    draggedIdx = idx;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(idx));
    }
  }

  function onStepDragOver(idx: number, e: DragEvent) {
    if (draggedIdx === null || draggedIdx === idx) return;
    e.preventDefault();
    dragOverIdx = idx;
  }

  function onStepDrop(targetIdx: number, e: DragEvent) {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      draggedIdx = null;
      dragOverIdx = null;
      return;
    }

    const updated = [...steps];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, moved);
    steps = updated.map((s, i) => ({ ...s, sort_order: i + 1 }));
    draggedIdx = null;
    dragOverIdx = null;
  }

  function moveStep(idx: number, dir: -1 | 1, e: MouseEvent) {
    e.stopPropagation();
    const target = idx + dir;
    if (target < 0 || target >= steps.length) return;
    const updated = [...steps];
    const [moved] = updated.splice(idx, 1);
    updated.splice(target, 0, moved);
    steps = updated.map((s, i) => ({ ...s, sort_order: i + 1 }));
  }

  function addStep(type: Step['type']) {
    const tempId = `new-${crypto.randomUUID()}`;

    let defaultContent: Record<string, any> = {};
    if (type === 'text') defaultContent = { markdown: '' };
    if (type === 'video') defaultContent = { url: '', video_url: '', title: '', notes: '' };
    if (type === 'flashcard') {
      defaultContent = {
        deck_title: 'New Vocabulary Deck',
        cards: [{ front_latin: '', front_tifinagh: '', back_text: '', notes: '' }]
      };
    }
    if (type === 'quiz') {
      defaultContent = {
        questions: [
          {
            question: '',
            answers: ['', '', '', ''],
            correct_index: 0,
            explanation: ''
          }
        ]
      };
    }

    const newStep: Step = {
      id: tempId,
      type,
      sort_order: steps.length + 1,
      linked_headword_id: null,
      content: defaultContent,
      isNew: true
    };

    steps.push(newStep);
    selectedStepId = tempId;
  }

  function removeStep(id: string | number) {
    steps = steps.filter((s) => s.id !== id);
    if (selectedStepId === id) {
      selectedStepId = steps.length > 0 ? steps[0].id : null;
    }
  }

  function getStepIcon(type: string) {
    switch (type) {
      case 'video':
        return Video;
      case 'quiz':
        return CircleQuestionMark;
      case 'flashcard':
        return BrainCircuit;
      default:
        return FileText;
    }
  }

  function getStepColor(type: string) {
    switch (type) {
      case 'video':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400';
      case 'quiz':
        return 'bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400';
      case 'flashcard':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
    }
  }
</script>

<div class="bg-background flex h-[calc(100vh-57px)] flex-col">
  <header class="bg-background z-10 flex h-16 shrink-0 items-center justify-between border-b px-6">
    <div class="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        href="/admin/courses/{page.params.courseId}/curriculum"
        class="-ml-2"
      >
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <div class="flex flex-col">
        {#if editingLessonHeader}
          <form
            method="POST"
            action="?/renameLesson"
            class="flex items-center gap-2"
            use:svelteKitEnhance={() => {
              const newTitle = headerLessonTitle.trim();
              if (newTitle) {
                lessonTitle = newTitle;
              }
              editingLessonHeader = false;
              return async ({ update }) => {
                await update({ reset: false });
              };
            }}
          >
            <Input
              name="title"
              bind:value={headerLessonTitle}
              class="h-8 w-64 text-base font-semibold"
              placeholder="Lesson Title"
              autofocus
              onkeydown={(e) => {
                if (e.key === 'Escape') editingLessonHeader = false;
              }}
            />
            <Button type="submit" size="sm" variant="default" class="h-8 gap-1 px-2.5 text-xs">
              <Check class="h-3.5 w-3.5" /> Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              class="h-8 px-2"
              onclick={() => (editingLessonHeader = false)}
            >
              <X class="h-3.5 w-3.5" />
            </Button>
          </form>
        {:else}
          <div class="group flex items-center gap-2">
            <h1 class="text-lg leading-tight font-semibold">{lessonTitle}</h1>
            <button
              type="button"
              onclick={() => {
                headerLessonTitle = lessonTitle;
                editingLessonHeader = true;
              }}
              class="text-muted-foreground hover:text-foreground rounded p-1 opacity-70 transition-opacity hover:opacity-100"
              title="Rename lesson"
            >
              <Pencil class="h-3.5 w-3.5" />
            </button>
          </div>
        {/if}
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground text-xs">Interactive Step Builder</span>
          {#if steps.some((s) => s.isNew)}
            <Badge variant="secondary" class="h-4 px-1 text-[10px]">Unsaved Changes</Badge>
          {/if}
          {#if $message}
            <span class="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <CheckCircle2 class="h-3.5 w-3.5" /> {$message}
            </span>
          {/if}
        </div>
      </div>
    </div>

    <div class="flex gap-2">
      <form method="POST" action="?/saveLesson" use:enhance>
        <input type="hidden" name="steps_data" value={JSON.stringify(steps)} />
        <Button type="submit" size="sm" disabled={$delayed}>
          <Save class="mr-2 h-4 w-4" />
          {$delayed ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  </header>

  <div class="flex flex-1 overflow-hidden">
    <!-- Sidebar with Drag & Drop Step Reordering -->
    <aside class="bg-muted/30 flex h-full w-80 flex-col border-r">
      <div class="custom-scrollbar flex-1 overflow-y-auto p-4">
        <div class="relative space-y-3" role="list">
          {#each steps as step, i (step.id)}
            {@const StepIcon = getStepIcon(step.type)}
            {#if i !== steps.length - 1}
              <div class="bg-border/60 absolute top-12 bottom-[-12px] left-[26px] -z-10 w-px"></div>
            {/if}

            <div
              role="listitem"
              draggable="true"
              ondragstart={(e) => onStepDragStart(i, e)}
              ondragover={(e) => onStepDragOver(i, e)}
              ondrop={(e) => onStepDrop(i, e)}
              ondragend={() => {
                draggedIdx = null;
                dragOverIdx = null;
              }}
              class="group relative flex items-center transition-all {dragOverIdx === i
                ? 'ring-primary rounded-lg ring-2'
                : ''} {draggedIdx === i ? 'opacity-50' : ''}"
            >
              <div
                role="button"
                tabindex="0"
                onclick={() => (selectedStepId = step.id)}
                onkeydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') selectedStepId = step.id;
                }}
                class="relative z-10 flex w-full cursor-pointer items-start rounded-lg border p-3 text-left transition-all duration-200
                {selectedStepId === step.id
                  ? 'bg-background border-primary/50 ring-primary/20 shadow-sm ring-1'
                  : 'bg-background border-border hover:border-primary/30 hover:shadow-sm'}"
              >
                <div class="mr-3 mt-0.5 shrink-0">
                  <div
                    class={`flex h-8 w-8 items-center justify-center rounded-md ${getStepColor(step.type)}`}
                  >
                    <StepIcon class="h-4 w-4" />
                  </div>
                </div>

                <div class="flex-1 pr-12">
                  <div class="mb-0.5 flex items-center justify-between">
                    <span class="text-sm font-semibold">Step {i + 1}</span>
                  </div>
                  <p class="text-muted-foreground text-xs font-medium capitalize">
                    {step.type} Block
                  </p>
                </div>

                <div class=" absolute top-2.5 right-2 flex items-center gap-0.5">
                  <button
                    type="button"
                    onclick={(e) => moveStep(i, -1, e)}
                    disabled={i === 0}
                    class="text-muted-foreground hover:text-foreground rounded p-0.5 disabled:opacity-20"
                    title="Move step up"
                  >
                    <ArrowUp class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onclick={(e) => moveStep(i, 1, e)}
                    disabled={i === steps.length - 1}
                    class="text-muted-foreground hover:text-foreground rounded p-0.5 disabled:opacity-20"
                    title="Move step down"
                  >
                    <ArrowDown class="h-3.5 w-3.5" />
                  </button>
                  <div
                    class="text-muted-foreground/60 hover:text-foreground cursor-grab p-0.5 active:cursor-grabbing"
                    title="Drag to reorder step"
                  >
                    <GripVertical class="h-4 w-4" />
                  </div>
                </div>
              </div>

              {#if selectedStepId === step.id}
                <button
                  type="button"
                  onclick={() => removeStep(step.id)}
                  class="bg-destructive text-destructive-foreground absolute -right-2.5 z-20 rounded-full p-1 opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:scale-110"
                  title="Remove step"
                >
                  <Trash2 class="h-3 w-3" />
                </button>
              {/if}
            </div>
          {/each}

          {#if steps.length === 0}
            <div
              class="border-muted-foreground/20 flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 text-center"
            >
              <Layers class="text-muted-foreground mb-3 h-6 w-6" />
              <p class="text-sm font-medium">No steps yet</p>
              <p class="text-muted-foreground mt-1 text-xs">
                Click a block type below to add your first lesson step.
              </p>
            </div>
          {/if}
        </div>
      </div>

      <div class="bg-background shrink-0 border-t p-4">
        <p class="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
          Add Block
        </p>
        <div class="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            onclick={() => addStep('text')}
            class="flex h-auto flex-col gap-1.5 border-dashed py-3"
          >
            <FileText class="h-4 w-4" /> <span class="text-[10px]">Text</span>
          </Button>
          <Button
            variant="outline"
            onclick={() => addStep('video')}
            class="flex h-auto flex-col gap-1.5 border-dashed py-3"
          >
            <Video class="h-4 w-4" /> <span class="text-[10px]">Video</span>
          </Button>
          <Button
            variant="outline"
            onclick={() => addStep('flashcard')}
            class="flex h-auto flex-col gap-1.5 border-dashed py-3"
          >
            <BrainCircuit class="h-4 w-4" /> <span class="text-[10px]">Cards</span>
          </Button>
          <Button
            variant="outline"
            onclick={() => addStep('quiz')}
            class="flex h-auto flex-col gap-1.5 border-dashed py-3"
          >
            <CircleQuestionMark class="h-4 w-4" /> <span class="text-[10px]">Quiz</span>
          </Button>
        </div>
      </div>
    </aside>

    <!-- Main Step Editor Area -->
    <main class="bg-muted/5 relative flex flex-1 flex-col overflow-hidden">
      {#if selectedStep}
        <div class="flex-1 overflow-y-auto p-8">
          <div class="mx-auto w-full max-w-3xl">
            <div class="mb-6 flex items-center justify-between">
              <h2 class="text-2xl font-bold">
                Editing Step {steps.findIndex((s) => s.id === selectedStepId) + 1}
              </h2>
              <Badge variant="outline" class="capitalize">{selectedStep.type} Block</Badge>
            </div>

            <div class="bg-card min-h-[420px] rounded-xl border p-6 shadow-sm">
              {#if selectedStep.type === 'text'}
                <TextEdit bind:content={selectedStep.content} />
              {:else if selectedStep.type === 'video'}
                <VideoEdit bind:content={selectedStep.content} />
              {:else if selectedStep.type === 'flashcard'}
                <FlashcardEdit
                  bind:content={selectedStep.content}
                  bind:linkedHeadwordId={selectedStep.linked_headword_id}
                />
              {:else if selectedStep.type === 'quiz'}
                <QuizEdit bind:content={selectedStep.content} />
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <div class="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <Layers class="text-muted-foreground/30 mb-4 h-12 w-12" />
          <h3 class="text-lg font-semibold">Select or add a block to edit</h3>
        </div>
      {/if}
    </main>
  </div>
</div>
