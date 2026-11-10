<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import * as m from '$lib/paraglide/messages.js';

  // UI Components
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import AudioPlayer from '$lib/components/dictionary/AudioPlayer.svelte';
  import {
    Bookmark,
    ArrowLeft,
    Trash2,
    Layers,
    Search,
    BookOpen,
    ArrowRight,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Shuffle,
    Copy,
    Check
  } from '@lucide/svelte';

  const SAVED_WORDS_KEY = 'awal_saved_words';

  interface SavedWordItem {
    slug: string;
    latin: string | null;
    tifinagh: string | null;
    savedAt?: number;
    // Enriched fields from database
    id?: number;
    arabic?: string | null;
    primaryDefinition?: string;
    audioUrl?: string | null;
    dialectName?: string;
    pos?: string;
  }

  let rawSaved = $state<SavedWordItem[]>([]);
  let searchQuery = $state('');
  let isLoading = $state(true);

  // Flashcard carousel practice state
  let practiceOpen = $state(false);
  let flashcardIdx = $state(0);
  let isCardFlipped = $state(false);
  let isShuffled = $state(false);
  let flashcardList = $state<SavedWordItem[]>([]);

  // Copy feedback state
  let copiedSlug = $state<string | null>(null);

  function copyScript(text: string, slug: string) {
    if (!browser || !text) return;
    navigator.clipboard.writeText(text);
    copiedSlug = slug;
    setTimeout(() => {
      if (copiedSlug === slug) copiedSlug = null;
    }, 1500);
  }

  // Load from localStorage and enrich from Supabase
  $effect(() => {
    if (!browser) return;
    loadSavedWords();
  });

  async function loadSavedWords() {
    isLoading = true;
    try {
      const raw = localStorage.getItem(SAVED_WORDS_KEY);
      const list: SavedWordItem[] = raw ? JSON.parse(raw) : [];
      rawSaved = list;

      if (list.length > 0 && page.data.supabase) {
        const slugs = list.map((item) => item.slug).filter(Boolean);
        const { data: dbWords } = await page.data.supabase
          .from('headwords')
          .select(`
            id,
            slug,
            script_latin,
            script_tifinagh,
            script_arabic,
            definitions (
              id,
              definition_text,
              audio_url,
              attributes,
              vote_score,
              dialects ( name )
            )
          `)
          .in('slug', slugs);

        if (dbWords) {
          const dbMap = new Map(dbWords.map((w: any) => [w.slug, w]));
          rawSaved = list.map((item) => {
            const dbW: any = dbMap.get(item.slug);
            if (!dbW) return item;
            const defs = dbW.definitions ?? [];
            const topDef = defs.sort((a: any, b: any) => (b.vote_score ?? 0) - (a.vote_score ?? 0))[0];
            const attrs = typeof topDef?.attributes === 'string' ? JSON.parse(topDef.attributes) : topDef?.attributes;
            const dialectObj = Array.isArray(topDef?.dialects) ? topDef.dialects[0] : topDef?.dialects;

            return {
              ...item,
              id: dbW.id,
              latin: dbW.script_latin ?? item.latin,
              tifinagh: dbW.script_tifinagh ?? item.tifinagh,
              arabic: dbW.script_arabic,
              primaryDefinition: topDef?.definition_text,
              audioUrl: topDef?.audio_url ?? defs.find((d: any) => d.audio_url)?.audio_url ?? null,
              dialectName: dialectObj?.name,
              pos: attrs?.part_of_speech
            };
          });
        }
      }
    } catch {
      rawSaved = [];
    } finally {
      isLoading = false;
    }
  }

  function removeSavedWord(slug: string) {
    if (!browser) return;
    rawSaved = rawSaved.filter((w) => w.slug !== slug);
    localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(rawSaved));
  }

  function clearAllSaved() {
    if (!browser) return;
    if (confirm('Are you sure you want to clear all saved words?')) {
      rawSaved = [];
      localStorage.removeItem(SAVED_WORDS_KEY);
    }
  }

  let filteredWords = $derived.by(() => {
    if (!searchQuery.trim()) return rawSaved;
    const q = searchQuery.toLowerCase().trim();
    return rawSaved.filter((w) => {
      const matchLatin = w.latin?.toLowerCase().includes(q) ?? false;
      const matchSlug = w.slug.toLowerCase().includes(q);
      const matchTifinagh = w.tifinagh?.toLowerCase().includes(q) ?? false;
      const matchDef = w.primaryDefinition?.toLowerCase().includes(q) ?? false;
      return matchLatin || matchSlug || matchTifinagh || matchDef;
    });
  });

  function startPractice() {
    if (filteredWords.length === 0) return;
    flashcardList = isShuffled ? [...filteredWords].sort(() => Math.random() - 0.5) : [...filteredWords];
    flashcardIdx = 0;
    isCardFlipped = false;
    practiceOpen = true;
  }

  function toggleShuffle() {
    isShuffled = !isShuffled;
    flashcardList = isShuffled ? [...filteredWords].sort(() => Math.random() - 0.5) : [...filteredWords];
    flashcardIdx = 0;
    isCardFlipped = false;
  }

  let activeCard = $derived(flashcardList[flashcardIdx] ?? null);

  function nextCard() {
    if (flashcardIdx < flashcardList.length - 1) {
      flashcardIdx++;
      isCardFlipped = false;
    }
  }

  function prevCard() {
    if (flashcardIdx > 0) {
      flashcardIdx--;
      isCardFlipped = false;
    }
  }
