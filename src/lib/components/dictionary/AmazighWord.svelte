<script lang="ts">
  import { page } from '$app/state';
  import {
    lookupAmazighGlossary,
    latinToTifinagh,
    generateWordSlug
  } from '$lib/utils/amazigh';
  import { BookOpen, ArrowUpRight, Sparkles, Plus } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  let {
    word,
    tifinagh,
    slug,
    meaning,
    partOfSpeech,
    dialect,
    notes,
    showTifinaghInline = false,
    class: className = '',
    children
  }: {
    word: string;
    tifinagh?: string;
    slug?: string;
    meaning?: string;
    partOfSpeech?: string;
    dialect?: string;
    notes?: string;
    showTifinaghInline?: boolean;
    class?: string;
    children?: Snippet;
  } = $props();

  let glossary = $derived(lookupAmazighGlossary(word));

  let resolvedLatin = $derived(glossary?.word ?? word);
  let resolvedTifinagh = $derived(tifinagh ?? glossary?.tifinagh ?? latinToTifinagh(word));
  let resolvedSlug = $derived(slug ?? glossary?.slug ?? generateWordSlug(word));
  let resolvedPos = $derived(partOfSpeech ?? glossary?.partOfSpeech ?? 'noun');
  let resolvedMeaning = $derived(
    meaning ?? glossary?.meaning ?? 'Explore or contribute this Tamaziɣt entry in the Awal dictionary.'
  );
  let resolvedDialect = $derived(dialect ?? glossary?.dialect ?? 'Tamaziɣt');
  let resolvedNotes = $derived(notes ?? glossary?.notes ?? '');

  let open = $state(false);
  let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
  let closeTimeout: ReturnType<typeof setTimeout> | null = null;

  let dbChecked = $state(false);
  let dbEntry = $state<{
    slug: string;
    script_latin: string;
    script_tifinagh: string | null;
    definition?: string;
    pos?: string;
    dialectName?: string;
  } | null>(null);

  async function checkLiveDictionary() {
    if (dbChecked) return;
    dbChecked = true;
    const supabase = page.data?.supabase;
    if (!supabase) return;

    try {
      const { data } = await supabase
        .from('headwords')
        .select(
          `
          slug,
          script_latin,
          script_tifinagh,
          definitions (
            definition,
            attributes,
            dialects ( name )
          )
        `
        )
        .or(`slug.eq.${resolvedSlug},script_latin.ilike.${resolvedLatin}`)
        .limit(1)
        .maybeSingle();

      if (data) {
        const firstDef = Array.isArray(data.definitions) ? data.definitions[0] : null;
        const attrs = (firstDef?.attributes as Record<string, string> | null) ?? null;
        const dialectObj = firstDef?.dialects as { name?: string } | null;
        dbEntry = {
          slug: data.slug,
          script_latin: data.script_latin,
          script_tifinagh: data.script_tifinagh,
          definition: firstDef?.definition,
          pos: attrs?.pos,
          dialectName: dialectObj?.name
        };
      }
    } catch {
      // Ignore network errors in tooltip preview
    }
  }

  function handleMouseEnter() {
    if (closeTimeout) clearTimeout(closeTimeout);
    hoverTimeout = setTimeout(() => {
      open = true;
      checkLiveDictionary();
    }, 120);
  }

  function handleMouseLeave() {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    closeTimeout = setTimeout(() => {
      open = false;
    }, 180);
  }

  function handleFocus() {
    if (closeTimeout) clearTimeout(closeTimeout);
    open = true;
    checkLiveDictionary();
  }

  function handleBlur(e: FocusEvent) {
    const related = e.relatedTarget as HTMLElement | null;
    const current = e.currentTarget as HTMLElement | null;
    if (current && related && current.contains(related)) return;
    closeTimeout = setTimeout(() => {
      open = false;
    }, 150);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      open = false;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open = !open;
      if (open) checkLiveDictionary();
    }
  }

  let displayLatin = $derived(dbEntry?.script_latin ?? resolvedLatin);
  let displayTifinagh = $derived(dbEntry?.script_tifinagh || resolvedTifinagh);
  let displayMeaning = $derived(dbEntry?.definition || resolvedMeaning);
  let displayPos = $derived(dbEntry?.pos || resolvedPos);
  let displayDialect = $derived(dbEntry?.dialectName || resolvedDialect);
  let targetSlug = $derived(dbEntry?.slug || resolvedSlug);
</script>

<span
  role="group"
  class="relative inline-block align-baseline"
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  onfocusin={handleFocus}
  onfocusout={handleBlur}
>
  <span
    role="button"
    tabindex="0"
    aria-expanded={open}
    aria-label={`Amazigh word: ${displayLatin} (${displayTifinagh})`}
    onkeydown={handleKeyDown}
    onclick={() => {
      open = !open;
      if (open) checkLiveDictionary();
    }}
    class="decoration-primary/50 hover:decoration-primary hover:bg-primary/10 focus-visible:ring-primary/40 inline-flex cursor-pointer items-baseline gap-1 rounded px-0.5 underline decoration-dotted underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:outline-none {className}"
  >
    {#if children}
      {@render children()}
    {:else}
      <span class="font-medium">{resolvedLatin}</span>
      {#if showTifinaghInline && resolvedTifinagh}
        <span class="text-primary font-serif text-[0.92em]">{resolvedTifinagh}</span>
      {/if}
    {/if}
  </span>

  {#if open}
    <div
      role="tooltip"
      class="bg-popover text-popover-foreground border-border animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-xl border p-3.5 text-left shadow-xl sm:w-80"
    >
      <div class="flex items-start justify-between gap-2 border-b pb-2.5">
        <div>
          <div class="flex flex-wrap items-baseline gap-2">
            <span class="text-foreground text-base font-bold tracking-tight">{displayLatin}</span>
            {#if displayTifinagh}
              <span class="text-primary font-serif text-base font-semibold">{displayTifinagh}</span>
            {/if}
          </div>
          <div class="mt-1 flex flex-wrap items-center gap-1.5">
            {#if displayPos}
              <span class="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[10px] font-semibold italic">
                {displayPos}
              </span>
            {/if}
            {#if displayDialect}
              <span class="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
                {displayDialect}
              </span>
            {/if}
            {#if dbEntry}
              <span class="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Sparkles class="h-2.5 w-2.5" /> Live Entry
              </span>
            {/if}
          </div>
        </div>
      </div>

      <p class="text-foreground/90 mt-2.5 text-xs leading-relaxed font-normal">
        {displayMeaning}
      </p>

      {#if resolvedNotes}
        <p class="text-muted-foreground bg-muted/50 mt-2 rounded-md px-2 py-1.5 text-[11px] leading-snug">
          {resolvedNotes}
        </p>
      {/if}

      <div class="mt-3 flex items-center justify-between gap-2 border-t pt-2.5 text-[11px]">
        <a
          href="/word/{targetSlug}"
          class="text-primary inline-flex items-center gap-1 font-semibold hover:underline"
        >
          <BookOpen class="h-3 w-3" />
          <span>Full definition</span>
          <ArrowUpRight class="h-3 w-3" />
        </a>

        {#if !dbEntry}
          <a
            href="/add?word={encodeURIComponent(displayLatin)}"
            class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <Plus class="h-3 w-3" />
            <span>Add to DB</span>
          </a>
        {/if}
      </div>
    </div>
  {/if}
</span>
