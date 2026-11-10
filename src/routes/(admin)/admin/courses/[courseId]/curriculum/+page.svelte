<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { GripVertical, Plus } from '@lucide/svelte';

  // UI Components
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog'; // Import Dialog
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import { Label } from '$lib/components/ui/label';

  let { data } = $props();

  // --- Module Form ---
  const {
    form: mForm,
    enhance: mEnhance,
    delayed: mDelayed
  } = superForm(data.moduleForm, {
    resetForm: true
  });

  // --- Lesson Form ---
  // We use this single form instance for ALL modules
  const {
    form: lForm,
    enhance: lEnhance,
    delayed: lDelayed,
    message: lMessage
  } = superForm(data.lessonForm, {
    id: 'createLesson',
    resetForm: true,
    onResult: ({ result }) => {
      // Close dialog on success
      if (result.type === 'success') {
        dialogOpen = false;
      }
    }
  });

  // --- State for Dialog ---
  let dialogOpen = $state(false);
  let selectedModuleId = $state(0);

  function openAddLesson(moduleId: number) {
    selectedModuleId = moduleId;
    $lForm.module_id = moduleId; // Update the form store immediately
    dialogOpen = true;
  }
</script>

<div class="max-w-4xl mx-auto py-10 px-4">
  <div class="flex items-center justify-between mb-8">
    <div>
      <Badge variant="outline" class="mb-2">Draft</Badge>
      <h1 class="text-3xl font-bold">{data.course.title}</h1>
      <p class="text-muted-foreground">Curriculum Builder</p>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" href="/courses">Back</Button>
      <Button>Publish Course</Button>
    </div>
  </div>

  <div class="space-y-6">
    {#if data.course.modules && data.course.modules.length > 0}
      {#each data.course.modules as module (module.id)}
        <Card.Root class="mb-4">
          <Card.Header class="pb-3">
            <div class="flex items-center gap-2">
              <GripVertical class="h-5 w-5 text-muted-foreground cursor-move" />
              <h3 class="text-xl font-semibold">{module.title}</h3>
              <span class="text-xs text-muted-foreground ml-auto">Module {module.sort_order}</span>
            </div>
          </Card.Header>
          <Separator />
          <Card.Content class="pt-4 bg-muted/20 min-h-[100px]">
            {#if module.lessons && module.lessons.length > 0}
              <div class="space-y-2">
                {#each module.lessons as lesson}
                  <div class="flex items-center p-3 bg-background border rounded-md shadow-sm">
                    <GripVertical class="h-4 w-4 text-muted-foreground mr-3 cursor-move" />

                    <a
                      href="/admin/courses/{data.course.id}/lessons/{lesson.id}"
                      class="font-medium hover:underline hover:text-primary transition-colors flex-1"
                    >
                      {lesson.title}
                    </a>

                    <span class="text-xs text-muted-foreground mr-4">{lesson.steps?.length ?? 0} steps</span>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
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
                <Plus class="h-4 w-4 mr-2" /> Add Lesson
              </Button>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    {:else}
      <div class="text-center py-12 border-2 border-dashed rounded-xl">
        <h3 class="text-lg font-medium">It's quiet here...</h3>
        <p class="text-muted-foreground">Start by adding your first module below.</p>
      </div>
    {/if}

    <Card.Root class="border-dashed border-2 bg-muted/10">
      <Card.Content class="pt-6">
        <form method="POST" action="?/createModule" use:mEnhance class="flex gap-4 items-end">
          <div class="grid w-full gap-1.5">
            <span class="text-sm font-medium leading-none">New Module Title</span>
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
        <Input id="lesson-title" name="title" bind:value={$lForm.title} placeholder="e.g. Letter Aleph" />
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
