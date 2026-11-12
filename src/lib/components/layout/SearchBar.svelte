<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Search, Loader, Sparkles, ArrowRight } from '@lucide/svelte';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import * as Command from '../ui/command';
  import * as m from '$lib/paraglide/messages.js';
  import {
    searchDictionary,
    getQueryTifinaghPreview,
    parseRootQuery,
    type DictionarySearchResult
  } from '$lib/utils/search';

  let { supabase } = $derived(page.data);

  let open = $state(false);
  let query = $state('');
  let results = $state<DictionarySearchResult[]>([]);
  let loading = $state(false);
  let timer: ReturnType<typeof setTimeout>;
  let searchSeq = 0;

  let tifPreview = $derived(getQueryTifinaghPreview(query));
  let rootPreview = $derived(parseRootQuery(query));

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    query = target.value;
    open = true;

    clearTimeout(timer);

    if (!query || query.trim().length < 2) {
      results = [];
      loading = false;
      return;
    }

    loading = true;
    const seq = ++searchSeq;
    timer = setTimeout(async () => {
      await performSearch(seq);
    }, 220);
  }

  async function performSearch(seq: number) {
    const res = await searchDictionary(supabase, query, 10);
    if (seq !== searchSeq) return;
    results = res.results;
    loading = false;
  }

  function selectResult(slug: string) {
    query = '';
    open = false;
    goto(`/word/${slug}`);
  }

  function submitFullSearch() {
    const q = query.trim();
    if (!q) return;
    open = false;
    goto(`/search?q=${encodeURIComponent(q)}`);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && query.trim().length >= 1) {
      e.preventDefault();
      submitFullSearch();
    } else if (e.key === 'Escape') {
      open = false;
    }
  }
</script>

<div class="relative w-full max-w-md">
  <div class="relative">
    <Search class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
    <Input
      type="search"
      placeholder={m.search_placeholder()}
      class="pr-8 pl-9 text-sm"
      bind:value={query}
      oninput={handleInput}
      onkeydown={handleKeydown}
      onfocus={() => (open = true)}
      onblur={() => setTimeout(() => (open = false), 220)}
    />
    {#if loading}
      <Loader class="text-muted-foreground absolute top-2.5 right-2.5 h-4 w-4 animate-spin" />
    {/if}
  </div>

  {#if open && (results.length > 0 || (query.trim().length > 1 && !loading) || rootPreview)}
    <div
      class="bg-popover text-popover-foreground fixed inset-x-3 top-14 z-50 overflow-hidden rounded-xl border shadow-xl sm:absolute sm:inset-x-0 sm:top-full sm:mt-1 sm:w-full sm:min-w-[360px]"
    >
      {#if tifPreview || rootPreview}
        <div
          class="bg-muted/40 text-muted-foreground flex items-center justify-between border-b px-3.5 py-1.5 text-[11px]"
        >
          {#if rootPreview}
            <span class="flex items-center gap-1.5 font-medium">
              <Sparkles class="text-primary h-3 w-3" />
              Searching root family <strong class="text-primary font-mono">{rootPreview}</strong>
            </span>
          {:else if tifPreview}
            <span class="flex items-center gap-1.5">
              <span>Tifinagh:</span>
              <strong class="text-primary font-serif text-sm">{tifPreview}</strong>
            </span>
          {/if}
          <span class="hidden text-[10px] opacity-75 sm:inline">Enter for full view</span>
        </div>
      {/if}

      <Command.Root shouldFilter={false}>
        <Command.List class="max-h-80 overflow-y-auto">
          {#if results.length > 0}
            {#each results as result (result.id)}
              <Command.Item
                value={result.slug}
                class="hover:bg-muted/60 flex cursor-pointer flex-col items-start gap-1 px-3.5 py-2.5"
                onSelect={() => selectResult(result.slug)}
              >
                <div class="flex w-full items-center justify-between gap-2">
                  <div class="flex min-w-0 items-center gap-2">
                    <span class="text-foreground truncate font-bold">{result.headword_text}</span>
                    {#if result.script_tifinagh}
                      <span class="text-primary/85 shrink-0 font-serif text-sm">
                        {result.script_tifinagh}
                      </span>
                    {/if}
                    {#if result.part_of_speech}
                      <span class="text-muted-foreground hidden font-serif text-[11px] italic sm:inline">
                        {result.part_of_speech}
                      </span>
                    {/if}
                  </div>

                  <div class="flex shrink-0 items-center gap-1">
                    {#if result.match_type === 'fuzzy'}
                      <Badge
                        variant="outline"
                        class="h-4 border-amber-500/40 bg-amber-500/10 px-1.5 text-[9px] font-semibold text-amber-700 uppercase dark:text-amber-300"
                      >
                        Did you mean?
                      </Badge>
                    {:else if result.match_type === 'root'}
                      <Badge variant="outline" class="border-primary/40 bg-primary/10 text-primary h-4 px-1.5 font-mono text-[9px] uppercase">
                        Root {result.root ?? ''}
                      </Badge>
                    {:else if result.match_type === 'inflected'}
                      <Badge variant="outline" class="h-4 px-1.5 text-[9px] uppercase">
                        Inflected
                      </Badge>
                    {:else if result.match_type === 'meaning'}
                      <Badge variant="secondary" class="h-4 px-1.5 text-[9px] uppercase">
                        Meaning
                      </Badge>
                    {/if}
                  </div>
                </div>

                {#if result.match_preview}
                  <p class="text-muted-foreground line-clamp-1 w-full text-xs">
                    {result.match_preview}
                  </p>
                {/if}
              </Command.Item>
            {/each}

            <div class="border-t bg-muted/20 p-1.5">
              <button
                type="button"
                onmousedown={(e) => {
                  e.preventDefault();
                  submitFullSearch();
                }}
                class="text-primary hover:bg-muted flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors"
              >
                <span>Explore all results & filters for "{query.trim()}"</span>
                <ArrowRight class="h-3.5 w-3.5" />
              </button>
            </div>
          {:else if query.trim().length > 1 && !loading}
            <Command.Item
              value="__create_new__"
              class="hover:bg-muted/50 cursor-pointer px-4 py-3"
              onSelect={() => {
                const term = query.trim();
                query = '';
                open = false;
                goto(`/add?term=${encodeURIComponent(term)}`);
              }}
            >
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium">No results found for "{query.trim()}".</span>
                <span class="text-primary text-xs font-bold">
                  + Add "{query.trim()}" to the dictionary
                </span>
              </div>
            </Command.Item>
          {/if}
        </Command.List>
      </Command.Root>
    </div>
  {/if}
</div>
