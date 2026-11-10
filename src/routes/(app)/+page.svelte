<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import {
    ArrowRight,
    Sparkles,
    Clock,
    Compass,
    HandHeart,
    Globe,
    X
  } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { ALPHABET_LATIN } from '$lib/utils/amazigh';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();
  const {
    wordOfTheDay,
    recentWords,
    stats,
    dialects,
    browsedWords,
    wordsNeedingHelp,
    activeLetter,
    activeDialect
  } = $derived(data);

  let isFiltering = $derived(Boolean(activeLetter || activeDialect));
</script>

<div class="container mx-auto space-y-12 py-10">
  <section class="mx-auto max-w-2xl space-y-6 text-center">
    <h1 class="text-4xl font-extrabold tracking-tight lg:text-5xl">
      {m.hero_title_prefix()}
      <span class="text-primary">{m.hero_title_highlight()}</span>
      {m.hero_title_suffix()}
    </h1>
    <p class="text-muted-foreground text-xl">
      {m.hero_subtitle()}
    </p>

    <div class="flex items-center justify-center gap-4 pt-2">
      <div class="bg-muted/30 flex min-w-[110px] flex-col items-center rounded-lg border p-3">
        <span class="text-2xl font-bold">{stats.total_words}</span>
        <span class="text-muted-foreground text-xs tracking-wider uppercase">{m.stats_words()}</span>
      </div>
      <div class="bg-muted/30 flex min-w-[110px] flex-col items-center rounded-lg border p-3">
        <span class="text-2xl font-bold">{stats.total_definitions}</span>
        <span class="text-muted-foreground text-xs tracking-wider uppercase">{m.stats_definitions()}</span>
      </div>
      <div class="bg-muted/30 flex min-w-[110px] flex-col items-center rounded-lg border p-3">
        <span class="text-2xl font-bold">{dialects.length}</span>
        <span class="text-muted-foreground text-xs tracking-wider uppercase">{m.stats_dialects()}</span>
      </div>
    </div>

    <div class="flex justify-center gap-4 pt-2">
      <Button size="lg" href="/add">{m.cta_contribute_word()}</Button>
      <Button variant="outline" size="lg" href="/courses">{m.cta_explore_courses()}</Button>
    </div>
  </section>

  <!-- Browse by Alphabet & Dialect -->
  <section class="bg-muted/20 space-y-5 rounded-xl border p-6">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <Compass class="text-primary h-5 w-5" />
        <h2 class="text-xl font-bold">{m.browse_title()}</h2>
      </div>
      {#if isFiltering}
        <Button variant="ghost" size="sm" href="/" class="h-7 gap-1 text-xs">
          <X class="h-3.5 w-3.5" />
          {m.clear_filters()}
        </Button>
      {/if}
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
        <h3 class="text-muted-foreground mb-3 text-xs font-bold tracking-wider uppercase">
          Matching Words ({browsedWords.length})
        </h3>
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
                class="bg-background hover:border-primary/50 flex items-center justify-between rounded-lg border p-3.5 transition-all hover:shadow-sm"
              >
                <div>
                  <p class="text-foreground font-bold">{word.script_latin}</p>
                  {#if word.definitions?.[0]?.definition_text}
                    <p class="text-muted-foreground line-clamp-1 text-xs">
                      {word.definitions[0].definition_text}
                    </p>
                  {:else}
                    <p class="text-muted-foreground/60 text-xs italic">{m.needs_definition()}</p>
                  {/if}
                </div>
                {#if word.script_tifinagh}
                  <Badge variant="secondary" class="font-serif text-sm">
                    {word.script_tifinagh}
                  </Badge>
                {/if}
              </a>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </section>

  {#if wordOfTheDay}
    <section>
      <div class="mb-4 flex items-center gap-2">
        <Sparkles class="h-5 w-5 text-yellow-500" />
        <h2 class="text-2xl font-bold">{m.word_of_the_day()}</h2>
      </div>

      <Card.Root class="from-primary/5 to-background border-primary/20 bg-gradient-to-br">
        <Card.Content
          class="flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center"
        >
          <div class="space-y-2">
            <h3 class="text-primary text-4xl font-bold">{wordOfTheDay.script_latin}</h3>
            {#if wordOfTheDay.script_tifinagh}
              <p class="font-tifinagh text-muted-foreground text-2xl">
                {wordOfTheDay.script_tifinagh}
              </p>
            {/if}
          </div>
          <Button href="/word/{wordOfTheDay.slug}" class="group">
            {m.view_definition()}
            <ArrowRight class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Card.Content>
      </Card.Root>
    </section>
  {/if}

  <section>
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Clock class="text-muted-foreground h-5 w-5" />
        <h2 class="text-2xl font-bold">{m.recently_added()}</h2>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each recentWords as word}
        <a href="/word/{word.slug}" class="group block">
          <Card.Root class="hover:border-primary/50 h-full transition-all hover:shadow-md">
            <Card.Header>
              <Card.Title class="flex items-center justify-between">
                <span class="group-hover:text-primary transition-colors">{word.script_latin}</span>
                {#if word.script_tifinagh}
                  <Badge variant="secondary" class="font-tifinagh text-xs font-normal">
                    {word.script_tifinagh}
                  </Badge>
                {/if}
              </Card.Title>
              <Card.Description class="flex items-center justify-between pt-2 text-xs">
                <span>{new Date(word.created_at).toLocaleDateString()}</span>
                <span>{word.definitions?.[0]?.count ?? 0} {m.stats_definitions().toLowerCase()}</span>
              </Card.Description>
            </Card.Header>
          </Card.Root>
        </a>
      {/each}
    </div>
  </section>

  {#if wordsNeedingHelp.length > 0}
    <section>
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <HandHeart class="text-primary h-5 w-5" />
          <h2 class="text-2xl font-bold">{m.help_complete_title()}</h2>
        </div>
      </div>
      <p class="text-muted-foreground mb-5 text-sm">
        {m.help_complete_subtitle()}
      </p>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {#each wordsNeedingHelp as word (word.id)}
          <a
            href="/word/{word.slug}"
            class="bg-card hover:border-primary/50 flex items-center justify-between rounded-lg border p-4 transition-all hover:shadow-sm"
          >
            <div class="space-y-1">
              <p class="font-bold">{word.script_latin}</p>
              <div class="flex flex-wrap gap-1.5">
                {#if !word.definitions || word.definitions.length === 0}
                  <Badge variant="outline" class="border-amber-500/40 text-[10px] text-amber-600">
                    {m.needs_definition()}
                  </Badge>
                {/if}
                {#if !word.script_tifinagh}
                  <Badge variant="outline" class="border-blue-500/40 text-[10px] text-blue-600">
                    {m.needs_tifinagh()}
                  </Badge>
                {/if}
              </div>
            </div>
            <ArrowRight class="text-muted-foreground h-4 w-4" />
          </a>
        {/each}
      </div>
    </section>
  {/if}
</div>
