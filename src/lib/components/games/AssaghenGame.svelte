<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import {
    ASSAGHEN_PUZZLES,
    type AssaghenGroup,
    type AssaghenWord
  } from '$lib/utils/games-data';
  import { Shuffle, RotateCcw, CheckCircle2, Sparkles } from '@lucide/svelte';

  let puzzleIdx = $state(0);
  let puzzle = $derived(ASSAGHEN_PUZZLES[puzzleIdx]);

  let solvedGroups = $state<AssaghenGroup[]>([]);
  let remainingTiles = $state<AssaghenWord[]>([]);
  let selectedSlugs = $state<string[]>([]);
  let mistakesLeft = $state(4);
  let notice = $state<string | null>(null);
  let revealedAll = $state(false);

  $effect(() => {
    solvedGroups = [];
    remainingTiles = puzzle.groups.flatMap((g) => g.items).sort(() => Math.random() - 0.5);
    selectedSlugs = [];
    mistakesLeft = 4;
    notice = null;
    revealedAll = false;
  });

  const TIER_CLASSES: Record<1 | 2 | 3 | 4, string> = {
    1: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200',
    2: 'border-sky-500/40 bg-sky-500/15 text-sky-900 dark:text-sky-200',
    3: 'border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-200',
    4: 'border-purple-500/40 bg-purple-500/15 text-purple-900 dark:text-purple-200'
  };

  let isGameOver = $derived(solvedGroups.length === 4 || mistakesLeft <= 0 || revealedAll);

  function showMsg(msg: string) {
    notice = msg;
    setTimeout(() => {
      if (notice === msg) notice = null;
    }, 2000);
  }

  function toggleTile(slug: string) {
    if (isGameOver) return;
    if (selectedSlugs.includes(slug)) {
      selectedSlugs = selectedSlugs.filter((s) => s !== slug);
    } else if (selectedSlugs.length < 4) {
      selectedSlugs = [...selectedSlugs, slug];
    }
  }

  function shuffleRemaining() {
    remainingTiles = [...remainingTiles].sort(() => Math.random() - 0.5);
  }

  function submitSelection() {
    if (selectedSlugs.length !== 4 || isGameOver) return;
    const chosen = new Set(selectedSlugs);

    const unsolvedGroups = puzzle.groups.filter(
      (g) => !solvedGroups.some((sg) => sg.category === g.category)
    );

    const exactMatch = unsolvedGroups.find((g) => g.items.every((item) => chosen.has(item.slug)));
    if (exactMatch) {
      solvedGroups = [...solvedGroups, exactMatch];
      remainingTiles = remainingTiles.filter((t) => !chosen.has(t.slug));
      selectedSlugs = [];
      notice = null;
      return;
    }

    const oneAway = unsolvedGroups.some(
      (g) => g.items.filter((item) => chosen.has(item.slug)).length === 3
    );

    mistakesLeft = Math.max(0, mistakesLeft - 1);
    if (mistakesLeft === 0) {
      revealedAll = true;
      solvedGroups = [...puzzle.groups];
      remainingTiles = [];
      selectedSlugs = [];
      showMsg('Out of attempts — categories revealed!');
    } else {
      showMsg(oneAway ? 'One away! (3/4 matched)' : 'Not a matching group');
    }
  }

  function revealAnswers() {
    revealedAll = true;
    solvedGroups = [...puzzle.groups];
    remainingTiles = [];
    selectedSlugs = [];
  }
</script>

<div class="mx-auto max-w-xl space-y-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
  <div class="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-xs">
    <div class="text-left">
      <p class="font-bold text-foreground">{puzzle.title}</p>
      <p class="text-muted-foreground text-[11px]">Group 16 Amazigh words into 4 hidden themes</p>
    </div>

    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1" title="{mistakesLeft} mistakes remaining">
        <span class="text-muted-foreground mr-1 text-[11px]">Lives:</span>
        {#each Array(4) as _, idx}
          <span
            class="h-2.5 w-2.5 rounded-full {idx < mistakesLeft ? 'bg-primary' : 'bg-muted'}"
          ></span>
        {/each}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        class="h-7 gap-1 px-2 text-xs"
        onclick={() => (puzzleIdx = (puzzleIdx + 1) % ASSAGHEN_PUZZLES.length)}
      >
        <RotateCcw class="h-3.5 w-3.5" />
        Next Board
      </Button>
    </div>
  </div>

  {#if notice}
    <div class="text-center">
      <Badge variant="secondary" class="text-xs font-semibold">{notice}</Badge>
    </div>
  {/if}

  <!-- Solved Groups -->
  {#if solvedGroups.length > 0}
    <div class="space-y-2">
      {#each solvedGroups as group (group.category)}
        <div class="rounded-xl border p-3 text-center {TIER_CLASSES[group.tier]}">
          <p class="text-xs font-extrabold tracking-wider uppercase">{group.category}</p>
          <div class="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
            {#each group.items as item (item.slug)}
              <a
                href="/word/{item.slug}"
                class="bg-background/70 hover:bg-background inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold shadow-2xs transition-colors"
                title={item.meaning}
              >
                <span>{item.word}</span>
                <span class="opacity-70 font-normal">({item.meaning})</span>
              </a>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- 4x4 Unsolved Tiles -->
  {#if remainingTiles.length > 0}
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {#each remainingTiles as tile (tile.slug)}
        {@const isSelected = selectedSlugs.includes(tile.slug)}
        <button
          type="button"
          onclick={() => toggleTile(tile.slug)}
          class="flex min-h-[64px] touch-manipulation flex-col items-center justify-center rounded-xl border-2 px-2 py-2 text-center transition-all active:scale-95 {isSelected
            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
            : 'border-border bg-muted/40 hover:border-primary/40 hover:bg-muted text-foreground'}"
        >
          <span class="text-sm font-bold leading-tight">{tile.word}</span>
          <span
            class="mt-0.5 font-serif text-xs leading-none {isSelected
              ? 'opacity-90'
              : 'text-primary opacity-85'}"
          >
            {tile.tifinagh}
          </span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Bottom Action Bar -->
  {#if !isGameOver}
    <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
      <div class="flex items-center gap-1.5">
        <Button type="button" variant="outline" size="sm" onclick={shuffleRemaining} class="gap-1 text-xs">
          <Shuffle class="h-3.5 w-3.5" /> Shuffle
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onclick={() => (selectedSlugs = [])}
          disabled={selectedSlugs.length === 0}
          class="text-xs"
        >
          Deselect
        </Button>
        <Button type="button" variant="ghost" size="sm" onclick={revealAnswers} class="text-xs text-muted-foreground">
          Reveal
        </Button>
      </div>

      <Button
        type="button"
        size="sm"
        disabled={selectedSlugs.length !== 4}
        onclick={submitSelection}
        class="gap-1.5 text-xs"
      >
        <Sparkles class="h-3.5 w-3.5" />
        Submit ({selectedSlugs.length}/4)
      </Button>
    </div>
  {:else}
    <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 p-3 text-xs">
      <span class="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 class="h-4 w-4" />
        {mistakesLeft > 0 && !revealedAll ? 'Ayuz! All 4 groups solved!' : 'Board Complete'}
      </span>
      <Button
        type="button"
        size="sm"
        onclick={() => (puzzleIdx = (puzzleIdx + 1) % ASSAGHEN_PUZZLES.length)}
        class="text-xs"
      >
        Play Next Board
      </Button>
    </div>
  {/if}
</div>
