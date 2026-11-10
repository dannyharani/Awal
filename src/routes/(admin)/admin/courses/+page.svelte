<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import * as Card from '$lib/components/ui/card';
  import {
    Plus,
    GripVertical,
    ArrowUp,
    ArrowDown,
    BookOpen,
    Eye,
    Pencil,
    Trash2,
    Globe,
    Languages,
    CheckCircle2,
    Sparkles
  } from '@lucide/svelte';

  let { data } = $props();

  // Reactive local list for optimistic drag-and-drop reordering
  // svelte-ignore state_referenced_locally
  let courseList = $state([...data.courses]);
  let draggedIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);
  let isSavingOrder = $state(false);
  let orderSaved = $state(false);
  let reorderForm: HTMLFormElement;

  $effect(() => {
    courseList = [...data.courses];
  });

  function handleDragStart(index: number, e: DragEvent) {
    draggedIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    }
  }

  function handleDragOver(index: number, e: DragEvent) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    dragOverIndex = index;
  }

  function handleDrop(targetIndex: number, e: DragEvent) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      draggedIndex = null;
      dragOverIndex = null;
      return;
    }

    const updated = [...courseList];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);
    courseList = updated;
    draggedIndex = null;
    dragOverIndex = null;
    submitNewOrder();
  }

  function handleDragEnd() {
    draggedIndex = null;
    dragOverIndex = null;
  }

  function moveCourse(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= courseList.length) return;
    const updated = [...courseList];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    courseList = updated;
    submitNewOrder();
  }

  function submitNewOrder() {
    setTimeout(() => {
      reorderForm?.requestSubmit();
    }, 10);
  }

  function countLessons(course: any) {
    if (!course.modules) return 0;
    return course.modules.reduce(
      (sum: number, m: any) => sum + (m.lessons?.length ?? 0),
      0
    );
  }
</script>

