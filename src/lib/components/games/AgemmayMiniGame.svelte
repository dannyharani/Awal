<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { AGEMMAY_MINI_PUZZLES, type CrosswordClue } from '$lib/utils/games-data';
  import { latinToTifinagh } from '$lib/utils/amazigh';
  import { CheckCircle2, Eye, RotateCcw, Sparkles } from '@lucide/svelte';

  let puzzleIdx = $state(0);
  let puzzle = $derived(AGEMMAY_MINI_PUZZLES[puzzleIdx]);

  let userGrid = $state<string[][]>(
    Array.from({ length: 5 }, () => Array(5).fill(''))
  );
  let activeRow = $state(0);
  let activeCol = $state(1);
  let direction = $state<'across' | 'down'>('across');
  let checkedMode = $state(false);

  $effect(() => {
    userGrid = Array.from({ length: 5 }, () => Array(5).fill(''));
    // First non-black cell
    activeRow = 0;
    activeCol = puzzle.grid[0].indexOf('#') === 0 ? 1 : 0;
    direction = 'across';
    checkedMode = false;
  });

  function isBlack(r: number, c: number): boolean {
    return puzzle.grid[r]?.[c] === '#';
  }

  let clueNumberMap = $derived.by(() => {
    const map = new Map<string, number>();
    for (const cl of [...puzzle.across, ...puzzle.down]) {
      map.set(`${cl.row},${cl.col}`, cl.num);
    }
    return map;
  });

  let isSolved = $derived.by(() => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (isBlack(r, c)) continue;
        if ((userGrid[r]?.[c] ?? '').toLowerCase() !== puzzle.grid[r][c]) {
          return false;
        }
      }
    }
    return true;
  });

  function selectCell(r: number, c: number) {
    if (isBlack(r, c)) return;
    if (activeRow === r && activeCol === c) {
      direction = direction === 'across' ? 'down' : 'across';
    } else {
      activeRow = r;
      activeCol = c;
    }
  }

  function jumpToClue(cl: CrosswordClue, dir: 'across' | 'down') {
    activeRow = cl.row;
    activeCol = cl.col;
    direction = dir;
  }

  function moveCursor(step: number) {
    let r = activeRow;
    let c = activeCol;
    for (let i = 0; i < 6; i++) {
      if (direction === 'across') c += step;
      else r += step;
      if (r < 0 || r >= 5 || c < 0 || c >= 5) return;
      if (!isBlack(r, c)) {
        activeRow = r;
        activeCol = c;
        return;
      }
    }
  }

  function typeLetter(ch: string) {
    if (isBlack(activeRow, activeCol)) return;
    checkedMode = false;
    userGrid[activeRow][activeCol] = ch.toLowerCase();
    moveCursor(1);
  }

  function clearOrBack() {
    if (isBlack(activeRow, activeCol)) return;
    checkedMode = false;
    if (userGrid[activeRow][activeCol]) {
      userGrid[activeRow][activeCol] = '';
    } else {
      moveCursor(-1);
      userGrid[activeRow][activeCol] = '';
    }
  }

  function revealActiveCell() {
    if (isBlack(activeRow, activeCol)) return;
    userGrid[activeRow][activeCol] = puzzle.grid[activeRow][activeCol];
    moveCursor(1);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      direction = 'across';
      moveCursor(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      direction = 'across';
      moveCursor(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      direction = 'down';
      moveCursor(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      direction = 'down';
      moveCursor(-1);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      clearOrBack();
    } else if (/^[a-z]$/i.test(e.key)) {
      e.preventDefault();
      typeLetter(e.key);
    }
  }

  function isCellInActiveWord(r: number, c: number): boolean {
    if (isBlack(r, c)) return false;
    return direction === 'across' ? r === activeRow : c === activeCol;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="mx-auto grid max-w-3xl gap-6 md:grid-cols-[310px_1fr]">
  <!-- Left: 5x5 Crossword Grid -->
  <div class="flex flex-col items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm">
    <div class="flex w-full items-center justify-between gap-2 border-b pb-3 text-xs">
      <div class="text-left">
        <p class="font-bold text-foreground">{puzzle.title}</p>
        <p class="text-muted-foreground text-[11px]">5x5 Amazigh Mini · Type letters to solve</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        class="h-7 gap-1 px-2 text-xs"
        onclick={() => (puzzleIdx = (puzzleIdx + 1) % AGEMMAY_MINI_PUZZLES.length)}
      >
        <RotateCcw class="h-3.5 w-3.5" />
        Next
      </Button>
    </div>

    <div class="grid grid-cols-5 gap-1.5 rounded-xl bg-muted/50 p-2 border">
      {#each Array(5) as _, r}
        {#each Array(5) as _, c}
          {@const black = isBlack(r, c)}
          {@const num = clueNumberMap.get(`${r},${c}`)}
          {@const val = userGrid[r]?.[c] ?? ''}
          {@const expected = puzzle.grid[r][c]}
          {@const isSelected = activeRow === r && activeCol === c}
          {@const isHighlighted = isCellInActiveWord(r, c)}
          {#if black}
            <div class="bg-foreground/85 h-12 w-12 rounded-md"></div>
          {:else}
            <button
              type="button"
              onclick={() => selectCell(r, c)}
              class="relative flex h-12 w-12 touch-manipulation flex-col items-center justify-center rounded-md border-2 font-mono text-lg font-extrabold uppercase transition-colors {isSelected
                ? 'border-primary bg-primary/15 text-foreground'
                : isHighlighted
                  ? 'border-primary/40 bg-primary/5 text-foreground'
                  : 'border-border bg-background text-foreground'} {checkedMode && val
                ? val === expected
                  ? 'ring-2 ring-emerald-500/60'
                  : 'ring-2 ring-destructive/60 text-destructive'
                : ''}"
            >
              {#if num}
                <span class="text-muted-foreground absolute top-0.5 left-1 text-[9px] font-bold leading-none">
                  {num}
                </span>
              {/if}
              <span class="leading-none">{val || ' '}</span>
              {#if val}
                <span class="text-primary font-serif text-[9px] leading-none opacity-80">
                  {latinToTifinagh(val)}
                </span>
              {/if}
            </button>
          {/if}
        {/each}
      {/each}
    </div>

    {#if isSolved}
      <div class="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 class="mx-auto mb-1 h-5 w-5" />
        Ayuz! Crossword Complete!
      </div>
    {:else}
      <div class="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="outline" size="sm" onclick={() => (checkedMode = !checkedMode)} class="gap-1 text-xs">
          <Sparkles class="h-3.5 w-3.5" />
          {checkedMode ? 'Hide Check' : 'Check Grid'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onclick={revealActiveCell} class="gap-1 text-xs">
          <Eye class="h-3.5 w-3.5" />
          Reveal Letter
        </Button>
      </div>
    {/if}
  </div>

  <!-- Right: Across & Down Clues -->
  <div class="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm text-left sm:grid-cols-2">
    <div class="space-y-2">
      <h3 class="text-xs font-extrabold tracking-wider uppercase text-primary">
        Across →
      </h3>
      <div class="space-y-1.5">
        {#each puzzle.across as cl (cl.word)}
          {@const isActive = direction === 'across' && activeRow === cl.row}
          <button
            type="button"
            onclick={() => jumpToClue(cl, 'across')}
            class="w-full rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors {isActive
              ? 'border-primary bg-primary/10 font-semibold'
              : 'border-transparent hover:bg-muted/60'}"
          >
            <div class="flex items-center justify-between gap-1">
              <span>
                <span class="text-primary mr-1 font-bold">{cl.num}.</span>
                {cl.clue}
              </span>
              {#if isSolved}
                <a
                  href="/word/{cl.slug}"
                  class="text-primary font-serif text-[11px] hover:underline shrink-0"
                  onclick={(e) => e.stopPropagation()}
                >
                  {cl.word} ({cl.tifinagh})
                </a>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    </div>

    <div class="space-y-2">
      <h3 class="text-xs font-extrabold tracking-wider uppercase text-primary">
        Down ↓
      </h3>
      <div class="space-y-1.5">
        {#each puzzle.down as cl (cl.word)}
          {@const isActive = direction === 'down' && activeCol === cl.col}
          <button
            type="button"
            onclick={() => jumpToClue(cl, 'down')}
            class="w-full rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors {isActive
              ? 'border-primary bg-primary/10 font-semibold'
              : 'border-transparent hover:bg-muted/60'}"
          >
            <div class="flex items-center justify-between gap-1">
              <span>
                <span class="text-primary mr-1 font-bold">{cl.num}.</span>
                {cl.clue}
              </span>
              {#if isSolved}
                <a
                  href="/word/{cl.slug}"
                  class="text-primary font-serif text-[11px] hover:underline shrink-0"
                  onclick={(e) => e.stopPropagation()}
                >
                  {cl.word} ({cl.tifinagh})
                </a>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>
