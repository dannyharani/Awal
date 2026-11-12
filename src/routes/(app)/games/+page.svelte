<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as m from '$lib/paraglide/messages.js';
  import AmazighWord from '$lib/components/dictionary/AmazighWord.svelte';
  import { latinToTifinagh } from '$lib/utils/amazigh';
  import {
    Sparkles,
    Flame,
    Trophy,
    BookOpen,
    ArrowRight,
    CheckCircle2,
    RotateCcw,
    Delete,
    CornerDownLeft,
    Lightbulb,
    HelpCircle
  } from '@lucide/svelte';
  import AnagamGame from '$lib/components/games/AnagamGame.svelte';
  import AssaghenGame from '$lib/components/games/AssaghenGame.svelte';
  import AgemmayMiniGame from '$lib/components/games/AgemmayMiniGame.svelte';

  let { data } = $props();

  type GameTab = 'tawalt' | 'anagam' | 'assaghen' | 'agemmay';
  let activeGame = $state<GameTab>('tawalt');

  function selectGame(id: GameTab) {
    activeGame = id;
    if (typeof document !== 'undefined') {
      document.getElementById('uraren-playground')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  let pool = $derived(data.tawaltPool ?? []);
  let poolIndex = $state(0);
  let targetEntry = $derived(
    pool[poolIndex] ?? {
      word: 'adrar',
      slug: 'adrar',
      tifinagh: 'ⴰⴷⵔⴰⵔ',
      meaning: 'Mountain',
      dialect: 'General Amazigh'
    }
  );
  let targetWord = $derived(targetEntry.word.toLowerCase());

  const MAX_ROWS = 6;
  const WORD_LEN = 5;
  const KEYBOARD_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['ENTER', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'BACK']
  ];

  type LetterState = 'correct' | 'present' | 'absent' | 'empty';

  let guesses = $state<string[]>([]);
  let currentGuess = $state('');
  let showHint = $state(false);
  let statusNotice = $state<string | null>(null);

  let hasWon = $derived(guesses.some((g) => g === targetWord));
  let hasLost = $derived(!hasWon && guesses.length >= MAX_ROWS);
  let isFinished = $derived(hasWon || hasLost);

  function evaluateGuess(guess: string, target: string): LetterState[] {
    const result: LetterState[] = Array(WORD_LEN).fill('absent');
    const counts: Record<string, number> = {};

    for (let i = 0; i < WORD_LEN; i++) {
      if (guess[i] === target[i]) {
        result[i] = 'correct';
      } else {
        const ch = target[i];
        counts[ch] = (counts[ch] ?? 0) + 1;
      }
    }

    for (let i = 0; i < WORD_LEN; i++) {
      if (result[i] === 'correct') continue;
      const ch = guess[i];
      if ((counts[ch] ?? 0) > 0) {
        result[i] = 'present';
        counts[ch] -= 1;
      }
    }
    return result;
  }

  let keyStatuses = $derived.by(() => {
    const map: Record<string, LetterState> = {};
    const rank: Record<LetterState, number> = {
      empty: 0,
      absent: 1,
      present: 2,
      correct: 3
    };
    for (const guess of guesses) {
      const states = evaluateGuess(guess, targetWord);
      for (let i = 0; i < WORD_LEN; i++) {
        const ch = guess[i];
        const nextState = states[i];
        if (!map[ch] || rank[nextState] > rank[map[ch]]) {
          map[ch] = nextState;
        }
      }
    }
    return map;
  });

  function pushNotice(msg: string) {
    statusNotice = msg;
    setTimeout(() => {
      if (statusNotice === msg) statusNotice = null;
    }, 1800);
  }

  function pressKey(key: string) {
    if (isFinished) return;
    if (key === 'BACK' || key === 'Backspace') {
      currentGuess = currentGuess.slice(0, -1);
      return;
    }
    if (key === 'ENTER' || key === 'Enter') {
      if (currentGuess.length < WORD_LEN) {
        pushNotice('Enter all 5 letters first');
        return;
      }
      guesses = [...guesses, currentGuess.toLowerCase()];
      currentGuess = '';
      statusNotice = null;
      return;
    }
    if (/^[a-z]$/i.test(key) && currentGuess.length < WORD_LEN) {
      currentGuess = `${currentGuess}${key.toLowerCase()}`;
    }
  }

  function handleWindowKeydown(e: KeyboardEvent) {
    if (activeGame !== 'tawalt') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'Enter' || e.key === 'Backspace' || /^[a-z]$/i.test(e.key)) {
      if (e.key === 'Enter' || e.key === 'Backspace') {
        // Avoid triggering links/buttons accidentally when typing in board
        if (tag !== 'A' && tag !== 'BUTTON') {
          e.preventDefault();
        }
      }
      pressKey(e.key);
    }
  }

  function resetPuzzle(nextIndex: number) {
    poolIndex = nextIndex;
    guesses = [];
    currentGuess = '';
    showHint = false;
    statusNotice = null;
  }

  function nextPracticeWord() {
    if (pool.length <= 1) {
      resetPuzzle(0);
      return;
    }
    resetPuzzle((poolIndex + 1) % pool.length);
  }

  function tileClass(state: LetterState, filled: boolean): string {
    if (state === 'correct') {
      return 'border-emerald-600 bg-emerald-600 text-white';
    }
    if (state === 'present') {
      return 'border-amber-500 bg-amber-500 text-white';
    }
    if (state === 'absent') {
      return 'border-muted-foreground/40 bg-muted-foreground/20 text-foreground/75';
    }
    return filled
      ? 'border-primary/60 bg-primary/5 text-foreground'
      : 'border-border bg-background text-muted-foreground/40';
  }

  function keyClass(letter: string): string {
    const state = keyStatuses[letter];
    if (state === 'correct') return 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700';
    if (state === 'present') return 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600';
    if (state === 'absent') return 'bg-muted/70 text-muted-foreground/50 border-border/50';
    return 'bg-background hover:bg-muted text-foreground border-border';
  }

  let games = [
    {
      id: 'tawalt',
      nameLatin: 'Tawalt',
      nameTifinagh: 'ⵜⴰⵡⴰⵍⵜ',
      tagline: 'The Daily Amazigh Wordle',
      desc: 'Guess the secret 5-letter Amazigh word in 6 attempts. Every tile shows its Neo-Tifinagh glyph live as you type, paired with the dictionary meaning.',
      badge: 'Playable Now',
      difficulty: 'Easy / Medium',
      icon: '🟩',
      features: ['Live Latin -> Tifinagh tiles', 'Built from verified Asafu entries', 'Unlimited practice rotation']
    },
    {
      id: 'anagam',
      nameLatin: 'Anagam',
      nameTifinagh: 'ⴰⵏⴰⴳⴰⵎ',
      tagline: 'Word Wheel / Spelling Bee',
      desc: 'Build as many Amazigh words as you can from 7 letters. Every word must use the center root consonant. Discover the daily Pangram!',
      badge: 'Playable Now',
      difficulty: 'Medium / Hard',
      icon: '🐝',
      features: ['Consonantal root validation', 'Pangram bonus points', 'Live Asafu dictionary lookup']
    },
    {
      id: 'assaghen',
      nameLatin: 'Assaɣen',
      nameTifinagh: 'ⴰⵙⵙⴰⵖⵏ',
      tagline: 'Connections / Word Associations',
      desc: 'Group 16 words into 4 secret categories without making more than 4 mistakes. Tests your vocabulary nuances and cultural knowledge.',
      badge: 'Playable Now',
      difficulty: 'Medium',
      icon: '🧩',
      features: ['4x4 interactive grouping grid', 'Culinary, nature & culture sets', 'Links straight to word pages']
    },
    {
      id: 'agemmay',
      nameLatin: 'Agemmay Mini',
      nameTifinagh: 'ⴰⴳⵎⵎⴰⵢ',
      tagline: 'Daily Tamaziɣt Crossword',
      desc: 'A bite-sized 5x5 crossword puzzle with clues testing your knowledge of Amazigh geography, nature, and everyday vocabulary.',
      badge: 'Playable Now',
      difficulty: 'All Levels',
      icon: '📝',
      features: ['Interlocking 5x5 Amazigh grid', 'Live Tifinagh sub-letters', 'Across & Down clue navigation']
    }
  ];
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="container mx-auto max-w-5xl space-y-12 px-4 py-10 sm:py-12">
  <!-- Header & Playable Uraren Section -->
  <section id="uraren-playground" class="mx-auto max-w-3xl space-y-6 text-center scroll-mt-16">
    <div class="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
      <Sparkles class="h-3.5 w-3.5" />
      <span>4 Playable Amazigh Brain Games · Powered by the Asafu Dictionary</span>
    </div>

    <div class="space-y-3">
      <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
        {m.games_title()}
      </h1>
      <p class="text-muted-foreground text-lg sm:text-xl">
        {m.games_subtitle()}
      </p>
    </div>

    <!-- Game Switcher Tabs -->
    <div class="mx-auto flex flex-wrap items-center justify-center gap-2">
      {#each games as game}
        <button
          type="button"
          onclick={() => (activeGame = game.id as GameTab)}
          class="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all {activeGame === game.id
            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
            : 'border-border bg-card text-muted-foreground hover:bg-muted/70 hover:text-foreground'}"
        >
          <span>{game.icon}</span>
          <span>{game.nameLatin}</span>
          <span class="font-tifinagh text-xs opacity-80">{game.nameTifinagh}</span>
        </button>
      {/each}
    </div>

    {#if activeGame === 'tawalt'}
    <!-- Playable Tawalt Wordle Card -->
    <div class="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div class="flex w-full items-center justify-between gap-2 border-b pb-3 text-xs">
        <div class="flex items-center gap-2">
          <span class="font-bold text-foreground">
            {poolIndex === 0 ? `Tawalt #${data.puzzleNumber}` : `Practice #${poolIndex}`}
          </span>
          {#if targetEntry.dialect}
            <Badge variant="outline" class="text-[10px] font-normal">
              {targetEntry.dialect}
            </Badge>
          {/if}
        </div>
        <div class="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            class="h-7 gap-1 px-2 text-xs"
            onclick={() => (showHint = !showHint)}
          >
            <Lightbulb class="h-3.5 w-3.5 text-amber-500" />
            {showHint ? 'Hide Clue' : 'Clue'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            class="h-7 gap-1 px-2 text-xs"
            onclick={nextPracticeWord}
            title="Try another 5-letter word"
          >
            <RotateCcw class="h-3.5 w-3.5" />
            New Word
          </Button>
        </div>
      </div>

      {#if showHint && !isFinished}
        <div class="bg-amber-500/10 border-amber-500/25 w-full rounded-lg border px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          <span class="font-semibold">Clue:</span> {targetEntry.meaning}
        </div>
      {/if}

      {#if statusNotice}
        <p class="text-primary text-xs font-semibold">{statusNotice}</p>
      {/if}

      <!-- 6x5 Letter Grid -->
      <div class="grid gap-1.5 sm:gap-2">
        {#each Array(MAX_ROWS) as _, rowIdx}
          {@const submittedGuess = guesses[rowIdx]}
          {@const isCurrentRow = rowIdx === guesses.length && !isFinished}
          {@const rowWord = submittedGuess ?? (isCurrentRow ? currentGuess : '')}
          {@const states = submittedGuess ? evaluateGuess(submittedGuess, targetWord) : null}

          <div class="flex gap-1.5 sm:gap-2">
            {#each Array(WORD_LEN) as _, colIdx}
              {@const ch = rowWord[colIdx] ?? ''}
              {@const state = states ? states[colIdx] : 'empty'}
              {@const tifi = ch ? latinToTifinagh(ch) : ''}
              <div
                class="flex h-12 w-12 flex-col items-center justify-center rounded-lg border-2 font-mono text-lg font-extrabold uppercase transition-all duration-200 sm:h-14 sm:w-14 sm:text-xl {tileClass(
                  state,
                  Boolean(ch)
                )}"
              >
                <span class="leading-none">{ch || ' '}</span>
                <span class="mt-0.5 font-serif text-[10px] leading-none opacity-80">
                  {tifi || ' '}
                </span>
              </div>
            {/each}
          </div>
        {/each}
      </div>

      <!-- Result Banner -->
      {#if isFinished}
        <div class="bg-muted/50 w-full space-y-2 rounded-xl border p-3.5 text-center">
          <div class="flex items-center justify-center gap-2">
            {#if hasWon}
              <CheckCircle2 class="h-4 w-4 text-emerald-600" />
              <span class="font-bold text-emerald-700 dark:text-emerald-400">
                Ayuz! Solved in {guesses.length}/{MAX_ROWS}
              </span>
            {:else}
              <HelpCircle class="h-4 w-4 text-amber-600" />
              <span class="font-bold text-foreground">
                The word was <span class="text-primary uppercase">{targetEntry.word}</span>
              </span>
            {/if}
          </div>
          <p class="text-sm font-medium">
            <span class="font-bold">{targetEntry.word}</span>
            <span class="text-primary font-serif mx-1">({targetEntry.tifinagh})</span>
            — <span class="text-muted-foreground">{targetEntry.meaning}</span>
          </p>
          <div class="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Button size="sm" variant="outline" href="/word/{targetEntry.slug}" class="gap-1.5 text-xs">
              <BookOpen class="h-3.5 w-3.5" />
              View Full Entry
            </Button>
            <Button size="sm" onclick={nextPracticeWord} class="gap-1.5 text-xs">
              Play Another Word
              <ArrowRight class="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      {/if}

      <!-- On-screen Keyboard -->
      <div class="w-full space-y-1.5 pt-1 select-none">
        {#each KEYBOARD_ROWS as row}
          <div class="flex justify-center gap-1">
            {#each row as key}
              {#if key === 'ENTER'}
                <button
                  type="button"
                  onclick={() => pressKey('ENTER')}
                  class="bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 items-center justify-center rounded-md px-2.5 text-[11px] font-bold transition-colors"
                  aria-label="Submit guess"
                >
                  <CornerDownLeft class="h-3.5 w-3.5" />
                </button>
              {:else if key === 'BACK'}
                <button
                  type="button"
                  onclick={() => pressKey('BACK')}
                  class="bg-muted hover:bg-muted/80 text-foreground flex h-10 items-center justify-center rounded-md border px-2.5 text-xs font-bold transition-colors"
                  aria-label="Backspace"
                >
                  <Delete class="h-4 w-4" />
                </button>
              {:else}
                <button
                  type="button"
                  onclick={() => pressKey(key)}
                  class="flex h-10 min-w-[26px] flex-1 max-w-[36px] items-center justify-center rounded-md border text-xs font-bold uppercase transition-colors {keyClass(
                    key
                  )}"
                >
                  {key}
                </button>
              {/if}
            {/each}
          </div>
        {/each}
      </div>
    </div>
    {:else if activeGame === 'anagam'}
      <AnagamGame />
    {:else if activeGame === 'assaghen'}
      <AssaghenGame />
    {:else}
      <AgemmayMiniGame />
    {/if}
  </section>

  <!-- Game Cards Showcase -->
  <section class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
      <div>
        <h2 class="text-2xl font-bold">Uraren Lineup</h2>
        <p class="text-muted-foreground text-sm">
          A full suite of brain games powered by the Asafu community dictionary.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Badge variant="outline" class="gap-1.5 text-xs">
          <Flame class="h-3.5 w-3.5 text-amber-500" />
          Daily Streaks
        </Badge>
        <Badge variant="outline" class="gap-1.5 text-xs">
          <Trophy class="h-3.5 w-3.5 text-yellow-500" />
          Leaderboards
        </Badge>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      {#each games as game}
        <Card.Root class="flex flex-col justify-between transition-all {activeGame === game.id ? 'border-primary shadow-sm' : 'hover:border-primary/50'}">
          <Card.Header class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-3xl">{game.icon}</span>
              <div class="flex items-center gap-2">
                <Badge variant="outline" class="text-[10px]">
                  {game.difficulty}
                </Badge>
                <Badge
                  variant={activeGame === game.id ? 'default' : 'secondary'}
                  class="text-[10px] font-bold"
                >
                  {activeGame === game.id ? 'Active' : game.badge}
                </Badge>
              </div>
            </div>

            <div>
              <Card.Title class="text-2xl flex items-center gap-2.5">
                <AmazighWord word={game.nameLatin} tifinagh={game.nameTifinagh}>
                  <span>{game.nameLatin}</span>
                  <span class="text-primary font-serif text-xl">{game.nameTifinagh}</span>
                </AmazighWord>
              </Card.Title>
              <p class="text-primary text-xs font-semibold mt-0.5">{game.tagline}</p>
            </div>

            <Card.Description class="text-sm leading-relaxed">
              {game.desc}
            </Card.Description>
          </Card.Header>

          <Card.Content class="space-y-4 pt-0">
            <div class="space-y-1.5 border-t pt-4">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Highlights
              </span>
              <ul class="space-y-1 text-xs text-muted-foreground">
                {#each game.features as feat}
                  <li class="flex items-center gap-2">
                    <CheckCircle2 class="h-3 w-3 text-primary shrink-0" />
                    <span>{feat}</span>
                  </li>
                {/each}
              </ul>
            </div>

            <Button
              variant={activeGame === game.id ? 'secondary' : 'default'}
              size="sm"
              class="w-full gap-1.5"
              onclick={() => selectGame(game.id as GameTab)}
            >
              <span>{activeGame === game.id ? `Playing ${game.nameLatin}` : `Play ${game.nameLatin}`}</span>
              <ArrowRight class="h-3.5 w-3.5" />
            </Button>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  </section>

  <!-- Community Call to Action -->
  <Card.Root class="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card py-0">
    <Card.Content class="flex flex-col items-center justify-between gap-6 p-5 text-center sm:flex-row sm:p-8 sm:text-left">
      <div class="space-y-2 max-w-xl">
        <h3 class="text-xl font-bold flex items-center gap-2 justify-center sm:justify-start">
          <Sparkles class="h-5 w-5 text-primary" />
          Help Fuel the Daily Word Banks
        </h3>
        <p class="text-muted-foreground text-sm leading-relaxed">
          The game puzzles are built directly from entries in the Asafu Dictionary. Contribute new words, definitions, and pronunciations today to have your words featured in upcoming daily puzzles!
        </p>
      </div>

      <div class="flex flex-wrap gap-3 shrink-0">
        <Button href="/add" class="gap-1.5">
          <BookOpen class="h-4 w-4" />
          Contribute Words
        </Button>
        <Button variant="outline" href="/courses" class="gap-1.5">
          Practice in Courses
          <ArrowRight class="h-4 w-4" />
        </Button>
      </div>
    </Card.Content>
  </Card.Root>
</div>
