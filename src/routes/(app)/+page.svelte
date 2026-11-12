<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Avatar from '$lib/components/ui/avatar';
  import {
    ArrowRight,
    Sparkles,
    Clock,
    Compass,
    HandHeart,
    Globe,
    X,
    Shuffle,
    ShieldCheck,
    GraduationCap,
    Gamepad2,
    Users,
    CheckCircle2,
    BookOpen,
    Award
  } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { ALPHABET_LATIN } from '$lib/utils/amazigh';
  import AmazighWord from '$lib/components/dictionary/AmazighWord.svelte';
  import RotatingStatsBar from '$lib/components/layout/RotatingStatsBar.svelte';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();
  const {
    wordOfTheDay,
    allWordsPool,
    recentWords,
    platformStats,
    dialects,
    browsedWords,
    browseTotal,
    browsePage,
    browsePageSize,
    wordsNeedingHelp,
    wordsNeedingDefinition,
    wordsNeedingTifinagh,
    wordsNeedingVerification,
    dailyChallenge,
    featuredCourses,
    topContributors,
    activeLetter,
    activeDialect
  } = $derived(data);

  let isFiltering = $derived(Boolean(activeLetter || activeDialect));
  let totalBrowsePages = $derived(Math.max(1, Math.ceil((browseTotal || browsedWords.length) / browsePageSize)));

  function browseHref(targetPage: number): string {
    const params = new URLSearchParams();
    if (activeLetter) params.set('letter', activeLetter);
    if (activeDialect) params.set('dialect', String(activeDialect));
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return qs ? `/?${qs}#browse` : '/#browse';
  }

  // Interactive Word of the Day shuffle state
  let shuffledIndex = $state<number | null>(null);
  let activeSpotlightWord = $derived(
    shuffledIndex !== null && allWordsPool.length > 0
      ? allWordsPool[shuffledIndex % allWordsPool.length]
      : wordOfTheDay
  );

  function shuffleSpotlightWord() {
    if (!allWordsPool || allWordsPool.length === 0) return;
    const next = Math.floor(Math.random() * allWordsPool.length);
    shuffledIndex = next === shuffledIndex ? (next + 1) % allWordsPool.length : next;
  }

  // Contribution & Verification queue tabs
  type QueueTab = 'all' | 'definition' | 'tifinagh' | 'verification';
  let activeQueueTab = $state<QueueTab>('all');

  let displayedQueueWords = $derived.by(() => {
    if (activeQueueTab === 'definition') return wordsNeedingDefinition;
    if (activeQueueTab === 'tifinagh') return wordsNeedingTifinagh;
    if (activeQueueTab === 'verification') return wordsNeedingVerification;
    return wordsNeedingHelp;
  });

  // Mini daily challenge on landing page (seeded daily from the dictionary)
  let selectedQuizIdx = $state<number | null>(null);
</script>

