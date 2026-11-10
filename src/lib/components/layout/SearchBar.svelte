<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Search, Loader } from '@lucide/svelte';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import * as Command from '../ui/command';
  import * as m from '$lib/paraglide/messages.js';

  let { supabase } = $derived(page.data);

  type SearchResult = {
    id: number;
    slug: string;
    headword_text: string;
    script_tifinagh?: string | null;
    match_type?: string | null;
    match_preview?: string | null;
  };

  let open = $state(false);
  let query = $state('');
  let results = $state<SearchResult[]>([]);
  let loading = $state(false);
  let timer: ReturnType<typeof setTimeout>;

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
    timer = setTimeout(async () => {
      await performSearch();
      loading = false;
    }, 250);
  }

  async function performSearch() {
    const { data, error } = await supabase.rpc('search_dictionary', {
      term: query.trim()
    });
    if (!error && data) {
      results = data;
    }
  }

  function selectResult(slug: string) {
    query = '';
    open = false;
    goto(`/word/${slug}`);
  }
</script>

<div class="relative w-full max-w-md">
  <div class="relative">
    <Search class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
    <Input
      type="search"
      placeholder={m.search_placeholder()}
      class="pl-9 text-sm"
      bind:value={query}
      oninput={handleInput}
      onfocus={() => (open = true)}
      onblur={() => setTimeout(() => (open = false), 200)}
    />
    {#if loading}
      <Loader class="text-muted-foreground absolute top-2.5 right-8 h-4 w-4 animate-spin" />
    {/if}
  </div>

  {#if open && (results.length > 0 || (query.trim().length > 1 && !loading))}
    <div
      class="bg-popover text-popover-foreground fixed inset-x-3 top-14 z-50 overflow-hidden rounded-xl border shadow-xl sm:absolute sm:inset-x-0 sm:top-full sm:mt-1 sm:w-full sm:min-w-[320px]"
    >
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
                  <div class="flex items-center gap-2">
                    <span class="text-foreground font-bold">{result.headword_text}</span>
                    {#if result.script_tifinagh}
                      <span class="text-primary/80 font-serif text-sm">
                        {result.script_tifinagh}
                      </span>
                    {/if}
                  </div>

                  {#if result.match_type === 'inflected'}
                    <Badge variant="outline" class="h-4 px-1.5 text-[9px] uppercase">
                      Inflected
                    </Badge>
                  {:else if result.match_type === 'meaning'}
                    <Badge variant="secondary" class="h-4 px-1.5 text-[9px] uppercase">
                      Meaning
                    </Badge>
                  {/if}
                </div>

                {#if result.match_preview}
                  <p class="text-muted-foreground line-clamp-1 w-full text-xs">
                    {result.match_preview}
                  </p>
                {/if}
              </Command.Item>
            {/each}
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
