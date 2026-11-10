<script lang="ts">
  import { onMount } from 'svelte';
  import type { PlatformStats } from '$lib/server/stats';
  import {
    BookOpen,
    Sparkles,
    Globe,
    Users,
    GraduationCap,
    Clock,
    Volume2,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Pause,
    Play
  } from '@lucide/svelte';
  import * as m from '$lib/paraglide/messages.js';

  let {
    stats,
    compact = false
  }: {
    stats: PlatformStats;
    compact?: boolean;
  } = $props();

  type StatCategory = 'all' | 'dictionary' | 'academy' | 'community';

  let activeCategory = $state<StatCategory>('all');
  let pageIndex = $state(0);
  let isPaused = $state(false);

  let allItems = $derived([
    {
      id: 'words',
      category: 'dictionary' as const,
      value: stats.totalWords.toLocaleString(),
      label: m.stats_words(),
      tifinagh: 'ⴰⵡⴰⵍⵏ • Awalen',
      subtext: 'Headwords indexed in Latin & Tifinagh',
      href: '/#browse',
      icon: BookOpen,
      accent: 'text-blue-600 dark:text-blue-400 bg-blue-500/10'
    },
    {
      id: 'definitions',
      category: 'dictionary' as const,
      value: stats.totalDefinitions.toLocaleString(),
      label: m.stats_definitions(),
      tifinagh: 'ⵉⵙⴼⵔⵓⵜⵏ • Isefruten',
      subtext: `${stats.totalVerifiedDefinitions.toLocaleString()} educator-verified meanings`,
      href: '/#recent',
      icon: Sparkles,
      accent: 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
    },
    {
      id: 'contributors',
      category: 'community' as const,
      value: stats.totalContributors.toLocaleString(),
      label: 'Contributors & Learners',
      tifinagh: 'ⵉⵎⴷⵔⴰⵡⵏ • Imdrawen',
      subtext: 'Native speakers, linguists & learners',
      href: '/community',
      icon: Users,
      accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
    },
    {
      id: 'hours',
      category: 'academy' as const,
      value: `${stats.estimatedLearningHours}h+`,
      label: 'Hours of Lessons',
      tifinagh: 'ⵜⵉⵙⵔⴰⴳⵉⵏ • Tisragin',
      subtext: `${stats.totalLessons} lessons across ${stats.totalCourses} courses`,
      href: '/courses',
      icon: Clock,
      accent: 'text-purple-600 dark:text-purple-400 bg-purple-500/10'
    },
    {
      id: 'dialects',
      category: 'dictionary' as const,
      value: stats.totalDialects.toLocaleString(),
      label: m.stats_dialects(),
      tifinagh: 'ⵜⴰⵏⵜⴰⵍⵉⵡⵉⵏ • Tantaliwin',
      subtext: 'Regional varieties across Tamazɣa',
      href: '/about#dialects',
      icon: Globe,
      accent: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10'
    },
    {
      id: 'courses',
      category: 'academy' as const,
      value: stats.totalCourses.toLocaleString(),
      label: 'Structured Courses',
      tifinagh: 'ⵜⵉⵎⵙⵉⵔⵉⵏ • Timsirin',
      subtext: `${stats.totalSteps} interactive learning steps`,
      href: '/courses',
      icon: GraduationCap,
      accent: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
    },
    {
      id: 'context',
      category: 'dictionary' as const,
      value: (stats.totalExamples + stats.totalAudioClips).toLocaleString(),
      label: 'Examples & Audio',
      tifinagh: 'ⵉⵎⴷⵢⴰⵜⵏ • Imdyaten',
      subtext: `${stats.totalExamples} sentences • ${stats.totalAudioClips} audio clips`,
      href: '/add',
      icon: Volume2,
      accent: 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
    },
    {
      id: 'verifications',
      category: 'community' as const,
      value: (stats.totalVotes + stats.totalVerifiedDefinitions).toLocaleString(),
      label: 'Peer Reviews & Votes',
      tifinagh: 'ⴰⵙⵖⵣⵏ • Asɣzen',
      subtext: `${stats.totalVotes} community votes cast`,
      href: '/community',
      icon: ShieldCheck,
      accent: 'text-teal-600 dark:text-teal-400 bg-teal-500/10'
    }
  ]);

  let filteredItems = $derived(
    activeCategory === 'all'
      ? allItems
      : allItems.filter((item) => item.category === activeCategory)
  );

  const pageSize = 4;
  let totalPages = $derived(Math.max(1, Math.ceil(filteredItems.length / pageSize)));

  let visibleItems = $derived.by(() => {
    if (filteredItems.length <= pageSize) return filteredItems;
    const start = (pageIndex % totalPages) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  });

  function nextPage() {
    pageIndex = (pageIndex + 1) % totalPages;
  }

  function prevPage() {
    pageIndex = (pageIndex - 1 + totalPages) % totalPages;
  }

  function selectCategory(cat: StatCategory) {
    activeCategory = cat;
    pageIndex = 0;
  }

  onMount(() => {
    const interval = setInterval(() => {
      if (!isPaused && totalPages > 1) {
        pageIndex = (pageIndex + 1) % totalPages;
      }
    }, 5000);
    return () => clearInterval(interval);
  });
