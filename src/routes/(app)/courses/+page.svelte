<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import * as Card from '$lib/components/ui/card';
  import { locales } from '$lib/paraglide/runtime';
  import * as m from '$lib/paraglide/messages.js';
  import {
    GraduationCap,
    Globe,
    Languages,
    BookOpen,
    ArrowRight,
    CheckCircle2,
    Sparkles,
    Filter
  } from '@lucide/svelte';

  let { data } = $props();
  const {
    courses,
    dialects,
    enrollments,
    completedLessonIds = [],
    canAccessStudio
  } = $derived(data);

  let selectedDialect = $state<number | 'all'>('all');
  let selectedLang = $state<string>('all');
  let selectedLevel = $state<string>('all');

  let completedSet = $derived(new Set(completedLessonIds));

  function getCourseLessons(course: any) {
    if (!course.modules) return [];
    const list: any[] = [];
    const sortedMods = [...course.modules].sort(
      (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    for (const mod of sortedMods) {
      const sortedLessons = [...(mod.lessons ?? [])].sort(
        (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      );
      list.push(...sortedLessons);
    }
    return list;
  }

  function getCourseProgress(course: any) {
    const allLessons = getCourseLessons(course);
    if (allLessons.length === 0) return { completed: 0, total: 0, percent: 0, nextLessonId: null };
    const completed = allLessons.filter((l) => completedSet.has(l.id)).length;
    const nextUnfinished = allLessons.find((l) => !completedSet.has(l.id)) ?? allLessons[0];
    return {
      completed,
      total: allLessons.length,
      percent: Math.round((completed / allLessons.length) * 100),
      nextLessonId: nextUnfinished?.id ?? null
    };
  }

  let enrolledCourses = $derived.by(() => {
    const enrolledIds = new Set(enrollments.map((e: any) => e.course_id));
    return courses.filter(
      (c: any) => enrolledIds.has(c.id) || getCourseProgress(c).completed > 0
    );
  });

  let filteredCourses = $derived(
    courses.filter((c: any) => {
      if (selectedDialect !== 'all' && c.target_dialect_id !== selectedDialect) return false;
      if (selectedLang !== 'all' && (c.instruction_language || 'en') !== selectedLang) return false;
      if (selectedLevel !== 'all' && c.difficulty_level !== selectedLevel) return false;
      return true;
    })
  );
</script>

<div class="container mx-auto space-y-10 px-4 py-10">
  <!-- Header Banner -->
  <div class="flex flex-wrap items-end justify-between gap-4 border-b pb-8">
    <div class="max-w-2xl space-y-2">
      <div class="text-primary flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
        <GraduationCap class="h-4 w-4" />
        Aselkim Academy
      </div>
      <h1 class="text-4xl font-extrabold tracking-tight">{m.courses_title()}</h1>
      <p class="text-muted-foreground text-lg">
        {m.courses_subtitle()}
      </p>
    </div>

    {#if canAccessStudio}
      <Button href="/admin/courses" variant="outline" class="gap-2">
        <Sparkles class="text-primary h-4 w-4" />
        {m.nav_studio()}
      </Button>
    {/if}
  </div>

  <!-- Continue Learning Section -->
  {#if enrolledCourses.length > 0}
    <section class="space-y-4">
      <h2 class="text-xl font-bold">{m.courses_my_enrolled()}</h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        {#each enrolledCourses as course (course.id)}
          {@const prog = getCourseProgress(course)}
          <Card.Root class="border-primary/30 bg-primary/5">
            <Card.Content class="flex flex-col justify-between gap-4 p-6">
              <div class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <Badge variant="outline" class="bg-background text-xs">
                    {course.dialects?.name ?? 'General'}
                  </Badge>
                  <span class="text-muted-foreground text-xs font-semibold">
                    {prog.completed} / {prog.total} Lessons ({prog.percent}%)
                  </span>
                </div>
                <h3 class="text-xl font-bold">{course.title}</h3>
                <!-- Progress Bar -->
                <div class="bg-background h-2 w-full overflow-hidden rounded-full border">
                  <div
                    class="bg-primary h-full transition-all duration-300"
                    style="width: {prog.percent}%"
                  ></div>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2">
                <a
                  href="/courses/{course.slug}"
                  class="text-muted-foreground hover:text-foreground text-xs font-medium hover:underline"
                >
                  View Syllabus
                </a>
                {#if prog.nextLessonId}
                  <Button size="sm" href="/courses/{course.slug}/learn/{prog.nextLessonId}" class="gap-1.5">
                    {prog.completed === prog.total ? 'Review' : m.courses_continue()}
                    <ArrowRight class="h-3.5 w-3.5" />
                  </Button>
                {/if}
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    </section>
  {/if}

  <!-- All Courses & Filters -->
  <section class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h2 class="text-2xl font-bold">{m.courses_all()} ({filteredCourses.length})</h2>

      <div class="flex flex-wrap items-center gap-2">
        <Filter class="text-muted-foreground h-4 w-4" />
        <select
          bind:value={selectedDialect}
          class="border-input bg-background h-9 rounded-md border px-3 text-xs"
        >
          <option value="all">{m.courses_filter_dialect()}</option>
          {#each dialects as d}
            <option value={d.id}>{d.name}</option>
          {/each}
        </select>

        <select
          bind:value={selectedLang}
          class="border-input bg-background h-9 rounded-md border px-3 text-xs uppercase"
        >
          <option value="all">{m.courses_filter_lang()}</option>
          {#each locales as loc}
            <option value={loc}>{loc.toUpperCase()}</option>
          {/each}
        </select>

        <select
          bind:value={selectedLevel}
          class="border-input bg-background h-9 rounded-md border px-3 text-xs"
        >
          <option value="all">{m.courses_filter_level()}</option>
          <option value="beginner">{m.courses_level_beginner()}</option>
          <option value="intermediate">{m.courses_level_intermediate()}</option>
          <option value="advanced">{m.courses_level_advanced()}</option>
        </select>
      </div>
    </div>

    {#if filteredCourses.length === 0}
      <Card.Root class="border-dashed py-16 text-center">
        <Card.Content class="space-y-3">
          <BookOpen class="text-muted-foreground mx-auto h-10 w-10 opacity-40" />
          <p class="text-lg font-medium">No courses match your filters</p>
        </Card.Content>
      </Card.Root>
    {:else}
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each filteredCourses as course (course.id)}
          {@const prog = getCourseProgress(course)}
          <Card.Root class="hover:border-primary/50 flex flex-col justify-between transition-all hover:shadow-md">
            <Card.Header class="space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                {#if course.dialects?.name}
                  <Badge variant="outline" class="gap-1 text-xs">
                    <Globe class="h-3 w-3" />
                    {course.dialects.name}
                  </Badge>
                {/if}
                <Badge variant="secondary" class="gap-1 text-[10px] uppercase">
                  <Languages class="h-3 w-3" />
                  {course.instruction_language || 'en'}
                </Badge>
                {#if course.difficulty_level}
                  <Badge variant="outline" class="text-[10px] capitalize">
                    {course.difficulty_level}
                  </Badge>
                {/if}
              </div>

              <Card.Title class="text-xl leading-snug">
                <a href="/courses/{course.slug}" class="hover:text-primary transition-colors">
                  {course.title}
                </a>
              </Card.Title>

              {#if course.description}
                <Card.Description class="line-clamp-3 text-sm leading-relaxed">
                  {course.description}
                </Card.Description>
              {/if}
            </Card.Header>

            <Card.Footer class="bg-muted/20 flex items-center justify-between border-t px-6 py-4">
              <div class="text-muted-foreground flex items-center gap-2 text-xs">
                <BookOpen class="h-3.5 w-3.5" />
                <span>{course.modules?.length ?? 0} Modules • {prog.total} Lessons</span>
              </div>

              <Button size="sm" href="/courses/{course.slug}" class="gap-1.5 text-xs">
                {#if prog.completed > 0 && prog.completed >= prog.total}
                  <CheckCircle2 class="h-3.5 w-3.5" />
                  {m.courses_completed()}
                {:else if prog.completed > 0}
                  {m.courses_continue()}
                {:else}
                  {m.courses_start()}
                {/if}
                <ArrowRight class="h-3.5 w-3.5" />
              </Button>
            </Card.Footer>
          </Card.Root>
        {/each}
      </div>
    {/if}
  </section>
</div>
