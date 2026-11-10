<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import { Input } from '$lib/components/ui/input';
  import * as Card from '$lib/components/ui/card';
  import { locales } from '$lib/paraglide/runtime';
  import * as m from '$lib/paraglide/messages.js';
  import { COURSE_CATEGORIES } from '$lib/utils/amazigh';
  import {
    GraduationCap,
    Globe,
    Languages,
    BookOpen,
    ArrowRight,
    CheckCircle2,
    Sparkles,
    Filter,
    Search,
    X,
    UserCheck,
    Layers,
    Tag,
    BookMarked,
    MessageCircle,
    BookA,
    SpellCheck
  } from '@lucide/svelte';

  let { data } = $props();
  const {
    courses,
    dialects,
    enrollments,
    completedLessonIds = [],
    user,
    canAccessStudio
  } = $derived(data);

  // Tab: 'all' or 'enrolled'
  let activeTab = $state<'all' | 'enrolled'>('all');

  // Search & Filters
  let searchQuery = $state('');
  let selectedCategory = $state<string>('all');
  let selectedTag = $state<string | null>(null);
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

  // Base list depending on active tab
  let currentCoursePool = $derived(activeTab === 'enrolled' ? enrolledCourses : courses);

  let filteredCourses = $derived(
    currentCoursePool.filter((c: any) => {
      // Category filter
      if (selectedCategory !== 'all' && (c.category || 'conversation') !== selectedCategory) {
        return false;
      }

      // Tag filter
      if (selectedTag) {
        const cTags: string[] = Array.isArray(c.tags) ? c.tags : [];
        if (!cTags.includes(selectedTag)) return false;
      }

      // Dialect filter
      if (selectedDialect !== 'all' && c.target_dialect_id !== selectedDialect) return false;

      // Language filter
      if (selectedLang !== 'all' && (c.instruction_language || 'en') !== selectedLang) return false;

      // Difficulty level
      if (selectedLevel !== 'all' && c.difficulty_level !== selectedLevel) return false;

      // Search Query
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.trim().toLowerCase();
        const titleMatch = (c.title || '').toLowerCase().includes(query);
        const descMatch = (c.description || '').toLowerCase().includes(query);
        const tagMatch = Array.isArray(c.tags) && c.tags.some((t: string) => t.toLowerCase().includes(query));
        if (!titleMatch && !descMatch && !tagMatch) return false;
      }

      return true;
    })
  );

  const CATEGORY_META: Record<string, { label: string; badgeClass: string }> = {
    conversation: {
      label: 'Daily Conversation',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
    },
    grammar: {
      label: 'Grammar & Structure',
      badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
    },
    vocabulary: {
      label: 'Vocabulary & Phrases',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
    },
    alphabet: {
      label: 'Reading & Writing',
      badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
    },
    culture: {
      label: 'Culture & Literature',
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
    }
  };

  function clearAllFilters() {
    searchQuery = '';
    selectedCategory = 'all';
    selectedTag = null;
    selectedDialect = 'all';
    selectedLang = 'all';
    selectedLevel = 'all';
  }

  let hasActiveFilters = $derived(
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'all' ||
    selectedTag !== null ||
    selectedDialect !== 'all' ||
    selectedLang !== 'all' ||
    selectedLevel !== 'all'
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
      <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl">{m.courses_title()}</h1>
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

  <!-- Primary Tab Switcher: All Courses vs My Enrolled Courses -->
  <div class="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
    <div class="flex items-center gap-2">
      <button
        type="button"
        onclick={() => (activeTab = 'all')}
        class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all {activeTab === 'all'
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
      >
        <BookOpen class="h-4 w-4" />
        <span>All Courses</span>
        <span class="rounded-full bg-background/20 px-2 py-0.5 text-xs font-semibold">
          {courses.length}
        </span>
      </button>

      <button
        type="button"
        onclick={() => (activeTab = 'enrolled')}
        class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all {activeTab === 'enrolled'
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
      >
        <UserCheck class="h-4 w-4" />
        <span>My Enrolled Courses</span>
        <span class="rounded-full bg-background/20 px-2 py-0.5 text-xs font-semibold">
          {enrolledCourses.length}
        </span>
      </button>
    </div>

    {#if hasActiveFilters}
      <Button variant="ghost" size="sm" onclick={clearAllFilters} class="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <X class="h-3.5 w-3.5" />
        Reset Filters
      </Button>
    {/if}
  </div>

  <!-- Category Pills Strip -->
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <span class="text-muted-foreground text-xs font-bold tracking-wider uppercase">
        Explore by Subject / Category
      </span>
      {#if selectedTag}
        <Badge variant="secondary" class="gap-1 text-xs">
          Tag: #{selectedTag}
          <button type="button" onclick={() => (selectedTag = null)} class="ml-1 hover:text-destructive">
            <X class="h-3 w-3" />
          </button>
        </Badge>
      {/if}
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        onclick={() => (selectedCategory = 'all')}
        class="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all {selectedCategory ===
        'all'
          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
          : 'bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'}"
      >
        <Layers class="h-3.5 w-3.5" />
        All Topics
      </button>

      {#each COURSE_CATEGORIES as cat}
        {@const isSelected = selectedCategory === cat.value}
        <button
          type="button"
          onclick={() => (selectedCategory = isSelected ? 'all' : cat.value)}
          class="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all {isSelected
            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
            : 'bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'}"
        >
          {#if cat.value === 'conversation'}
            <MessageCircle class="h-3.5 w-3.5" />
          {:else if cat.value === 'grammar'}
            <BookA class="h-3.5 w-3.5" />
          {:else if cat.value === 'vocabulary'}
            <BookMarked class="h-3.5 w-3.5" />
          {:else if cat.value === 'alphabet'}
            <SpellCheck class="h-3.5 w-3.5" />
          {:else}
            <Sparkles class="h-3.5 w-3.5" />
          {/if}
          {cat.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Search & Secondary Filter Dropdowns -->
  <div class="bg-muted/20 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5">
    <div class="relative w-full max-w-sm">
      <Search class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
      <Input
        type="search"
        bind:value={searchQuery}
        placeholder="Search courses, topics, or #tags..."
        class="h-9 pl-9 text-xs"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <Filter class="text-muted-foreground h-3.5 w-3.5" />

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

  <!-- Course Cards Grid -->
  {#if activeTab === 'enrolled' && !user}
    <Card.Root class="border-dashed py-16 text-center">
      <Card.Content class="space-y-4 max-w-md mx-auto">
        <UserCheck class="text-muted-foreground mx-auto h-12 w-12 opacity-40" />
        <div class="space-y-1">
          <h3 class="text-lg font-bold">Sign In to Track Your Enrolled Courses</h3>
          <p class="text-muted-foreground text-sm">
            Log in to save lesson progress, earn reputation points (XP), and pick up right where you left off.
          </p>
        </div>
        <Button href="/login">Sign In with Google</Button>
      </Card.Content>
    </Card.Root>
  {:else if filteredCourses.length === 0}
    <Card.Root class="border-dashed py-16 text-center">
      <Card.Content class="space-y-3">
        <BookOpen class="text-muted-foreground mx-auto h-10 w-10 opacity-40" />
        {#if activeTab === 'enrolled'}
          <p class="text-lg font-semibold">You haven't enrolled in any courses yet</p>
          <p class="text-muted-foreground text-sm max-w-md mx-auto">
            Browse our full catalog of Amazigh courses and start your learning journey!
          </p>
          <Button onclick={() => (activeTab = 'all')} class="mt-2">Browse All Courses</Button>
        {:else}
          <p class="text-lg font-semibold">No courses match your active search or filters</p>
          <Button variant="outline" size="sm" onclick={clearAllFilters} class="mt-2">
            Clear Filters
          </Button>
        {/if}
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {#each filteredCourses as course (course.id)}
        {@const prog = getCourseProgress(course)}
        {@const catMeta = CATEGORY_META[course.category || 'conversation'] ?? CATEGORY_META.conversation}
        {@const isEnrolled = enrollments.some((e: any) => e.course_id === course.id) || prog.completed > 0}

        <Card.Root class="hover:border-primary/50 flex flex-col justify-between transition-all hover:shadow-md">
          <Card.Header class="space-y-3">
            <!-- Badges Row -->
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider {catMeta.badgeClass}">
                {catMeta.label}
              </span>

              <div class="flex items-center gap-1.5">
                {#if course.dialects?.name}
                  <Badge variant="outline" class="gap-1 text-[10px]">
                    <Globe class="h-3 w-3" />
                    {course.dialects.name}
                  </Badge>
                {/if}
                <Badge variant="secondary" class="text-[10px] uppercase">
                  {course.instruction_language || 'en'}
                </Badge>
              </div>
            </div>

            <!-- Title & Description -->
            <div class="space-y-1">
              <Card.Title class="text-xl leading-snug">
                <a href="/courses/{course.slug}" class="hover:text-primary transition-colors">
                  {course.title}
                </a>
              </Card.Title>

              {#if course.description}
                <Card.Description class="line-clamp-2 text-sm leading-relaxed">
                  {course.description}
                </Card.Description>
              {/if}
            </div>

            <!-- Tag Chips -->
            {#if Array.isArray(course.tags) && course.tags.length > 0}
              <div class="flex flex-wrap gap-1 pt-1">
                {#each course.tags as tag}
                  <button
                    type="button"
                    onclick={() => (selectedTag = selectedTag === tag ? null : tag)}
                    class="bg-muted hover:bg-primary/10 hover:text-primary rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors {selectedTag ===
                    tag
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-muted-foreground'}"
                  >
                    #{tag}
                  </button>
                {/each}
              </div>
            {/if}

            <!-- Progress Bar (for enrolled courses) -->
            {#if isEnrolled}
              <div class="bg-muted/40 rounded-lg border p-2.5 space-y-1.5">
                <div class="flex items-center justify-between text-xs font-semibold">
                  <span class="text-muted-foreground">Progress</span>
                  <span class="text-primary">{prog.completed} / {prog.total} ({prog.percent}%)</span>
                </div>
                <div class="bg-background h-2 w-full overflow-hidden rounded-full border">
                  <div
                    class="bg-primary h-full transition-all duration-300"
                    style="width: {prog.percent}%"
                  ></div>
                </div>
              </div>
            {/if}
          </Card.Header>

          <Card.Footer class="bg-muted/20 flex items-center justify-between border-t px-6 py-4">
            <div class="text-muted-foreground flex items-center gap-1.5 text-xs">
              <BookOpen class="h-3.5 w-3.5" />
              <span>{course.modules?.length ?? 0} Mods • {prog.total} Lessons</span>
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
</div>
