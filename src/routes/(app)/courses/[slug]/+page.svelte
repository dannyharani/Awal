<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import * as Card from '$lib/components/ui/card';
  import {
    Globe,
    Languages,
    BookOpen,
    CheckCircle2,
    Play,
    ArrowLeft,
    Pencil
  } from '@lucide/svelte';

  let { data } = $props();
  const { course, completedLessonIds = [], canEdit } = $derived(data);

  let completedSet = $derived(new Set(completedLessonIds));

  let allLessons = $derived.by(() => {
    const list: any[] = [];
    for (const mod of course.modules ?? []) {
      for (const les of mod.lessons ?? []) {
        list.push(les);
      }
    }
    return list;
  });

  let completedCount = $derived(
    allLessons.filter((l) => completedSet.has(l.id)).length
  );
  let progressPercent = $derived(
    allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0
  );
  let nextLesson = $derived(
    allLessons.find((l) => !completedSet.has(l.id)) ?? allLessons[0] ?? null
  );
</script>

<div class="container mx-auto max-w-4xl space-y-8 px-4 py-10">
  <div class="flex items-center justify-between">
    <Button variant="ghost" size="sm" href="/courses" class="-ml-2 gap-1.5 text-xs">
      <ArrowLeft class="h-4 w-4" />
      Back to Courses
    </Button>

    {#if canEdit}
      <Button
        variant="outline"
        size="sm"
        href="/admin/courses/{course.id}/curriculum"
        class="gap-1.5 text-xs"
      >
        <Pencil class="h-3.5 w-3.5" />
        Edit Curriculum
      </Button>
    {/if}
  </div>

  <!-- Course Hero Card -->
  <Card.Root class="from-primary/10 via-card to-card border-primary/20 bg-gradient-to-br py-0">
    <Card.Content class="space-y-6 p-5 sm:p-8">
      <div class="flex flex-wrap items-center gap-2">
        {#if course.category}
          <Badge variant="default" class="text-xs capitalize">
            {course.category}
          </Badge>
        {/if}
        {#if course.dialects?.name}
          <Badge variant="outline" class="bg-background gap-1 text-xs">
            <Globe class="h-3 w-3" />
            {course.dialects.name}
          </Badge>
        {/if}
        <Badge variant="secondary" class="gap-1 text-xs uppercase">
          <Languages class="h-3 w-3" />
          Instruction: {course.instruction_language || 'en'}
        </Badge>
        {#if course.difficulty_level}
          <Badge variant="outline" class="bg-background text-xs capitalize">
            {course.difficulty_level}
          </Badge>
        {/if}
      </div>

      <div class="space-y-2">
        <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">{course.title}</h1>
        {#if course.description}
          <p class="text-muted-foreground max-w-2xl text-base leading-relaxed">
            {course.description}
          </p>
        {/if}
        {#if Array.isArray(course.tags) && course.tags.length > 0}
          <div class="flex flex-wrap gap-1.5 pt-2">
            {#each course.tags as tag}
              <span class="bg-background/80 text-muted-foreground rounded-md border px-2 py-0.5 text-xs font-medium">
                #{tag}
              </span>
            {/each}
          </div>
        {/if}
      </div>

      <div class="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <div class="w-full space-y-1.5 sm:w-auto">
          <div class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium">
            <span>{course.modules?.length ?? 0} Modules</span>
            <span>•</span>
            <span>{allLessons.length} Lessons</span>
            <span>•</span>
            <span>{completedCount}/{allLessons.length} Completed ({progressPercent}%)</span>
          </div>
          <div class="bg-background h-2 w-full overflow-hidden rounded-full border sm:w-56">
            <div
              class="bg-primary h-full transition-all duration-300"
              style="width: {progressPercent}%"
            ></div>
          </div>
        </div>

        {#if nextLesson}
          <Button size="lg" href="/courses/{course.slug}/learn/{nextLesson.id}" class="w-full gap-2 sm:w-auto">
            <Play class="h-4 w-4" />
            {completedCount > 0 ? 'Continue Learning' : 'Start First Lesson'}
          </Button>
        {/if}
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Course Curriculum Syllabus -->
  <div class="space-y-6">
    <h2 class="text-2xl font-bold">Course Syllabus</h2>

    {#each course.modules ?? [] as mod, mIdx (mod.id)}
      <Card.Root class="gap-0 pb-0">
        <Card.Header class="bg-muted/30 border-b py-3.5 sm:py-4">
          <div class="flex items-center justify-between gap-2">
            <Card.Title class="text-base sm:text-lg">
              {mod.title}
            </Card.Title>
            <Badge variant="outline" class="shrink-0 text-xs">
              {mod.lessons?.length ?? 0} Lessons
            </Badge>
          </div>
        </Card.Header>

        <Card.Content class="divide-y p-0">
          {#each mod.lessons ?? [] as lesson, lIdx (lesson.id)}
            {@const isDone = completedSet.has(lesson.id)}
            <a
              href="/courses/{course.slug}/learn/{lesson.id}"
              class="hover:bg-muted/40 flex items-center justify-between gap-3 px-4 py-3.5 transition-colors sm:px-6 sm:py-4"
            >
              <div class="flex min-w-0 items-center gap-3">
                {#if isDone}
                  <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                    <CheckCircle2 class="h-4 w-4" />
                  </div>
                {:else}
                  <div class="bg-muted text-muted-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold">
                    {mIdx + 1}.{lIdx + 1}
                  </div>
                {/if}

                <div class="min-w-0">
                  <p class="text-foreground truncate font-semibold sm:whitespace-normal">{lesson.title}</p>
                  <p class="text-muted-foreground text-xs">
                    {lesson.steps?.length ?? 0} interactive steps
                  </p>
                </div>
              </div>

              <Button variant={isDone ? 'outline' : 'ghost'} size="sm" class="shrink-0 gap-1.5 text-xs">
                <Play class="h-3.5 w-3.5" />
                {isDone ? 'Review' : 'Start'}
              </Button>
            </a>
          {/each}
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
</div>
