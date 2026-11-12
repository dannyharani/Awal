<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { ANAGAM_PUZZLES, type AnagamWordEntry } from '$lib/utils/games-data';
  import { latinToTifinagh } from '$lib/utils/amazigh';
  import { Shuffle, Delete, CornerDownLeft, Sparkles, BookOpen, RotateCcw } from '@lucide/svelte';

  let puzzleIdx = $state(0);
  let puzzle = $derived(ANAGAM_PUZZLES[puzzleIdx]);
  let outerOrder = $state<string[]>([]);
  let currentInput = $state('');
  let foundWords = $state<AnagamWordEntry[]>([]);
  let message = $state<{ text: string; tone: 'ok' | 'err' | 'pangram' } | null>(null);
  let isChecking = $state(false);

  $effect(() => {
    outerOrder = [...puzzle.outer];
    currentInput = '';
    foundWords = [];
    message = null;
  });

  let allowedSet = $derived(new Set([puzzle.center, ...puzzle.outer]));
  let seedMap = $derived(new Map(puzzle.seedWords.map((w) => [w.word, w])));

  function isPangram(word: string): boolean {
    const uniq = new Set(word);
    for (const ch of allowedSet) {
      if (!uniq.has(ch)) return false;
    }
    return true;
  }

  let score = $derived(
    foundWords.reduce((sum, entry) => {
      const base = entry.word.length === 4 ? 1 : entry.word.length;
      return sum + base + (isPangram(entry.word) ? 7 : 0);
    }, 0)
  );

  let rankLabel = $derived.by(() => {
    if (score >= 45) return 'Amusnaw (Master)';
    if (score >= 25) return 'Amezday (Connector)';
    if (score >= 12) return 'Ameslay (Speaker)';
    if (score >= 4) return 'Anelmad (Learner)';
    return 'Aferdis (Starter)';
  });

  function showNotice(text: string, tone: 'ok' | 'err' | 'pangram') {
    message = { text, tone };
    setTimeout(() => {
      if (message?.text === text) message = null;
    }, 2200);
  }

  function shuffleOuter() {
    outerOrder = [...outerOrder].sort(() => Math.random() - 0.5);
  }

  function addLetter(ch: string) {
    if (currentInput.length >= 12) return;
    currentInput = `${currentInput}${ch.toLowerCase()}`;
  }

  function backspace() {
    currentInput = currentInput.slice(0, -1);
  }

  async function submitWord() {
    const word = currentInput.trim().toLowerCase();
    currentInput = '';
    if (!word) return;
    if (word.length < 4) {
      showNotice('Words must be at least 4 letters', 'err');
      return;
    }
    if (!word.includes(puzzle.center)) {
      showNotice(`Must contain center letter "${puzzle.center.toUpperCase()}"`, 'err');
      return;
    }
    for (const ch of word) {
      if (!allowedSet.has(ch)) {
        showNotice(`Letter "${ch.toUpperCase()}" is not in this wheel`, 'err');
        return;
      }
    }
    if (foundWords.some((f) => f.word === word)) {
      showNotice('Already found!', 'err');
      return;
    }

    let matched: AnagamWordEntry | null = seedMap.get(word) ?? null;

    if (!matched) {
      isChecking = true;
      try {
        const res = await fetch(`/api/games/anagam-check?word=${encodeURIComponent(word)}`);
        if (res.ok) {
          const payload = await res.json();
          if (payload.valid) {
            matched = {
              word: payload.word,
              slug: payload.slug,
              tifinagh: payload.tifinagh || latinToTifinagh(payload.word),
              meaning: payload.meaning
            };
          }
        }
      } catch {
        // Offline: stick with seed list only
      } finally {
        isChecking = false;
      }
    }

    if (!matched) {
      showNotice('Not found in Asafu dictionary', 'err');
      return;
    }

    foundWords = [matched, ...foundWords];
    const pts = (word.length === 4 ? 1 : word.length) + (isPangram(word) ? 7 : 0);
    if (isPangram(word)) {
      showNotice(`Pangram! +${pts} pts`, 'pangram');
    } else {
      showNotice(`Ayuz! +${pts} ${pts === 1 ? 'pt' : 'pts'}`, 'ok');
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      backspace();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submitWord();
    } else if (/^[a-z]$/i.test(e.key) && allowedSet.has(e.key.toLowerCase())) {
      addLetter(e.key);
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="mx-auto grid max-w-2xl gap-6 md:grid-cols-[1fr_260px]">
  <!-- Left: Interactive Honeycomb Wheel -->
  <div class="flex flex-col items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm">
    <div class="flex w-full items-center justify-between gap-2 border-b pb-3 text-xs">
      <div>
        <p class="font-bold text-foreground">{puzzle.title}</p>
        <p class="text-muted-foreground text-[11px]">
          4+ letters · Must use center <span class="text-primary font-bold uppercase">{puzzle.center}</span>
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        class="h-7 gap-1 px-2 text-xs"
        onclick={() => (puzzleIdx = (puzzleIdx + 1) % ANAGAM_PUZZLES.length)}
      >
        <RotateCcw class="h-3.5 w-3.5" />
        Next Wheel
      </Button>
    </div>

    <!-- Live Input & Tifinagh Preview -->
    <div class="flex min-h-[54px] flex-col items-center justify-center text-center">
      {#if message}
        <Badge
          variant={message.tone === 'err' ? 'destructive' : 'default'}
          class="mb-1 text-xs {message.tone === 'pangram' ? 'bg-amber-500 text-white' : ''}"
        >
          {message.text}
        </Badge>
      {/if}
      <div class="flex items-baseline gap-2">
        <span class="min-h-[32px] font-mono text-2xl font-extrabold tracking-widest uppercase">
          {#if currentInput}
            {#each currentInput.split('') as ch}
              <span class={ch === puzzle.center ? 'text-primary' : 'text-foreground'}>{ch}</span>
            {/each}
          {:else}
            <span class="text-muted-foreground/40 text-base font-normal tracking-normal normal-case">
              Type or tap letters...
            </span>
          {/if}
        </span>
        {#if currentInput}
          <span class="text-primary font-serif text-lg">{latinToTifinagh(currentInput)}</span>
        {/if}
      </div>
    </div>

    <!-- 7-Letter Ring Wheel -->
    <div class="relative flex h-56 w-56 items-center justify-center select-none">
      <!-- Center Root Letter -->
      <button
        type="button"
        onclick={() => addLetter(puzzle.center)}
        class="bg-primary text-primary-foreground hover:bg-primary/90 z-10 flex h-16 w-16 touch-manipulation flex-col items-center justify-center rounded-full border-2 border-primary font-mono text-xl font-black uppercase shadow-md transition-transform active:scale-90"
      >
        <span>{puzzle.center}</span>
        <span class="font-serif text-[11px] leading-none opacity-85">
          {latinToTifinagh(puzzle.center)}
        </span>
      </button>

      <!-- 6 Outer Letters -->
      {#each outerOrder as letter, idx}
        {@const angle = ((idx * 60 - 90) * Math.PI) / 180}
        {@const x = Math.round(Math.cos(angle) * 76)}
        {@const y = Math.round(Math.sin(angle) * 76)}
        <button
          type="button"
          onclick={() => addLetter(letter)}
          style="transform: translate({x}px, {y}px);"
          class="bg-muted/80 hover:bg-muted text-foreground hover:border-primary/50 absolute flex h-14 w-14 touch-manipulation flex-col items-center justify-center rounded-full border font-mono text-lg font-bold uppercase shadow-xs transition-all active:scale-90"
        >
          <span>{letter}</span>
          <span class="text-primary font-serif text-[10px] leading-none">
            {latinToTifinagh(letter)}
          </span>
        </button>
      {/each}
    </div>

    <!-- Controls -->
    <div class="flex items-center gap-2 pt-1">
      <Button type="button" variant="outline" size="sm" onclick={backspace} class="gap-1">
        <Delete class="h-3.5 w-3.5" /> Delete
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onclick={shuffleOuter}
        title="Shuffle outer letters"
      >
        <Shuffle class="h-4 w-4" />
      </Button>
      <Button type="button" size="sm" onclick={submitWord} disabled={isChecking} class="gap-1">
        <CornerDownLeft class="h-3.5 w-3.5" />
        {isChecking ? 'Checking...' : 'Enter'}
      </Button>
    </div>
  </div>

  <!-- Right: Score & Found Words -->
  <div class="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm text-left">
    <div class="flex items-center justify-between border-b pb-2.5">
      <div>
        <p class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Rank</p>
        <p class="text-sm font-bold text-primary">{rankLabel}</p>
      </div>
      <div class="text-right">
        <p class="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">Score</p>
        <p class="text-xl font-extrabold">{score}</p>
      </div>
    </div>

    <div class="flex items-center justify-between text-xs text-muted-foreground">
      <span>Found ({foundWords.length})</span>
      <span class="inline-flex items-center gap-1 text-[11px]">
        <Sparkles class="h-3 w-3 text-amber-500" /> Full DB validated
      </span>
    </div>

    {#if foundWords.length === 0}
      <div class="text-muted-foreground flex flex-1 flex-col items-center justify-center py-8 text-center text-xs">
        <BookOpen class="mb-2 h-6 w-6 opacity-40" />
        Try common roots like <span class="font-mono font-semibold text-foreground">{puzzle.seedWords[0]?.word}</span>!
      </div>
    {:else}
      <div class="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
        {#each foundWords as item (item.word)}
          <a
            href="/word/{item.slug}"
            class="bg-muted/40 hover:border-primary/40 flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors"
          >
            <div class="min-w-0">
              <span class="font-bold uppercase">{item.word}</span>
              <span class="text-primary font-serif ml-1.5">{item.tifinagh}</span>
              <p class="text-muted-foreground truncate text-[11px]">{item.meaning}</p>
            </div>
            {#if isPangram(item.word)}
              <Badge class="bg-amber-500 text-[9px] text-white">Pangram</Badge>
            {/if}
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>
