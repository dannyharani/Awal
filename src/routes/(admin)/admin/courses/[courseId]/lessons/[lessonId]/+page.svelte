<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { page } from '$app/stores';
  import {
    FileText,
    Video,
    BrainCircuit,
    CircleQuestionMark,
    ArrowLeft,
    GripVertical,
    Layers,
    Plus,
    Trash2,
    Save
  } from '@lucide/svelte';

  // UI Components
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';

  // Editors
  import TextEdit from '$lib/components/courses/lessons/TextEdit.svelte';

  // Types
  import type { Step } from '$lib/types';

  let { data } = $props();
  // svelte-ignore state_referenced_locally
  const { form, enhance, delayed, message } = superForm(data.form, {});

  // 1. Initialize Local State
  // We map existing steps from DB to our internal structure
  // svelte-ignore state_referenced_locally
  let steps = $state<Step[]>(
    data.lesson.steps.map((s: any) => ({
      id: s.id,
      type: s.step_type,
      sort_order: s.sort_order,
      content: s.content ?? {},
      isNew: false
    }))
  );

  // svelte-ignore state_referenced_locally
  let selectedStepId = $state<string | number | null>(steps.length > 0 ? steps[0].id : null);

  // Derived helper to find the currently selected step object
  // Note: We return the object itself so we can bind to it
  let selectedStep = $derived(steps.find((s) => s.id === selectedStepId));

  // --- ACTIONS ---

  function addStep(type: Step['type']) {
    const tempId = `new-${crypto.randomUUID()}`; // visible unique ID

    // Default content shapes
    let defaultContent = {};
    if (type === 'text') defaultContent = { markdown: '' };
    if (type === 'video') defaultContent = { url: '' };

    const newStep: Step = {
      id: tempId,
      type,
      sort_order: steps.length + 1,
      content: defaultContent,
      isNew: true
    };

    steps.push(newStep);
    selectedStepId = tempId; // Auto-select the new step
  }

  function removeStep(id: string | number) {
    steps = steps.filter((s) => s.id !== id);
    if (selectedStepId === id) {
      selectedStepId = null;
    }
  }

  // --- ICONS & COLORS ---

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
        return 'bg-blue-100 text-blue-600';
      case 'quiz':
        return 'bg-orange-100 text-orange-600';
      case 'flashcard':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }
</script>

<div class="h-[calc(100vh-65px)] flex flex-col bg-background">
  <header class="h-16 border-b flex items-center px-6 justify-between bg-background shrink-0 z-10">
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="icon" href="/admin/courses/{$page.params.courseId}/curriculum" class="-ml-2">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <div class="flex flex-col">
        <h1 class="font-semibold text-lg leading-tight">{data.lesson.title}</h1>
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted-foreground">Step Builder</span>
          {#if steps.some((s) => s.isNew)}
            <Badge variant="secondary" class="text-[10px] h-4 px-1">Unsaved Changes</Badge>
          {/if}
        </div>
      </div>
    </div>

    <div class="flex gap-2">
      <form method="POST" action="?/saveLesson" use:enhance>
        <input type="hidden" name="steps_data" value={JSON.stringify(steps)} />
        <Button type="submit" size="sm" disabled={$delayed}>
          <Save class="w-4 h-4 mr-2" />
          {$delayed ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  </header>

  <div class="flex flex-1 overflow-hidden">
    <aside class="w-80 border-r bg-muted/30 flex flex-col h-full">
      <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div class="space-y-3 relative">
          {#each steps as step, i (step.id)}
            {@const StepIcon = getStepIcon(step.type)}
            {#if i !== steps.length - 1}
              <div class="absolute left-[26px] top-12 bottom-[-12px] w-px bg-border/60 -z-10"></div>
            {/if}

            <div class="group relative flex items-center">
              <button
                onclick={() => (selectedStepId = step.id)}
                class="w-full flex items-start p-3 rounded-lg border text-left transition-all duration-200 relative z-10
                {selectedStepId === step.id
                  ? 'bg-background border-primary/50 shadow-sm ring-1 ring-primary/20'
                  : 'bg-background border-border hover:border-primary/30 hover:shadow-sm'}"
              >
                <div
                  class="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-muted-foreground/50"
                >
                  <GripVertical class="h-4 w-4" />
                </div>

                <div class="shrink-0 mr-3 mt-0.5">
                  <div class={`h-8 w-8 rounded-md flex items-center justify-center ${getStepColor(step.type)}`}>
                    <StepIcon class="h-4 w-4" />
                  </div>
                </div>

                <div class="flex-1 pr-6">
                  <div class="flex items-center justify-between mb-0.5">
                    <span class="text-sm font-semibold">Step {i + 1}</span>
                  </div>
                  <p class="text-xs text-muted-foreground capitalize font-medium">{step.type} Content</p>
                </div>
              </button>

              {#if selectedStepId === step.id}
                <button
                  onclick={() => removeStep(step.id)}
                  class="absolute -right-3 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-20 hover:scale-110"
                  title="Remove step"
                >
                  <Trash2 class="h-3 w-3" />
                </button>
              {/if}
            </div>
          {/each}

          {#if steps.length === 0}
            <div
              class="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed rounded-lg border-muted-foreground/20"
            >
              <Layers class="h-6 w-6 text-muted-foreground mb-3" />
              <p class="text-sm font-medium">No steps yet</p>
            </div>
          {/if}
        </div>
      </div>

      <div class="p-4 border-t bg-background shrink-0">
        <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Add Block</p>
        <div class="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            onclick={() => addStep('text')}
            class="h-auto py-3 flex flex-col gap-1.5 border-dashed"
          >
            <FileText class="h-4 w-4" /> <span class="text-[10px]">Text</span>
          </Button>
          <Button
            variant="outline"
            onclick={() => addStep('video')}
            class="h-auto py-3 flex flex-col gap-1.5 border-dashed"
          >
            <Video class="h-4 w-4" /> <span class="text-[10px]">Video</span>
          </Button>
          <Button
            variant="outline"
            onclick={() => addStep('flashcard')}
            class="h-auto py-3 flex flex-col gap-1.5 border-dashed"
          >
            <BrainCircuit class="h-4 w-4" /> <span class="text-[10px]">Card</span>
          </Button>
          <Button
            variant="outline"
            onclick={() => addStep('quiz')}
            class="h-auto py-3 flex flex-col gap-1.5 border-dashed"
          >
            <CircleQuestionMark class="h-4 w-4" /> <span class="text-[10px]">Quiz</span>
          </Button>
        </div>
      </div>
    </aside>

    <main class="flex-1 bg-muted/5 relative overflow-hidden flex flex-col">
      {#if selectedStep}
        <div class="flex-1 p-8 overflow-y-auto">
          <div class="max-w-3xl mx-auto w-full">
            <div class="mb-6 flex items-center justify-between">
              <h2 class="text-2xl font-bold">Editing Step {steps.findIndex((s) => s.id === selectedStepId) + 1}</h2>
              <Badge variant="outline" class="capitalize">{selectedStep.type}</Badge>
            </div>

            <div class="bg-card border rounded-xl shadow-sm p-6 min-h-[400px]">
              {#if selectedStep.type === 'text'}
                <TextEdit bind:content={selectedStep.content} />
              {:else if selectedStep.type === 'video'}
                <p>Video Editor Placeholder</p>
              {:else}
                <p>Unknown component type</p>
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <div class="flex-1 flex flex-col items-center justify-center text-center p-8">
          <Layers class="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 class="text-lg font-semibold">Select a block to edit</h3>
        </div>
      {/if}
    </main>
  </div>
</div>