<div class="container mx-auto max-w-5xl space-y-8 px-4 py-10">
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <div class="text-primary mb-1 flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
        <Sparkles class="h-3.5 w-3.5" />
        Educator Studio
      </div>
      <h1 class="text-3xl font-extrabold tracking-tight">Manage Courses</h1>
      <p class="text-muted-foreground mt-1 text-sm">
        Drag and drop courses (or use the arrow buttons) to set their display order in the learner catalog.
      </p>
    </div>

    <div class="flex items-center gap-3">
      {#if isSavingOrder}
        <span class="text-muted-foreground text-xs">Saving order...</span>
      {:else if orderSaved}
        <span class="flex items-center gap-1 text-xs font-medium text-emerald-600">
          <CheckCircle2 class="h-3.5 w-3.5" /> Order saved
        </span>
      {/if}

      <Button href="/admin/courses/new" class="gap-2">
        <Plus class="h-4 w-4" />
        New Course
      </Button>
    </div>
  </div>

  <!-- Hidden form to persist course order -->
  <form
    bind:this={reorderForm}
    method="POST"
    action="?/reorderCourses"
    use:enhance={() => {
      isSavingOrder = true;
      orderSaved = false;
      return async ({ update }) => {
        isSavingOrder = false;
        orderSaved = true;
        await update({ reset: false });
        setTimeout(() => (orderSaved = false), 2500);
      };
    }}
    class="hidden"
  >
    <input
      type="hidden"
      name="order_json"
      value={JSON.stringify(courseList.map((c) => c.id))}
    />
  </form>

  {#if courseList.length === 0}
    <Card.Root class="border-dashed py-16 text-center">
      <Card.Content class="space-y-4">
        <BookOpen class="text-muted-foreground mx-auto h-10 w-10 opacity-50" />
        <div>
          <h3 class="text-lg font-semibold">No courses created yet</h3>
          <p class="text-muted-foreground text-sm">
            Create your first Amazigh course to start building modules, flashcards, and quizzes.
          </p>
        </div>
        <Button href="/admin/courses/new">
          <Plus class="mr-2 h-4 w-4" /> Create First Course
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="space-y-3" role="list">
      {#each courseList as course, index (course.id)}
        <div
          role="listitem"
          draggable="true"
          ondragstart={(e) => handleDragStart(index, e)}
          ondragover={(e) => handleDragOver(index, e)}
          ondrop={(e) => handleDrop(index, e)}
          ondragend={handleDragEnd}
          class="bg-card transition-all duration-150 {dragOverIndex === index
            ? 'border-primary ring-primary/30 rounded-xl border-2 ring-2'
            : 'border-border hover:border-primary/40 rounded-xl border shadow-sm'} {draggedIndex ===
          index
            ? 'opacity-50'
            : ''}"
        >
          <div class="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div class="flex items-start gap-3.5">
              <!-- Drag Grip + Keyboard Reorder Buttons -->
              <div class="flex flex-col items-center gap-0.5 pt-0.5">
                <div
                  class="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                  title="Drag to reorder course"
                >
                  <GripVertical class="h-5 w-5" />
                </div>
                <div class="flex flex-col">
                  <button
                    type="button"
                    onclick={() => moveCourse(index, -1)}
                    disabled={index === 0}
                    class="text-muted-foreground hover:text-foreground disabled:opacity-25"
                    title="Move course up"
                  >
                    <ArrowUp class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onclick={() => moveCourse(index, 1)}
                    disabled={index === courseList.length - 1}
                    class="text-muted-foreground hover:text-foreground disabled:opacity-25"
                    title="Move course down"
                  >
                    <ArrowDown class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div class="space-y-1.5">
                <div class="flex flex-wrap items-center gap-2">
                  <Badge variant={course.is_published ? 'default' : 'secondary'} class="text-[10px] uppercase">
                    {course.is_published ? 'Published' : 'Draft'}
                  </Badge>

                  {#if course.dialects?.name}
                    <Badge variant="outline" class="gap-1 text-xs">
                      <Globe class="h-3 w-3" />
                      {course.dialects.name}
                    </Badge>
                  {/if}

                  <Badge variant="outline" class="gap-1 text-[10px] uppercase">
                    <Languages class="h-3 w-3" />
                    {course.instruction_language || 'en'}
                  </Badge>

                  {#if course.difficulty_level}
                    <Badge variant="secondary" class="text-[10px] capitalize">
                      {course.difficulty_level}
                    </Badge>
                  {/if}
                </div>

                <h2 class="text-foreground text-xl font-bold">
                  <a
                    href="/admin/courses/{course.id}/curriculum"
                    class="hover:text-primary transition-colors"
                  >
                    {course.title}
                  </a>
                </h2>

                {#if course.description}
                  <p class="text-muted-foreground line-clamp-2 max-w-2xl text-sm">
                    {course.description}
                  </p>
                {/if}

                <div class="text-muted-foreground flex flex-wrap items-center gap-4 pt-1 text-xs">
                  <span>{course.modules?.length ?? 0} Modules</span>
                  <span>•</span>
                  <span>{countLessons(course)} Lessons</span>
                  {#if course.creator?.username}
                    <span>•</span>
                    <span>By {course.creator.username}</span>
                  {/if}
                </div>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2 sm:shrink-0">
              <Button
                variant="outline"
                size="sm"
                href="/courses/{course.slug}"
                class="gap-1.5 text-xs"
              >
                <Eye class="h-3.5 w-3.5" />
                View
              </Button>

              <Button
                variant="default"
                size="sm"
                href="/admin/courses/{course.id}/curriculum"
                class="gap-1.5 text-xs"
              >
                <Pencil class="h-3.5 w-3.5" />
                Curriculum
              </Button>

              <form method="POST" action="?/togglePublish" use:enhance>
                <input type="hidden" name="course_id" value={course.id} />
                <input
                  type="hidden"
                  name="is_published"
                  value={course.is_published ? 'false' : 'true'}
                />
                <Button
                  type="submit"
                  variant={course.is_published ? 'secondary' : 'outline'}
                  size="sm"
                  class="text-xs"
                >
                  {course.is_published ? 'Unpublish' : 'Publish'}
                </Button>
              </form>

              <form method="POST" action="?/deleteCourse" use:enhance>
                <input type="hidden" name="course_id" value={course.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  class="text-muted-foreground hover:text-destructive h-8 w-8"
                  title="Delete course"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