</script>

<div
  class="mx-auto w-full {compact ? 'max-w-5xl' : 'max-w-5xl'}"
  role="region"
  aria-label="Live Platform Statistics"
  onmouseenter={() => (isPaused = true)}
  onmouseleave={() => (isPaused = false)}
  onfocusin={() => (isPaused = true)}
  onfocusout={() => (isPaused = false)}
>
  <!-- Top Controls Bar -->
  <div class="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
    <div class="flex max-w-full items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:pb-0">
      <button
        type="button"
        onclick={() => selectCategory('all')}
        class="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors {activeCategory === 'all'
          ? 'bg-primary text-primary-foreground shadow-xs'
          : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'}"
      >
        All Live Metrics (8)
      </button>
      <button
        type="button"
        onclick={() => selectCategory('dictionary')}
        class="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors {activeCategory ===
        'dictionary'
          ? 'bg-primary text-primary-foreground shadow-xs'
          : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'}"
      >
        Amawal (Lexicon)
      </button>
      <button
        type="button"
        onclick={() => selectCategory('academy')}
        class="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors {activeCategory ===
        'academy'
          ? 'bg-primary text-primary-foreground shadow-xs'
          : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'}"
      >
        Timsirin (Academy)
      </button>
      <button
        type="button"
        onclick={() => selectCategory('community')}
        class="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors {activeCategory ===
        'community'
          ? 'bg-primary text-primary-foreground shadow-xs'
          : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'}"
      >
        Amezday (Community)
      </button>
    </div>

    {#if totalPages > 1}
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          onclick={() => (isPaused = !isPaused)}
          class="text-muted-foreground hover:text-foreground inline-flex h-6 w-6 items-center justify-center rounded-md border text-xs transition-colors"
          title={isPaused ? 'Resume auto-rotation' : 'Pause auto-rotation'}
          aria-label={isPaused ? 'Resume auto-rotation' : 'Pause auto-rotation'}
        >
          {#if isPaused}
            <Play class="h-3 w-3" />
          {:else}
            <Pause class="h-3 w-3" />
          {/if}
        </button>

        <div class="flex items-center gap-1 px-1">
          {#each Array.from({ length: totalPages }) as _, idx}
            <button
              type="button"
              onclick={() => (pageIndex = idx)}
              aria-label={`Show stats page ${idx + 1}`}
              class="h-1.5 rounded-full transition-all {pageIndex % totalPages === idx
                ? 'bg-primary w-5'
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-1.5'}"
            ></button>
          {/each}
        </div>

        <button
          type="button"
          onclick={prevPage}
          class="text-muted-foreground hover:text-foreground inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors"
          aria-label="Previous stats"
        >
          <ChevronLeft class="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onclick={nextPage}
          class="text-muted-foreground hover:text-foreground inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors"
          aria-label="Next stats"
        >
          <ChevronRight class="h-3.5 w-3.5" />
        </button>
      </div>
    {/if}
  </div>

  <!-- Stats Cards Grid -->
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {#each visibleItems as item (item.id)}
      {@const Icon = item.icon}
      <a
        href={item.href}
        class="bg-card/70 hover:bg-card hover:border-primary/40 group flex flex-col justify-between rounded-xl border p-4 text-left shadow-xs backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-foreground text-2xl font-extrabold tracking-tight">{item.value}</p>
            <p class="text-foreground/90 mt-0.5 text-xs font-semibold">{item.label}</p>
          </div>
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg {item.accent}">
            <Icon class="h-4 w-4" />
          </div>
        </div>

        <div class="mt-3 border-t pt-2">
          <p class="text-primary font-serif text-[11px] font-medium">{item.tifinagh}</p>
          <p class="text-muted-foreground mt-0.5 line-clamp-1 text-[11px]">{item.subtext}</p>
        </div>
      </a>
    {/each}
  </div>
</div>
