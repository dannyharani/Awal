<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as m from '$lib/paraglide/messages.js';
  import {
    Gamepad2,
    Sparkles,
    Flame,
    Trophy,
    BookOpen,
    ArrowRight,
    CheckCircle2,
    Clock,
    Construction
  } from '@lucide/svelte';

  // Interactive mock demo for Tawalt (Wordle)
  let demoWord = ['A', 'Z', 'U', 'L', '—'];
  let demoTifinagh = ['ⴰ', 'ⵣ', 'ⵓ', 'ⵍ', ' '];
  let demoColors = [
    'bg-emerald-600 text-white border-emerald-600',
    'bg-emerald-600 text-white border-emerald-600',
    'bg-emerald-600 text-white border-emerald-600',
    'bg-emerald-600 text-white border-emerald-600',
    'bg-primary/20 text-primary border-primary/40'
  ];

  let games = [
    {
      id: 'tawalt',
      nameLatin: 'Tawalt',
      nameTifinagh: 'ⵜⴰⵡⴰⵍⵜ',
      tagline: 'The Daily Amazigh Wordle',
      desc: 'Guess the secret 5-letter Amazigh word in 6 attempts. Play in standard Tamaziɣt Latin or authentic Neo-Tifinagh with dialect clues.',
      badge: 'Coming First',
      difficulty: 'Easy / Medium',
      icon: '🟩',
      features: ['Latin & Tifinagh modes', 'Pronunciation audio on win', 'Regional dialect variations']
    },
    {
      id: 'anagam',
      nameLatin: 'Anagam',
      nameTifinagh: 'ⴰⵏⴰⴳⴰⵎ',
      tagline: 'Word Wheel / Spelling Bee',
      desc: 'Build as many Amazigh words as you can from 7 letters. Every word must use the center root consonant. Discover the daily Pangram!',
      badge: 'In Development',
      difficulty: 'Medium / Hard',
      icon: '🐝',
      features: ['Consonantal root validation', 'Pangram bonus points', 'Dictionary definition links']
    },
    {
      id: 'assaghen',
      nameLatin: 'Assaɣen',
      nameTifinagh: 'ⴰⵙⵙⴰⵖⵏ',
      tagline: 'Connections / Word Associations',
      desc: 'Group 16 words into 4 secret categories without making more than 4 mistakes. Tests your vocabulary nuances and cultural knowledge.',
      badge: 'In Design',
      difficulty: 'Medium',
      icon: '🧩',
      features: ['Dialect cognates', 'Culinary & botanical terms', 'Linguistic morphology sets']
    },
    {
      id: 'agemmay',
      nameLatin: 'Agemmay Mini',
      nameTifinagh: 'ⴰⴳⵎⵎⴰⵢ',
      tagline: 'Daily Tamaziɣt Crossword',
      desc: 'A bite-sized 5x5 crossword puzzle with clues testing your knowledge of Amazigh geography, history, poetry, and everyday vocabulary.',
      badge: 'Planned',
      difficulty: 'All Levels',
      icon: '📝',
      features: ['Bilingual hints', 'Tifinagh grid support', 'Time-trial leaderboards']
    }
  ];
</script>

<div class="container mx-auto max-w-5xl space-y-12 px-4 py-12">
  <!-- Work in Progress Notice Header -->
  <section class="mx-auto max-w-3xl space-y-6 text-center">
    <div class="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
      <Construction class="h-3.5 w-3.5" />
      <span>{m.games_under_construction()}</span>
    </div>

    <div class="space-y-3">
      <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
        {m.games_title()}
      </h1>
      <p class="text-muted-foreground text-xl">
        {m.games_subtitle()}
      </p>
    </div>

    <!-- Interactive Tawalt Teaser Grid -->
    <div class="mx-auto flex max-w-sm flex-col items-center gap-3 rounded-2xl border bg-card p-6 shadow-sm">
      <div class="flex items-center justify-between w-full px-2 text-xs font-semibold text-muted-foreground">
        <span>Tawalt #001 Teaser</span>
        <span class="flex items-center gap-1 text-emerald-600 font-bold">
          <CheckCircle2 class="h-3.5 w-3.5" /> 1/6 Solved!
        </span>
      </div>

      <div class="flex gap-2">
        {#each demoWord as letter, i}
          <div
            class="flex h-14 w-14 flex-col items-center justify-center rounded-lg border-2 font-mono text-xl font-extrabold transition-all duration-300 {demoColors[i]}"
          >
            <span>{letter}</span>
            <span class="text-[10px] font-serif opacity-80">{demoTifinagh[i]}</span>
          </div>
        {/each}
      </div>

      <p class="text-xs text-muted-foreground text-center pt-1">
        <strong class="text-foreground">Azul</strong> ("Hello / Peace") — Guessed in 1 attempt!
      </p>
    </div>
  </section>

  <!-- Game Cards Showcase -->
  <section class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
      <div>
        <h2 class="text-2xl font-bold">Upcoming Game Lineup</h2>
        <p class="text-muted-foreground text-sm">
          A full suite of brain games powered by the Awal community dictionary.
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
        <Card.Root class="flex flex-col justify-between hover:border-primary/50 transition-all">
          <Card.Header class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-3xl">{game.icon}</span>
              <div class="flex items-center gap-2">
                <Badge variant="outline" class="text-[10px]">
                  {game.difficulty}
                </Badge>
                <Badge variant="secondary" class="text-[10px] font-bold">
                  {game.badge}
                </Badge>
              </div>
            </div>

            <div>
              <Card.Title class="text-2xl flex items-center gap-2.5">
                <span>{game.nameLatin}</span>
                <span class="text-primary font-serif text-xl">{game.nameTifinagh}</span>
              </Card.Title>
              <p class="text-primary text-xs font-semibold mt-0.5">{game.tagline}</p>
            </div>

            <Card.Description class="text-sm leading-relaxed">
              {game.desc}
            </Card.Description>
          </Card.Header>

          <Card.Content class="pt-0">
            <div class="space-y-1.5 border-t pt-4">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Planned Highlights
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
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  </section>

  <!-- Community Call to Action -->
  <Card.Root class="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
    <Card.Content class="flex flex-col items-center justify-between gap-6 p-8 text-center sm:flex-row sm:text-left">
      <div class="space-y-2 max-w-xl">
        <h3 class="text-xl font-bold flex items-center gap-2 justify-center sm:justify-start">
          <Sparkles class="h-5 w-5 text-primary" />
          Help Fuel the Daily Word Banks
        </h3>
        <p class="text-muted-foreground text-sm leading-relaxed">
          The game puzzles are built directly from entries in the Awal Dictionary. Contribute new words, definitions, and pronunciations today to have your words featured in upcoming daily puzzles!
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