</script>

<div class="container mx-auto max-w-5xl space-y-8 px-4 py-8">
  <!-- Top Breadcrumb & Controls Header -->
  <div class="flex flex-wrap items-center justify-between gap-3">
    <Button
      variant="ghost"
      size="sm"
      href="/"
      class="text-muted-foreground hover:text-foreground -ml-2 gap-1.5 text-xs"
    >
      <ArrowLeft class="h-3.5 w-3.5" />
      {m.word_back_to_dict()}
    </Button>

    {#if rawSaved.length > 0}
      <div class="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 h-8 gap-1.5 text-xs font-semibold"
          onclick={startPractice}
        >
          <Layers class="h-3.5 w-3.5" />
          {m.saved_words_practice_all({ count: filteredWords.length })}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          class="text-muted-foreground hover:text-destructive h-8 gap-1.5 text-xs"
          onclick={clearAllSaved}
        >
          <Trash2 class="h-3.5 w-3.5" />
          {m.saved_words_clear_all()}
        </Button>
      </div>
    {/if}
  </div>

  <!-- Page Title Banner -->
  <div class="border-primary/20 from-primary/5 via-card to-card flex flex-col justify-between gap-4 rounded-2xl border bg-gradient-to-br p-6 shadow-xs sm:flex-row sm:items-center sm:p-8">
    <div class="space-y-1.5">
      <div class="flex items-center gap-2.5">
        <div class="border-primary/20 bg-primary/10 text-primary rounded-xl border p-2">
          <Bookmark class="h-6 w-6 fill-primary/20" />
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {m.saved_words_title()}
        </h1>
      </div>
      <p class="text-muted-foreground text-sm leading-relaxed sm:text-base">
        {m.saved_words_subtitle()}
      </p>
    </div>

    {#if rawSaved.length > 0}
      <div class="bg-background/80 flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-2xs">
        <span class="text-primary font-bold text-base">{rawSaved.length}</span>
        <span class="text-muted-foreground">{m.saved_words_count({ count: rawSaved.length })}</span>
      </div>
    {/if}
  </div>

  <!-- Search Filter -->
  {#if rawSaved.length > 0}
    <div class="relative max-w-md">
      <Search class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        bind:value={searchQuery}
        placeholder={m.saved_words_search_placeholder()}
        class="bg-background pl-9 text-sm"
      />
    </div>
  {/if}

  <!-- Words Grid or Empty State -->
  {#if isLoading}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each [1, 2, 3, 4, 5, 6] as _}
        <div class="bg-muted/30 h-36 animate-pulse rounded-xl border"></div>
      {/each}
    </div>
  {:else if filteredWords.length > 0}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each filteredWords as item (item.slug)}
        <Card.Root class="group border-border hover:border-primary/40 relative flex flex-col justify-between overflow-hidden transition-all hover:shadow-md">
          <Card.Header class="pb-3">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 space-y-1">
                <a
                  href="/word/{item.slug}"
                  class="text-foreground group-hover:text-primary flex items-baseline gap-2 text-xl font-bold tracking-tight transition-colors hover:underline"
                >
                  <span class="truncate">{item.latin ?? item.slug}</span>
                  {#if item.tifinagh}
                    <span class="text-primary font-serif text-lg font-semibold">{item.tifinagh}</span>
                  {/if}
                </a>

                <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {#if item.dialectName}
                    <Badge variant="outline" class="text-[10px]">
                      {item.dialectName}
                    </Badge>
                  {/if}
                  {#if item.pos}
                    <Badge variant="secondary" class="font-serif text-[10px] italic">
                      {item.pos}
                    </Badge>
                  {/if}
                </div>
              </div>

              <!-- Action icons -->
              <div class="flex items-center gap-1">
                {#if item.tifinagh}
                  <button
                    type="button"
                    onclick={() => copyScript(item.tifinagh ?? '', item.slug)}
                    title="Copy Tifinagh"
                    class="text-muted-foreground hover:text-primary rounded-md p-1 transition-colors"
                  >
                    {#if copiedSlug === item.slug}
                      <Check class="h-3.5 w-3.5 text-emerald-500" />
                    {:else}
                      <Copy class="h-3.5 w-3.5" />
                    {/if}
                  </button>
                {/if}
                <button
                  type="button"
                  onclick={() => removeSavedWord(item.slug)}
                  title="Remove from saved words"
                  class="text-muted-foreground hover:text-destructive rounded-md p-1 transition-colors"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </Card.Header>

          <Card.Content class="space-y-3 pb-3">
            {#if item.primaryDefinition}
              <p class="text-muted-foreground font-serif text-sm line-clamp-2 leading-relaxed">
                "{item.primaryDefinition}"
              </p>
            {:else}
              <p class="text-muted-foreground text-xs italic">
                Saved word from dictionary
              </p>
            {/if}

            {#if item.audioUrl}
              <div class="pt-1">
                <AudioPlayer src={item.audioUrl} label="Pronunciation" />
              </div>
            {/if}
          </Card.Content>

          <Card.Footer class="bg-muted/20 border-t px-4 py-2.5">
            <Button
              variant="ghost"
              size="sm"
              href="/word/{item.slug}"
              class="hover:text-primary ml-auto h-7 gap-1 px-2 text-xs font-semibold"
            >
              <span>{m.view_definition()}</span>
              <ArrowRight class="h-3 w-3" />
            </Button>
          </Card.Footer>
        </Card.Root>
      {/each}
    </div>
  {:else}
    <!-- Empty State -->
    <Card.Root class="bg-muted/20 border-dashed py-16 text-center">
      <Card.Content class="space-y-4">
        <div class="border-primary/20 bg-primary/10 text-primary mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border">
          <Bookmark class="h-7 w-7" />
        </div>
        <div class="space-y-1.5">
          <h2 class="text-xl font-bold tracking-tight">
            {m.saved_words_empty_title()}
          </h2>
          <p class="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed">
            {m.saved_words_empty_desc()}
          </p>
        </div>
        <div class="pt-2">
          <Button href="/" class="gap-2">
            <BookOpen class="h-4 w-4" />
            <span>{m.browse_title()}</span>
          </Button>
        </div>
      </Card.Content>
    </Card.Root>
  {/if}
</div>

<!-- Practice All Saved Words Flashcard Dialog -->
<Dialog.Root bind:open={practiceOpen}>
  <Dialog.Content class="sm:max-w-[500px]">
    <Dialog.Header>
      <div class="flex items-center justify-between">
        <Dialog.Title class="flex items-center gap-2">
          <Layers class="text-primary h-4 w-4" />
          <span>{m.word_practice_flashcard()}</span>
        </Dialog.Title>

        <Button
          variant={isShuffled ? 'default' : 'ghost'}
          size="sm"
          class="h-7 gap-1 px-2 text-xs"
          onclick={toggleShuffle}
        >
          <Shuffle class="h-3 w-3" />
          <span>Shuffle</span>
        </Button>
      </div>
    </Dialog.Header>

    {#if activeCard}
      <div class="space-y-4 py-2">
        <div class="text-muted-foreground flex items-center justify-between text-xs font-semibold">
          <span>
            {m.saved_words_card_counter({ current: flashcardIdx + 1, total: flashcardList.length })}
          </span>
          {#if activeCard.dialectName}
            <Badge variant="outline" class="text-[10px]">{activeCard.dialectName}</Badge>
          {/if}
        </div>

        <button
          type="button"
          onclick={() => (isCardFlipped = !isCardFlipped)}
          class="border-primary/25 from-card via-card to-primary/5 hover:border-primary/50 flex min-h-[260px] w-full flex-col items-center justify-between rounded-2xl border-2 bg-gradient-to-br p-6 text-center shadow-md transition-all cursor-pointer"
        >
          <div class="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>{isCardFlipped ? m.word_definition_label() : 'Tamaziɣt'}</span>
            <span class="inline-flex items-center gap-1 text-primary">
              <RotateCcw class="h-3 w-3" /> Flip
            </span>
          </div>

          {#if !isCardFlipped}
            <div class="my-auto space-y-3 py-4">
              <p class="text-4xl font-extrabold tracking-tight">
                {activeCard.latin ?? activeCard.slug}
              </p>
              {#if activeCard.tifinagh}
                <p class="text-primary font-serif text-3xl">
                  {activeCard.tifinagh}
                </p>
              {/if}
              {#if activeCard.arabic}
                <p class="text-muted-foreground text-xl" dir="rtl">
                  {activeCard.arabic}
                </p>
              {/if}
            </div>
            <p class="text-muted-foreground text-xs">
              {m.word_flashcard_front_hint()}
            </p>
          {:else}
            <div class="my-auto w-full space-y-3 py-3 text-left">
              <div class="bg-muted/40 rounded-lg border p-3">
                <p class="font-serif text-base font-medium leading-relaxed">
                  {activeCard.primaryDefinition ?? 'Definition in dictionary'}
                </p>
              </div>

              {#if activeCard.pos}
                <div class="flex items-center gap-1.5">
                  <Badge variant="secondary" class="font-serif italic text-xs">
                    {activeCard.pos}
                  </Badge>
                </div>
              {/if}
            </div>
            <p class="text-muted-foreground text-xs">
              {m.word_flashcard_back_hint()}
            </p>
          {/if}
        </button>

        {#if activeCard.audioUrl}
          <div class="flex items-center justify-center">
            <AudioPlayer src={activeCard.audioUrl} label="Pronunciation" />
          </div>
        {/if}

        <div class="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onclick={prevCard}
            disabled={flashcardIdx === 0}
            class="h-8 gap-1 text-xs"
          >
            <ChevronLeft class="h-3.5 w-3.5" /> Previous
          </Button>

          <Button
            variant="ghost"
            size="sm"
            href="/word/{activeCard.slug}"
            class="text-primary h-8 gap-1 text-xs"
          >
            Full Entry <ArrowRight class="h-3 w-3" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onclick={nextCard}
            disabled={flashcardIdx === flashcardList.length - 1}
            class="h-8 gap-1 text-xs"
          >
            Next <ChevronRight class="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