<div class="container mx-auto space-y-10 px-4 py-8 sm:space-y-14 sm:py-10">
  <!-- Hero Section -->
  <section class="mx-auto max-w-4xl space-y-5 text-center sm:space-y-6">
    <div class="inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border bg-muted/40 px-3.5 py-1.5 text-xs font-medium sm:rounded-full sm:px-4">
      <Sparkles class="text-primary h-3.5 w-3.5 shrink-0" />
      <span>
        <AmazighWord word="Azul" showTifinaghInline />! Welcome to
        <AmazighWord word="Asafu" showTifinaghInline /> — hover or tap any dotted Amazigh word for instant definitions
      </span>
    </div>

    <h1 class="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
      {m.hero_title_prefix()}
      <span class="text-primary">{m.hero_title_highlight()}</span>
      {m.hero_title_suffix()}
    </h1>

    <p class="text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed sm:text-xl">
      {m.hero_subtitle()} Explore our living <AmazighWord word="Amawal" />, structured
      <AmazighWord word="Timsirin" />, daily <AmazighWord word="Uraren" />, and global
      <AmazighWord word="Amezday" /> across <AmazighWord word="Tamazɣa" />.
    </p>

    <div class="flex flex-wrap items-center justify-center gap-2.5 pt-1 sm:gap-3">
      <Button size="lg" href="/add" class="w-full gap-2 sm:w-auto">
        {m.cta_contribute_word()}
        <ArrowRight class="h-4 w-4" />
      </Button>
      <Button variant="outline" size="lg" href="/courses" class="w-full gap-2 sm:w-auto">
        <GraduationCap class="h-4 w-4" />
        {m.cta_explore_courses()}
      </Button>
      <Button variant="ghost" size="lg" href="/community" class="w-full gap-2 sm:w-auto">
        <Users class="h-4 w-4" />
        {m.nav_community ? m.nav_community() : 'Community'}
      </Button>
    </div>

    <!-- Rotating Live Platform Stats Bar -->
    <div class="pt-4">
      <RotatingStatsBar stats={platformStats} />
    </div>
  </section>

  <!-- Word of the Day + Daily Mini-Challenge -->
  <section id="word-of-the-day" class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    {#if activeSpotlightWord}
      {@const primaryDef = activeSpotlightWord.definitions?.[0]}
      {@const attrs = (primaryDef?.attributes as Record<string, string> | null) ?? null}
      <Card.Root class="from-primary/5 via-background to-background border-primary/25 flex flex-col justify-between bg-gradient-to-br lg:col-span-2">
        <Card.Header class="pb-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <Sparkles class="h-5 w-5 text-amber-500" />
              <span class="text-xs font-bold tracking-wider uppercase">
                {shuffledIndex !== null ? 'Random Word Spotlight' : m.word_of_the_day()}
              </span>
              <span class="text-primary font-serif text-xs">• ⴰⵡⴰⵍ ⵏ ⵡⴰⵙⵙ</span>
            </div>

            <div class="flex items-center gap-2">
              {#if primaryDef?.dialects?.name}
                <Badge variant="secondary" class="gap-1 text-xs">
                  <Globe class="h-3 w-3" />
                  {primaryDef.dialects.name}
                </Badge>
              {/if}
              {#if primaryDef?.is_verified}
                <Badge variant="outline" class="border-emerald-500/40 bg-emerald-500/10 gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck class="h-3 w-3" />
                  Verified
                </Badge>
              {/if}
              <Button
                variant="outline"
                size="sm"
                onclick={shuffleSpotlightWord}
                class="h-7 gap-1.5 text-xs"
                title="Discover another word"
              >
                <Shuffle class="h-3.5 w-3.5" />
                <span>Shuffle</span>
              </Button>
            </div>
          </div>
        </Card.Header>

        <Card.Content class="space-y-4 pb-6">
          <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div class="space-y-1.5">
              <div class="flex flex-wrap items-baseline gap-3">
                <h2 class="text-primary text-4xl font-extrabold tracking-tight sm:text-5xl">
                  {activeSpotlightWord.script_latin}
                </h2>
                {#if activeSpotlightWord.script_tifinagh}
                  <span class="text-foreground/85 font-serif text-2xl font-semibold sm:text-3xl">
                    {activeSpotlightWord.script_tifinagh}
                  </span>
                {/if}
              </div>

              {#if attrs?.part_of_speech || attrs?.pos || attrs?.construct_state || attrs?.plural || attrs?.root}
                <div class="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {#if attrs?.part_of_speech || attrs?.pos}
                    <span class="bg-primary/10 text-primary rounded px-2 py-0.5 font-semibold capitalize italic">
                      {attrs.part_of_speech || attrs.pos}
                    </span>
                  {/if}
                  {#if attrs?.root}
                    <a
                      href="/search?q={encodeURIComponent(`root:${attrs.root}`)}"
                      class="border-primary/25 bg-primary/5 text-primary hover:bg-primary/15 rounded border px-2 py-0.5 font-mono text-[11px] font-bold transition-colors"
                      title="Explore words sharing this root"
                    >
                      Root {attrs.root}
                    </a>
                  {/if}
                  {#if attrs?.construct_state}
                    <span class="text-muted-foreground">
                      <AmazighWord word="addad-amaruz">Addad Amaruz</AmazighWord>:
                      <strong class="text-foreground">{attrs.construct_state}</strong>
                    </span>
                  {/if}
                  {#if attrs?.plural}
                    <span class="text-muted-foreground">
                      Plural: <strong class="text-foreground">{attrs.plural}</strong>
                    </span>
                  {/if}
                </div>
              {/if}
            </div>

            <Button href="/word/{activeSpotlightWord.slug}" class="group shrink-0">
              {m.view_definition()}
              <ArrowRight class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          <div class="bg-muted/30 rounded-lg border p-4">
            {#if primaryDef?.definition_text}
              <p class="text-foreground text-base leading-relaxed">
                {primaryDef.definition_text}
              </p>
            {:else}
              <p class="text-muted-foreground text-sm italic">
                This headword was recently cataloged and is awaiting its first community definition.
              </p>
            {/if}
          </div>
        </Card.Content>
      </Card.Root>
    {/if}

    <!-- Daily Games Quick Teaser Card (Uraren) -->
    <Card.Root class="bg-card flex flex-col justify-between border">
      <Card.Header class="pb-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Gamepad2 class="text-primary h-5 w-5" />
            <span class="text-xs font-bold tracking-wider uppercase">
              Daily <AmazighWord word="Uraren" />
            </span>
          </div>
          <Badge variant="secondary" class="text-[10px]">Mini Challenge</Badge>
        </div>
        <Card.Title class="pt-1 text-lg">
          What does
          <a href="/word/{dailyChallenge.slug}" class="text-primary hover:underline">
            {dailyChallenge.latin}{#if dailyChallenge.tifinagh} ({dailyChallenge.tifinagh}){/if}
          </a>
          mean?
        </Card.Title>
      </Card.Header>

      <Card.Content class="space-y-2 py-2">
        {#each dailyChallenge.options as opt, idx}
          <button
            type="button"
            onclick={() => (selectedQuizIdx = idx)}
            class="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all {selectedQuizIdx ===
            idx
              ? opt.correct
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
              : 'hover:bg-muted/60 bg-background'}"
          >
            <span class="line-clamp-2">{opt.label}</span>
            {#if selectedQuizIdx === idx}
              <span class="shrink-0 text-[10px] font-bold">
                {opt.correct ? '✓ Ayyuz!' : 'Try again'}
              </span>
            {/if}
          </button>
        {/each}
      </Card.Content>

      <Card.Footer class="border-t py-3.5">
        <a
          href="/games"
          class="text-primary inline-flex w-full items-center justify-between text-xs font-semibold hover:underline"
        >
          <span>Explore Tawalt, Anagam & Assaɣen</span>
          <ArrowRight class="h-3.5 w-3.5 shrink-0" />
        </a>
      </Card.Footer>
    </Card.Root>
  </section>

  <!-- Browse by Alphabet & Dialect -->
  <section id="browse" class="bg-muted/20 space-y-5 rounded-xl border p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <Compass class="text-primary h-5 w-5" />
        <h2 class="text-xl font-bold">{m.browse_title()}</h2>
        <span class="text-muted-foreground text-xs">
          • <AmazighWord word="Agemmay" showTifinaghInline />
        </span>
      </div>
      <div class="flex items-center gap-2">
        {#if isFiltering}
          <Button variant="ghost" size="sm" href="/" class="h-7 gap-1 text-xs">
            <X class="h-3.5 w-3.5" />
            {m.clear_filters()}
          </Button>
        {/if}
        <Button variant="outline" size="sm" href="/search" class="h-7 gap-1 text-xs">
          Advanced Search
          <ArrowRight class="h-3 w-3" />
        </Button>
      </div>
    </div>

    <!-- Alphabet Strip -->
    <div class="space-y-2">
      <span class="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {m.browse_by_letter()}
      </span>
      <div class="flex flex-wrap gap-1.5">
        {#each ALPHABET_LATIN as letter}
          <a
            href={activeLetter === letter
              ? activeDialect
                ? `/?dialect=${activeDialect}`
                : '/'
              : `/?letter=${encodeURIComponent(letter)}${activeDialect ? `&dialect=${activeDialect}` : ''}`}
            class="inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs font-bold transition-colors {activeLetter ===
            letter
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background hover:bg-muted text-foreground'}"
          >
            {letter}
          </a>
        {/each}
      </div>
    </div>

    <!-- Dialect Strip -->
    <div class="space-y-2">
      <span class="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {m.browse_by_dialect()}
      </span>
      <div class="flex flex-wrap gap-2">
        {#each dialects as dialect}
          <a
            href={activeDialect === dialect.id
              ? activeLetter
                ? `/?letter=${encodeURIComponent(activeLetter)}`
                : '/'
              : `/?dialect=${dialect.id}${activeLetter ? `&letter=${encodeURIComponent(activeLetter)}` : ''}`}
            class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors {activeDialect ===
            dialect.id
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background hover:bg-muted text-foreground'}"
          >
            <Globe class="h-3 w-3" />
            {dialect.name}
          </a>
        {/each}
      </div>
    </div>

    {#if isFiltering}
      <div class="border-t pt-4">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-muted-foreground text-xs font-bold tracking-wider uppercase">
            Matching Words ({browseTotal > 0 ? browseTotal.toLocaleString() : browsedWords.length})
          </h3>
          {#if totalBrowsePages > 1}
            <span class="text-muted-foreground text-xs">
              Page {browsePage} of {totalBrowsePages}
            </span>
          {/if}
        </div>
        {#if browsedWords.length === 0}
          <div class="bg-background rounded-lg border border-dashed p-6 text-center">
            <p class="text-muted-foreground text-sm">
              No words found matching this filter yet.
            </p>
            <Button variant="link" size="sm" href="/add" class="mt-1">
              + {m.cta_contribute_word()}
            </Button>
          </div>
        {:else}
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {#each browsedWords as word (word.id)}
              <a
                href="/word/{word.slug}"
                class="bg-background hover:border-primary/50 flex items-center justify-between gap-2 rounded-lg border p-3.5 transition-all hover:shadow-sm"
              >
                <div class="min-w-0">
                  <p class="text-foreground truncate font-bold">{word.script_latin}</p>
                  {#if word.definitions?.[0]?.definition_text}
                    <p class="text-muted-foreground line-clamp-1 text-xs">
                      {word.definitions[0].definition_text}
                    </p>
                  {:else}
                    <p class="text-muted-foreground/60 text-xs italic">{m.needs_definition()}</p>
                  {/if}
                </div>
                {#if word.script_tifinagh}
                  <Badge variant="secondary" class="shrink-0 font-serif text-sm">
                    {word.script_tifinagh}
                  </Badge>
                {/if}
              </a>
            {/each}
          </div>

          {#if totalBrowsePages > 1 || browsedWords.length >= browsePageSize}
            <div class="mt-4 flex items-center justify-between border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                href={browsePage > 1 ? browseHref(browsePage - 1) : undefined}
                disabled={browsePage <= 1}
                class="text-xs"
              >
                ← Previous
              </Button>
              <span class="text-muted-foreground text-xs">
                Showing {(browsePage - 1) * browsePageSize + 1}–{(browsePage - 1) * browsePageSize + browsedWords.length}
                {#if browseTotal > 0} of {browseTotal.toLocaleString()}{/if}
              </span>
              <Button
                variant="outline"
                size="sm"
                href={browsePage < totalBrowsePages ? browseHref(browsePage + 1) : undefined}
                disabled={browsePage >= totalBrowsePages}
                class="text-xs"
              >
                Next →
              </Button>
            </div>
          {/if}
        {/if}
      </div>
    {/if}
  </section>

  <!-- Recently Added Words -->
  <section id="recent">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <Clock class="text-primary h-5 w-5" />
        <h2 class="text-2xl font-bold">{m.recently_added()}</h2>
      </div>
      <Button variant="outline" size="sm" href="/add" class="gap-1.5 text-xs">
        + {m.cta_contribute_word()}
      </Button>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each recentWords as word (word.id)}
        {@const firstDef = word.definitions?.[0]}
        <a href="/word/{word.slug}" class="group block">
          <Card.Root class="hover:border-primary/50 flex h-full flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md">
            <Card.Header class="pb-2">
              <Card.Title class="flex items-center justify-between gap-2">
                <span class="group-hover:text-primary text-lg font-bold transition-colors">
                  {word.script_latin}
                </span>
                {#if word.script_tifinagh}
                  <Badge variant="secondary" class="font-serif text-sm font-normal">
                    {word.script_tifinagh}
                  </Badge>
                {/if}
              </Card.Title>

              {#if firstDef?.definition_text}
                <p class="text-muted-foreground line-clamp-2 pt-1 text-xs leading-relaxed">
                  {firstDef.definition_text}
                </p>
              {:else}
                <p class="text-muted-foreground/60 pt-1 text-xs italic">
                  {m.needs_definition()}
                </p>
              {/if}
            </Card.Header>

            <Card.Content class="pt-0">
              <div class="text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-[11px]">
                <div class="flex items-center gap-1.5">
                  {#if firstDef?.dialects?.name}
                    <span class="bg-muted rounded px-1.5 py-0.5 font-medium">
                      {firstDef.dialects.name}
                    </span>
                  {/if}
                  {#if firstDef?.is_verified}
                    <span class="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 class="h-3 w-3" /> Verified
                    </span>
                  {/if}
                </div>
                <span>
                  {word.definitions?.length ?? 0} {m.stats_definitions().toLowerCase()}
                </span>
              </div>
            </Card.Content>
          </Card.Root>
        </a>
      {/each}
    </div>
  </section>

  <!-- Community Contribution & Verification Queue -->
  {#if wordsNeedingHelp.length > 0 || wordsNeedingVerification.length > 0}
    <section id="contribute" class="bg-muted/15 rounded-2xl border p-4 sm:p-8">
      <div class="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <HandHeart class="text-primary h-5 w-5" />
            <h2 class="text-2xl font-bold">{m.help_complete_title()}</h2>
          </div>
          <p class="text-muted-foreground text-sm">
            {m.help_complete_subtitle()}
          </p>
        </div>

        <!-- Queue Filter Tabs -->
        <div class="flex flex-wrap gap-1.5">
          <button
            type="button"
            onclick={() => (activeQueueTab = 'all')}
            class="rounded-full px-3 py-1 text-xs font-medium transition-colors {activeQueueTab ===
            'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted text-muted-foreground border'}"
          >
            All Tasks ({wordsNeedingHelp.length})
          </button>
          <button
            type="button"
            onclick={() => (activeQueueTab = 'definition')}
            class="rounded-full px-3 py-1 text-xs font-medium transition-colors {activeQueueTab ===
            'definition'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted text-muted-foreground border'}"
          >
            {m.needs_definition()} ({wordsNeedingDefinition.length})
          </button>
          <button
            type="button"
            onclick={() => (activeQueueTab = 'tifinagh')}
            class="rounded-full px-3 py-1 text-xs font-medium transition-colors {activeQueueTab ===
            'tifinagh'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted text-muted-foreground border'}"
          >
            {m.needs_tifinagh()} ({wordsNeedingTifinagh.length})
          </button>
          <button
            type="button"
            onclick={() => (activeQueueTab = 'verification')}
            class="rounded-full px-3 py-1 text-xs font-medium transition-colors {activeQueueTab ===
            'verification'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted text-muted-foreground border'}"
          >
            Needs Verification ({wordsNeedingVerification.length})
          </button>
        </div>
      </div>

      {#if displayedQueueWords.length === 0}
        <div class="bg-background rounded-xl border border-dashed p-6 text-center">
          <p class="text-muted-foreground text-sm">
            All caught up in this queue! Try another tab or add a new headword.
          </p>
        </div>
      {:else}
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {#each displayedQueueWords as word (word.id)}
            <a
              href="/word/{word.slug}"
              class="bg-card hover:border-primary/50 group flex items-center justify-between rounded-xl border p-4 transition-all hover:shadow-sm"
            >
              <div class="space-y-1.5">
                <div class="flex items-center gap-2">
                  <p class="group-hover:text-primary font-bold transition-colors">
                    {word.script_latin}
                  </p>
                  {#if word.script_tifinagh}
                    <span class="text-muted-foreground font-serif text-xs">
                      {word.script_tifinagh}
                    </span>
                  {/if}
                </div>
                <div class="flex flex-wrap gap-1.5">
                  {#if !word.definitions || word.definitions.length === 0}
                    <Badge variant="outline" class="border-amber-500/40 text-[10px] text-amber-600 dark:text-amber-400">
                      {m.needs_definition()}
                    </Badge>
                  {/if}
                  {#if !word.script_tifinagh}
                    <Badge variant="outline" class="border-blue-500/40 text-[10px] text-blue-600 dark:text-blue-400">
                      {m.needs_tifinagh()}
                    </Badge>
                  {/if}
                  {#if word.definitions && word.definitions.length > 0 && word.definitions.some((d) => !d.is_verified)}
                    <Badge variant="outline" class="border-purple-500/40 text-[10px] text-purple-600 dark:text-purple-400">
                      Awaiting Verification
                    </Badge>
                  {/if}
                </div>
              </div>
              <ArrowRight class="text-muted-foreground group-hover:text-primary h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  <!-- Cross-Pillar Spotlight: Featured Courses (Timsirin) & Top Contributors (Amezday) -->
  <section class="grid grid-cols-1 gap-8 lg:grid-cols-3">
    <!-- Featured Courses (2 cols) -->
    <div class="space-y-4 lg:col-span-2">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <GraduationCap class="text-primary h-5 w-5" />
            <h2 class="text-2xl font-bold">
              Structured <AmazighWord word="Timsirin" showTifinaghInline />
            </h2>
          </div>
          <p class="text-muted-foreground text-xs">
            Learn <AmazighWord word="Asiwel" /> (conversation), <AmazighWord word="Tajerrumt" /> (grammar), and <AmazighWord word="Tasekla" /> (culture) step by step
          </p>
        </div>
        <Button variant="ghost" size="sm" href="/courses" class="gap-1 text-xs">
          <span>All courses</span>
          <ArrowRight class="h-3.5 w-3.5" />
        </Button>
      </div>

      {#if featuredCourses.length === 0}
        <Card.Root class="border-dashed p-6 text-center">
          <p class="text-muted-foreground text-sm">
            Courses are being prepared in the Educator Studio.
          </p>
        </Card.Root>
      {:else}
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {#each featuredCourses as course (course.id)}
            <a href="/courses/{course.id}" class="group block">
              <Card.Root class="hover:border-primary/50 flex h-full flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md">
                <Card.Header class="pb-3">
                  <div class="mb-1.5 flex flex-wrap items-center gap-1.5">
                    {#if course.dialects?.name}
                      <Badge variant="secondary" class="text-[10px]">
                        {course.dialects.name}
                      </Badge>
                    {/if}
                    {#if course.difficulty_level}
                      <Badge variant="outline" class="text-[10px] capitalize">
                        {course.difficulty_level}
                      </Badge>
                    {/if}
                  </div>
                  <Card.Title class="group-hover:text-primary text-base transition-colors">
                    {course.title}
                  </Card.Title>
                  {#if course.description}
                    <Card.Description class="line-clamp-2 pt-1 text-xs">
                      {course.description}
                    </Card.Description>
                  {/if}
                </Card.Header>
                <Card.Footer class="text-muted-foreground flex items-center justify-between border-t py-3.5 text-xs">
                  <span class="inline-flex items-center gap-1">
                    <BookOpen class="h-3.5 w-3.5" />
                    {course.modules?.[0]?.count ?? 0} modules
                  </span>
                  <span class="text-primary font-semibold group-hover:underline">
                    Start learning →
                  </span>
                </Card.Footer>
              </Card.Root>
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Community Pulse (1 col) -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <Users class="text-primary h-5 w-5" />
            <h2 class="text-2xl font-bold">
              <AmazighWord word="Amezday" showTifinaghInline />
            </h2>
          </div>
          <p class="text-muted-foreground text-xs">
            Active contributors & educators
          </p>
        </div>
        <Button variant="ghost" size="sm" href="/community" class="gap-1 text-xs">
          <span>Directory</span>
          <ArrowRight class="h-3.5 w-3.5" />
        </Button>
      </div>

      <Card.Root class="py-0">
        <Card.Content class="divide-y p-0">
          {#each topContributors as member (member.id)}
            <a
              href="/user/{member.username}"
              class="hover:bg-muted/40 flex items-center justify-between gap-3 px-4 py-3 transition-colors"
            >
              <div class="flex items-center gap-3 overflow-hidden">
                <Avatar.Root class="h-9 w-9 shrink-0 border">
                  <Avatar.Image src={member.avatar_url} alt={member.username} />
                  <Avatar.Fallback class="text-xs font-bold">
                    {member.username.slice(0, 2).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar.Root>
                <div class="truncate">
                  <p class="text-foreground truncate text-sm font-semibold">
                    {member.first_name || member.last_name
                      ? `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim()
                      : member.username}
                  </p>
                  <p class="text-muted-foreground truncate text-xs">@{member.username}</p>
                </div>
              </div>

              <div class="flex shrink-0 items-center gap-2">
                {#if member.role === 'admin' || member.role === 'instructor'}
                  <Badge variant="secondary" class="text-[10px] capitalize">
                    {member.role}
                  </Badge>
                {/if}
                <span class="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold">
                  <Award class="h-3 w-3" />
                  {member.reputation_points ?? 0}
                </span>
              </div>
            </a>
          {/each}
        </Card.Content>
      </Card.Root>
    </div>
  </section>
</div>
