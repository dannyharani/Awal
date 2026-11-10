<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Search, Loader } from '@lucide/svelte';
  import { Input } from '$lib/components/ui/input';
  import * as Command from '../ui/command';

  // Access Supabase from the layout data
  let { supabase } = $derived(page.data);

  type SearchResult = {
    id: number;
    slug: string; // We need this for the URL
    headword_text: string; // This is the Latin text
  };

  let open = $state(false);
  let query = $state('');
  let results = $state<SearchResult[]>([]);
  let loading = $state(false);
  let timer: NodeJS.Timeout;

  // 1. Handle Typing with "Debounce"
  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    query = target.value;
    open = true;

    clearTimeout(timer);

    // Don't search for single letters
    if (!query || query.length < 2) {
      results = [];
      return;
    }

    loading = true;
    // Wait 300ms. If user types again, this timer resets.
    timer = setTimeout(async () => {
      await performSearch();
      loading = false;
    }, 300);
  }

  // 2. The Actual Search
  async function performSearch() {
    const { data, error } = await supabase.rpc('search_dictionary', {
      term: query
    });
    console.log(data, error);
    if (!error && data) {
      results = data;
    }
  }

  // 3. Navigation
  function selectResult(slug: string) {
    query = '';
    open = false;
    goto(`/word/${slug}`); // Navigation uses the slug
  }
</script>

<div class="relative w-full max-w-sm">
  <div class="relative">
    <Search class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
    <Input
      type="search"
      placeholder="Search dictionary..."
      class="pl-9"
      bind:value={query}
      oninput={handleInput}
      onfocus={() => (open = true)}
      onblur={() => setTimeout(() => (open = false), 200)}
    />
    {#if loading}
      <Loader class="text-muted-foreground absolute top-2.5 right-8 h-4 w-4 animate-spin" />
    {/if}
  </div>

  {#if open}
    <div
      class="bg-popover text-popover-foreground absolute top-full z-50 mt-1 w-full overflow-hidden rounded-md border shadow-md"
    >
      <Command.Root>
        <Command.List>
          {#if results.length > 0}
            {#each results as result}
              <Command.Item
                class="hover:bg-muted/50 cursor-pointer px-4 py-2"
                onSelect={() => selectResult(result.slug)}
              >
                <span class="font-bold">{result.headword_text}</span>
              </Command.Item>
            {/each}
          {:else if query.length > 1 && !loading}
            <Command.Item
              class="hover:bg-muted/50 cursor-pointer px-4 py-3"
              onSelect={() => {
                open = false;
                // Pre-fill the form using a query param
                // Inside the onSelect handler
                goto(`/add?term=${encodeURIComponent(query)}`);
              }}
            >
              <div class="flex flex-col">
                <span class="text-sm font-medium">No results found.</span>
                <span class="text-primary text-xs font-bold">
                  + Create "{query}"
                </span>
              </div>
            </Command.Item>
          {/if}
        </Command.List>
      </Command.Root>
    </div>
  {/if}
</div>
