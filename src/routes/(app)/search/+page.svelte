<script lang="ts">
  import { goto } from '$app/navigation';
  import {
    Search,
    Sparkles,
    ArrowRight,
    Plus,
    BookOpen,
    GitFork,
    Languages,
    ArrowLeft
  } from '@lucide/svelte';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import * as Card from '$lib/components/ui/card';
  import AmazighKeyboardBar from '$lib/components/dictionary/AmazighKeyboardBar.svelte';
  import { getQueryTifinaghPreview, parseRootQuery } from '$lib/utils/search';

  let { data } = $props();

  let inputValue = $state('');
  $effect(() => {
    inputValue = data.query ?? '';
  });

  let selectedType = $state('all');
  let selectedPos = $state('all');

  $effect(() => {
    selectedType = data.typeFilter ?? 'all';
    selectedPos = data.posFilter ?? 'all';
  });

  let liveTifPreview = $derived(getQueryTifinaghPreview(inputValue));
  let liveRootPreview = $derived(parseRootQuery(inputValue));

  let availablePos = $derived(
    Array.from(
      new Set(data.results.map((r) => r.part_of_speech).filter((p): p is string => Boolean(p)))
    ).sort()
  );

  let typeCounts = $derived.by(() => {
    const counts: Record<string, number> = {
      all: data.results.length,
      headword: 0,
      fuzzy: 0,
      root: 0,
      inflected: 0,
      meaning: 0
    };
    for (const r of data.results) {
      counts[r.match_type] = (counts[r.match_type] ?? 0) + 1;
    }
    return counts;
  });

  let filteredResults = $derived(
    data.results.filter((r) => {
      if (selectedType !== 'all' && r.match_type !== selectedType) return false;
      if (selectedPos !== 'all' && r.part_of_speech !== selectedPos) return false;
      return true;
    })
  );

  function submitSearch(e?: Event) {
    e?.preventDefault();
    const q = inputValue.trim();
    if (!q) {
      goto('/search');
      return;
    }
    goto(`/search?q=${encodeURIComponent(q)}`);
  }

  function quickSearch(term: string) {
    inputValue = term;
    goto(`/search?q=${encodeURIComponent(term)}`);
  }

  const SAMPLE_QUERIES = [
    { label: 'azul', hint: 'Exact Latin' },
    { label: 'aghrum', hint: 'gh → ɣ spelling' },
    { label: '√fs', hint: 'Root family' },
    { label: 'water', hint: 'English meaning' },
    { label: 'ecole', hint: 'Accent-folded French' },
    { label: 'ⴰⴼⵓⵙ', hint: 'Tifinagh script' },
    { label: 'tafuuct', hint: 'Typo tolerance' },
    { label: 'شمس', hint: 'Arabic meaning' }
  ];

  const TYPE_TABS = [
    { id: 'all', label: 'All' },
    { id: 'headword', label: 'Headwords' },
    { id: 'fuzzy', label: 'Similar / Typos' },
    { id: 'root', label: 'Root Family' },
    { id: 'inflected', label: 'Inflected' },
    { id: 'meaning', label: 'Meanings' }
  ];
</script>

<svelte:head>
  <title>{data.query ? `Search: ${data.query} — Asafu` : 'Dictionary Search — Asafu'}</title>
</svelte:head>

<div class="container mx-auto max-w-5xl space-y-8 px-4 py-8">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <Button
      variant="ghost"
      size="sm"
      href="/"
      class="text-muted-foreground hover:text-foreground -ml-2 gap-1.5 text-xs"
    >
      <ArrowLeft class="h-3.5 w-3.5" />
      Back to Dictionary
    </Button>
  </div>

  <!-- Search Header & Controls -->
  <section class="border-primary/20 from-primary/5 via-card to-card space-y-5 rounded-2xl border bg-gradient-to-br p-5 shadow-xs sm:p-8">
    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <Search class="text-primary h-5 w-5" />
        <h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Amawal Multi-Script Search
        </h1>
      </div>
      <p class="text-muted-foreground text-sm">
        Search across <strong>18,440+ Amazigh words</strong> using Latin (standard or casual spelling),
        Neo-Tifinagh, English, French (accents optional), Arabic, construct states, or consonantal roots like
        <code class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">√fs</code> or
        <code class="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">b-d-r</code>.
      </p>
    </div>

    <form onsubmit={submitSearch} class="space-y-3">
      <div class="flex flex-col gap-2 sm:flex-row">
        <div class="relative flex-1">
          <Search class="text-muted-foreground absolute top-3 left-3.5 h-4 w-4" />
          <Input
            type="search"
            bind:value={inputValue}
            placeholder="Try: tafukt, aghrum, √fs, water, ecole, ⴰⴼⵓⵙ..."
            class="h-10 pl-10 text-base"
            autofocus
          />
        </div>
        <Button type="submit" size="lg" class="h-10 gap-1.5 px-6">
          <Search class="h-4 w-4" />
          Search
        </Button>
      </div>

      <AmazighKeyboardBar bind:value={inputValue} />

      {#if liveTifPreview || liveRootPreview}
        <div class="flex flex-wrap items-center gap-3 text-xs">
          {#if liveRootPreview}
            <span class="border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium">
              <GitFork class="h-3.5 w-3.5" />
              Root family query: <strong class="font-mono">{liveRootPreview}</strong>
            </span>
          {:else if liveTifPreview}
            <span class="bg-background inline-flex items-center gap-2 rounded-full border px-3 py-1">
              <Languages class="text-primary h-3.5 w-3.5" />
              <span class="text-muted-foreground">Live Tifinagh:</span>
              <strong class="text-primary font-serif text-base">{liveTifPreview}</strong>
            </span>
          {/if}
        </div>
      {/if}
    </form>

    <!-- Sample Queries -->
    <div class="flex flex-wrap items-center gap-1.5 pt-1">
      <span class="text-muted-foreground mr-1 text-[11px] font-semibold uppercase tracking-wider">
        Try:
      </span>
      {#each SAMPLE_QUERIES as sample}
        <button
          type="button"
          onclick={() => quickSearch(sample.label)}
          class="bg-background hover:border-primary/50 hover:text-primary inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors"
          title={sample.hint}
        >
          <span class="font-semibold">{sample.label}</span>
          <span class="text-muted-foreground hidden text-[10px] sm:inline">· {sample.hint}</span>
        </button>
      {/each}
    </div>
  </section>

  {#if data.query}
    <!-- Filter Bar -->
    {#if data.results.length > 0}
      <div class="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap items-center gap-1.5">
          {#each TYPE_TABS as tab}
            {#if tab.id === 'all' || (typeCounts[tab.id] ?? 0) > 0}
              <button
                type="button"
                onclick={() => (selectedType = tab.id)}
                class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {selectedType ===
                tab.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted text-foreground'}"
              >
                {tab.label} ({typeCounts[tab.id] ?? 0})
              </button>
            {/if}
          {/each}
        </div>

        {#if availablePos.length > 1}
          <div class="flex items-center gap-2">
            <span class="text-muted-foreground text-xs">Part of speech:</span>
            <select
              bind:value={selectedPos}
              class="border-input bg-background h-8 rounded-md border px-2.5 text-xs capitalize"
            >
              <option value="all">All ({data.results.length})</option>
              {#each availablePos as pos}
                <option value={pos}>{pos}</option>
              {/each}
            </select>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Cultural Glossary Match if applicable -->
    {#if data.glossary}
      <Card.Root class="border-primary/30 bg-primary/5">
        <Card.Content class="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <Sparkles class="text-primary h-4 w-4" />
              <span class="text-primary text-xs font-bold uppercase tracking-wider">
                Cultural Glossary Note
              </span>
              <Badge variant="outline" class="text-[10px]">{data.glossary.dialect}</Badge>
            </div>
            <p class="text-sm font-semibold">
              {data.glossary.word}
              <span class="text-primary font-serif">({data.glossary.tifinagh})</span>:
              <span class="text-muted-foreground font-normal">{data.glossary.meaning}</span>
            </p>
          </div>
        </Card.Content>
      </Card.Root>
    {/if}

    <!-- Results List -->
    {#if filteredResults.length > 0}
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        {#each filteredResults as item (item.id)}
          <Card.Root class="hover:border-primary/50 flex flex-col justify-between transition-all hover:shadow-sm">
            <Card.Content class="flex h-full flex-col justify-between gap-3 p-4">
              <div class="space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <a href="/word/{item.slug}" class="group min-w-0 flex-1">
                    <div class="flex flex-wrap items-baseline gap-2">
                      <span class="group-hover:text-primary text-xl font-bold tracking-tight transition-colors">
                        {item.headword_text}
                      </span>
                      {#if item.script_tifinagh}
                        <span class="text-primary font-serif text-lg">
                          {item.script_tifinagh}
                        </span>
                      {/if}
                    </div>
                  </a>

                  <div class="flex shrink-0 items-center gap-1.5">
                    {#if item.match_type === 'fuzzy'}
                      <Badge
                        variant="outline"
                        class="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300"
                      >
                        Did you mean?
                      </Badge>
                    {:else if item.match_type === 'root'}
                      <Badge variant="outline" class="border-primary/30 bg-primary/10 text-primary text-[10px]">
                        Root match
                      </Badge>
                    {:else if item.match_type === 'inflected'}
                      <Badge variant="outline" class="text-[10px]">Inflected</Badge>
                    {:else if item.match_type === 'meaning'}
                      <Badge variant="secondary" class="text-[10px]">Meaning</Badge>
                    {/if}
                  </div>
                </div>

                {#if item.match_preview}
                  <p class="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                    {item.match_preview}
                  </p>
                {/if}
              </div>

              <div class="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-xs">
                <div class="flex flex-wrap items-center gap-1.5">
                  {#if item.part_of_speech}
                    <Badge variant="secondary" class="font-serif text-[11px] italic capitalize">
                      {item.part_of_speech}
                    </Badge>
                  {/if}
                  {#if item.root}
                    <button
                      type="button"
                      onclick={() => quickSearch(`root:${item.root}`)}
                      class="border-primary/25 bg-primary/5 text-primary hover:bg-primary/15 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold transition-colors"
                      title="Explore all words sharing root {item.root}"
                    >
                      <GitFork class="h-2.5 w-2.5" />
                      {item.root}
                    </button>
                  {/if}
                </div>

                <a
                  href="/word/{item.slug}"
                  class="text-primary inline-flex items-center gap-1 font-semibold hover:underline"
                >
                  Open entry
                  <ArrowRight class="h-3 w-3" />
                </a>
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    {:else}
      <Card.Root class="border-dashed p-8 text-center">
        <div class="mx-auto max-w-md space-y-3">
          <BookOpen class="text-muted-foreground/60 mx-auto h-8 w-8" />
          <h2 class="text-lg font-bold">
            No {selectedType !== 'all' ? `${selectedType} ` : ''}matches for "{data.query}"
          </h2>
          <p class="text-muted-foreground text-sm">
            {#if selectedType !== 'all' || selectedPos !== 'all'}
              Try resetting your result filter tabs above, or search a different spelling.
            {:else}
              Couldn't find this word yet. You can add it to the Asafu community dictionary!
            {/if}
          </p>
          <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
            {#if selectedType !== 'all' || selectedPos !== 'all'}
              <Button
                variant="outline"
                size="sm"
                onclick={() => {
                  selectedType = 'all';
                  selectedPos = 'all';
                }}
              >
                Show all ({data.results.length})
              </Button>
            {/if}
            <Button size="sm" href="/add?term={encodeURIComponent(data.query)}" class="gap-1.5">
              <Plus class="h-4 w-4" />
              Add "{data.query}" to Dictionary
            </Button>
          </div>
        </div>
      </Card.Root>
    {/if}
  {/if}
</div>
