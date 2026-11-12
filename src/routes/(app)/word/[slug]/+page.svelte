<script lang="ts">
  import AddDefinitionCard from '$lib/components/dictionary/AddDefinitionCard.svelte';
  import DefinitionCard from '$lib/components/dictionary/DefinitionCard.svelte';
  import AudioPlayer from '$lib/components/dictionary/AudioPlayer.svelte';
  import AudioRecorder from '$lib/components/dictionary/AudioRecorder.svelte';
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import { browser } from '$app/environment';
  import { latinToTifinagh, tifinaghBreakdown, WORD_RELATION_TYPES } from '$lib/utils/amazigh';
  import { isSystemUsername } from '$lib/constants';
  import * as m from '$lib/paraglide/messages.js';

  // UI Components
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Avatar from '$lib/components/ui/avatar';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Separator } from '$lib/components/ui/separator';
  import {
    Globe,
    Pencil,
    WandSparkles,
    Link2,
    Plus,
    X,
    Filter,
    ArrowLeft,
    ArrowRight,
    Sparkles,
    Copy,
    Check,
    Share2,
    Bookmark,
    GraduationCap,
    Layers,
    ShieldCheck,
    ArrowUpDown,
    RotateCcw,
    Volume2,
    BookOpen,
    Search,
    Mic
  } from '@lucide/svelte';

  let { data } = $props();
  let headword = $derived(data.headword);
  let definitions = $derived(data.definitions ?? []);
  let dialects = $derived(data.dialects ?? []);
  let relatedWords = $derived(data.relatedWords ?? []);
  let sameRootWords = $derived(data.sameRootWords ?? []);
  let meaningCognates = $derived(data.meaningCognates ?? []);
  let detectedRoots = $derived(data.detectedRoots ?? []);
  let linkedLessons = $derived(data.linkedLessons ?? []);
  let relatedCourses = $derived(data.relatedCourses ?? []);
  let userVotes = $derived((data.userVotes ?? {}) as Record<number, number>);
  let userExampleVotes = $derived((data.userExampleVotes ?? {}) as Record<number, number>);
  let role = $derived(data.role);
  let { user, supabase } = $derived(page.data);

  // Copy & Share feedback state
  let copiedKey = $state<string | null>(null);
  let showTifinaghGuide = $state(false);
  let audioDialogOpen = $state(false);
  let audioDialectId = $state<number>(1);
  let isUploadingAudio = $state(false);

  $effect(() => {
    if (dialects.length > 0 && !dialects.some((d) => d.id === audioDialectId)) {
      audioDialectId = dialects[0].id;
    }
  });
  let tifinaghLetters = $derived(
    headword?.script_tifinagh ? tifinaghBreakdown(headword.script_tifinagh) : []
  );
  function copyText(text: string, key: string) {
    if (!browser || !text) return;
    navigator.clipboard.writeText(text);
    copiedKey = key;
    setTimeout(() => {
      if (copiedKey === key) copiedKey = null;
    }, 1800);
  }

  function shareWord() {
    if (!browser || !headword) return;
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${headword.script_latin} ${headword.script_tifinagh ? `(${headword.script_tifinagh})` : ''} — Asafu`,
        url
      }).catch(() => copyText(url, 'share'));
    } else {
      copyText(url, 'share');
    }
  }

  // Saved / Bookmarked Word state (persisted in localStorage)
  const SAVED_WORDS_KEY = 'awal_saved_words';
  let isBookmarked = $state(false);

  $effect(() => {
    if (!browser || !headword) return;
    try {
      const raw = localStorage.getItem(SAVED_WORDS_KEY);
      const list: Array<{ slug: string }> = raw ? JSON.parse(raw) : [];
      isBookmarked = list.some((item) => item.slug === headword.slug);
    } catch {
      isBookmarked = false;
    }
  });

  function toggleBookmark() {
    if (!browser || !headword) return;
    try {
      const raw = localStorage.getItem(SAVED_WORDS_KEY);
      let list: Array<{ slug: string; latin: string | null; tifinagh: string | null }> = raw
        ? JSON.parse(raw)
        : [];
      if (list.some((item) => item.slug === headword.slug)) {
        list = list.filter((item) => item.slug !== headword.slug);
        isBookmarked = false;
      } else {
        list.unshift({
          slug: headword.slug,
          latin: headword.script_latin,
          tifinagh: headword.script_tifinagh
        });
        isBookmarked = true;
      }
      localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(list.slice(0, 100)));
    } catch {
      // Ignore storage quota errors
    }
  }

  // Practice Flashcard modal state
  let practiceOpen = $state(false);
  let flashcardFlipped = $state(false);

  // Edit scripts dialog state
  let editScriptsOpen = $state(false);
  let tifinaghInput = $state('');
  let arabicInput = $state('');

  function openEditScripts() {
    if (!headword) return;
    tifinaghInput = headword.script_tifinagh ?? '';
    arabicInput = headword.script_arabic ?? '';
    editScriptsOpen = true;
  }

  function autoFillTifinagh() {
    if (!headword) return;
    tifinaghInput = latinToTifinagh(headword.script_latin ?? '');
  }

  // Add Related Word dialog state
  let addRelationOpen = $state(false);
  let relationSlug = $state('');
  let relationType = $state('variant');
  let relationSearchResults = $state<
    Array<{ id: number; slug: string; headword_text: string; script_tifinagh?: string | null }>
  >([]);

  async function searchRelatedWord(term: string) {
    if (!headword) return;
    relationSlug = term;
    if (!term || term.trim().length < 2) {
      relationSearchResults = [];
      return;
    }
    const { data: results } = await supabase.rpc('search_dictionary', {
      term: term.trim()
    });
    if (results) {
      relationSearchResults = results.filter(
        (r: { id: number }) => r.id !== headword.id
      );
    }
  }

  // Filter & Sort definitions state
  let selectedDialectId = $state<number | 'all'>('all');
  let selectedLang = $state<string>('all');
  let sortBy = $state<'recommended' | 'votes' | 'audio' | 'newest'>('recommended');

  // Reset filters when navigating between words
  $effect(() => {
    void headword?.id;
    selectedDialectId = 'all';
    selectedLang = 'all';
    flashcardFlipped = false;
  });

  let availableDialects = $derived.by(() => {
    const counts = new Map<number, { name: string; count: number }>();
    for (const def of definitions) {
      if (def.dialect_id && def.dialects?.name) {
        const prev = counts.get(def.dialect_id);
        counts.set(def.dialect_id, {
          name: def.dialects.name,
          count: (prev?.count ?? 0) + 1
        });
      }
    }
    return Array.from(counts.entries()).map(([id, info]) => ({
      id,
      name: info.name,
      count: info.count
    }));
  });

  let availableLangs = $derived.by(() => {
    const set = new Set<string>();
    for (const def of definitions) {
      if (def.language_code) set.add(def.language_code);
    }
    return Array.from(set);
  });

  // Aggregated metadata for Hero Banner
  let primaryAudioDef = $derived(definitions.find((d: { audio_url?: string | null }) => Boolean(d.audio_url)) ?? null);
  let hasVerifiedDef = $derived(definitions.some((d: { is_verified?: boolean | null }) => Boolean(d.is_verified)));

  let distinctPartsOfSpeech = $derived.by(() => {
    const set = new Set<string>();
    for (const def of definitions) {
      const attrs = typeof def.attributes === 'string' ? JSON.parse(def.attributes) : def.attributes;
      if (attrs?.part_of_speech) set.add(attrs.part_of_speech);
    }
    return Array.from(set);
  });

  let primaryMorphology = $derived.by(() => {
    for (const def of definitions) {
      const attrs = typeof def.attributes === 'string' ? JSON.parse(def.attributes) : def.attributes;
      if (attrs && (attrs.construct_state || attrs.plural || attrs.root || attrs.verb_stems)) {
        return attrs as Record<string, string>;
      }
    }
    return null;
  });

  let contributors = $derived.by(() => {
    const map = new Map<string, { username: string; avatar_url: string | null }>();
    for (const def of definitions) {
      if (
        def.author?.username &&
        !isSystemUsername(def.author.username) &&
        !map.has(def.author.username)
      ) {
        map.set(def.author.username, {
          username: def.author.username,
          avatar_url: def.author.avatar_url ?? null
        });
      }
    }
    return Array.from(map.values()).slice(0, 5);
  });

  let filteredDefinitions = $derived.by(() => {
    const filtered = definitions.filter((def: { dialect_id: number | null; language_code: string | null }) => {
      if (selectedDialectId !== 'all' && def.dialect_id !== selectedDialectId) return false;
      if (selectedLang !== 'all' && def.language_code !== selectedLang) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'votes') {
        return (b.vote_score ?? 0) - (a.vote_score ?? 0);
      }
      if (sortBy === 'audio') {
        const aAudio = a.audio_url ? 1 : 0;
        const bAudio = b.audio_url ? 1 : 0;
        if (bAudio !== aAudio) return bAudio - aAudio;
        return (b.vote_score ?? 0) - (a.vote_score ?? 0);
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      }
      // Default: 'recommended' (verified first, then vote_score)
      const aVer = a.is_verified ? 1 : 0;
      const bVer = b.is_verified ? 1 : 0;
      if (bVer !== aVer) return bVer - aVer;
      return (b.vote_score ?? 0) - (a.vote_score ?? 0);
    });
  });

  const RELATION_LABELS: Record<string, string> = {
    variant: 'Dialect Variant',
    synonym: 'Synonym',
    antonym: 'Antonym',
    derived: 'Derived Form'
  };
</script>

{#if data.wordNotFound}
  <div class="mx-auto max-w-4xl space-y-10 px-4 py-12">
    <div>
      <Button
        variant="ghost"
        size="sm"
        href="/"
        class="text-muted-foreground hover:text-foreground -ml-2 gap-1.5 text-xs"
      >
        <ArrowLeft class="h-3.5 w-3.5" />
        {m.word_back_to_dict()}
      </Button>
    </div>

    <!-- Main Word Not Found Card -->
    <Card.Root class="border-dashed p-8 text-center sm:p-12">
      <div class="space-y-6">
        <div class="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
          <Sparkles class="h-3.5 w-3.5" />
          <span>Word Not Yet in Dictionary</span>
        </div>

        <div class="space-y-2">
          <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl">
            "{data.candidateWord}"
          </h1>
          {#if data.candidateTifinagh}
            <p class="text-primary font-serif text-3xl sm:text-4xl">
              {data.candidateTifinagh}
            </p>
          {/if}
        </div>

        <p class="text-muted-foreground mx-auto max-w-md text-base leading-relaxed">
          This Amazigh word has not been documented in the Asafu dictionary yet. You can be the first to create it and add its meaning!
        </p>

        {#if data.glossary}
          <div class="bg-primary/5 border-primary/20 mx-auto max-w-lg rounded-xl border p-4 text-left space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-primary text-xs font-bold uppercase tracking-wider">
                Built-in Cultural Glossary
              </span>
              <span class="text-muted-foreground text-xs">{data.glossary.dialect}</span>
            </div>
            <p class="text-sm font-semibold">
              {data.glossary.word} <span class="text-primary font-serif">({data.glossary.tifinagh})</span>:
              <span class="text-muted-foreground font-normal">{data.glossary.meaning}</span>
            </p>
            {#if data.glossary.notes}
              <p class="text-muted-foreground text-xs italic">{data.glossary.notes}</p>
            {/if}
          </div>
        {/if}

        <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            size="lg"
            href="/add?word={encodeURIComponent(data.candidateWord ?? '')}&tifinagh={encodeURIComponent(data.candidateTifinagh ?? '')}"
            class="gap-2"
          >
            <Plus class="h-5 w-5" />
            Add "{data.candidateWord}" to Dictionary
          </Button>
          <Button
            variant="secondary"
            size="lg"
            href="/search?q={encodeURIComponent(data.candidateWord ?? '')}"
            class="gap-2"
          >
            <Search class="h-4 w-4" />
            Search Dictionary
          </Button>
          <Button variant="outline" size="lg" href="/">
            Browse Dictionary
          </Button>
        </div>

        {#if !user}
          <p class="text-muted-foreground text-xs">
            Sign in with Google to create this word, add pronunciation audio, and earn contributor reputation.
          </p>
        {/if}
      </div>
    </Card.Root>

    <!-- Did you mean / Similar Words -->
    {#if data.similarWords && data.similarWords.length > 0}
      <div class="space-y-4">
        <h3 class="text-muted-foreground text-xs font-bold uppercase tracking-wider">
          Similar Words in Dictionary
        </h3>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {#each data.similarWords as word (word.id)}
            <a
              href="/word/{word.slug}"
              class="bg-card hover:border-primary/50 group flex items-center justify-between rounded-lg border p-3.5 transition-all hover:shadow-xs"
            >
              <div>
                <p class="group-hover:text-primary font-bold transition-colors">
                  {word.script_latin}
                </p>
                {#if word.script_tifinagh}
                  <p class="text-muted-foreground font-serif text-xs">
                    {word.script_tifinagh}
                  </p>
                {/if}
              </div>
              <ArrowRight class="text-muted-foreground group-hover:text-primary h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{:else if headword}
  <div class="mx-auto max-w-7xl space-y-8 px-4 py-8">
    <!-- Top Navigation & Utility Bar -->
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

      <div class="flex flex-wrap items-center gap-2">
        {#if definitions.length > 0}
          <Dialog.Root bind:open={practiceOpen}>
            <Dialog.Trigger>
              {#snippet child({ props })}
                <Button
                  variant="outline"
                  size="sm"
                  class="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 h-8 gap-1.5 text-xs font-semibold"
                  {...props}
                >
                  <Layers class="h-3.5 w-3.5" />
                  {m.word_practice_flashcard()}
                </Button>
              {/snippet}
            </Dialog.Trigger>
            <Dialog.Content class="sm:max-w-[480px]">
              <Dialog.Header>
                <Dialog.Title class="flex items-center gap-2">
                  <Layers class="text-primary h-4 w-4" />
                  {m.word_practice_flashcard()}
                </Dialog.Title>
              </Dialog.Header>

              <div class="space-y-4 py-2">
                <button
                  type="button"
                  onclick={() => (flashcardFlipped = !flashcardFlipped)}
                  class="border-primary/25 from-card via-card to-primary/5 hover:border-primary/50 flex min-h-[250px] w-full flex-col items-center justify-between rounded-2xl border-2 bg-gradient-to-br p-6 text-center shadow-md transition-all"
                >
                  <div class="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>{flashcardFlipped ? m.word_definition_label() : 'Tamaziɣt'}</span>
                    <span class="inline-flex items-center gap-1 text-primary">
                      <RotateCcw class="h-3 w-3" /> Flip
                    </span>
                  </div>

                  {#if !flashcardFlipped}
                    <div class="my-auto space-y-3 py-4">
                      <p class="text-4xl font-extrabold tracking-tight">
                        {headword.script_latin}
                      </p>
                      {#if headword.script_tifinagh}
                        <p class="text-primary font-serif text-3xl">
                          {headword.script_tifinagh}
                        </p>
                      {/if}
                      {#if headword.script_arabic}
                        <p class="text-muted-foreground text-xl" dir="rtl">
                          {headword.script_arabic}
                        </p>
                      {/if}
                    </div>
                    <p class="text-muted-foreground text-xs">
                      {m.word_flashcard_front_hint()}
                    </p>
                  {:else}
                    <div class="my-auto w-full space-y-3 py-3 text-left">
                      {#each definitions.slice(0, 3) as d (d.id)}
                        <div class="bg-muted/40 rounded-lg border px-3 py-2">
                          <div class="mb-1 flex items-center justify-between gap-2">
                            <Badge variant="outline" class="text-[10px]">
                              {d.dialects?.name ?? 'General'}
                            </Badge>
                            {#if d.language_code}
                              <span class="text-muted-foreground text-[10px] font-bold uppercase">
                                {d.language_code}
                              </span>
                            {/if}
                          </div>
                          <p class="font-serif text-sm font-medium">{d.definition_text}</p>
                        </div>
                      {/each}

                      {#if primaryMorphology}
                        <div class="flex flex-wrap gap-1.5 pt-1">
                          {#if primaryMorphology.construct_state}
                            <Badge variant="secondary" class="text-[10px]">
                              {m.word_attr_construct()} {primaryMorphology.construct_state}
                            </Badge>
                          {/if}
                          {#if primaryMorphology.plural}
                            <Badge variant="secondary" class="text-[10px]">
                              {m.word_attr_plural()} {primaryMorphology.plural}
                            </Badge>
                          {/if}
                          {#if primaryMorphology.root}
                            <Badge variant="secondary" class="font-mono text-[10px]">
                              {m.word_attr_root()} {primaryMorphology.root}
                            </Badge>
                          {/if}
                        </div>
                      {/if}
                    </div>
                    <p class="text-muted-foreground text-xs">
                      {m.word_flashcard_back_hint()}
                    </p>
                  {/if}
                </button>

                {#if primaryAudioDef?.audio_url}
                  <div class="flex items-center justify-center">
                    <AudioPlayer
                      src={primaryAudioDef.audio_url}
                      label={primaryAudioDef.dialects?.name ?? m.word_listen()}
                    />
                  </div>
                {/if}
              </div>
            </Dialog.Content>
          </Dialog.Root>
        {/if}

        <Button
          variant={isBookmarked ? 'default' : 'outline'}
          size="sm"
          onclick={toggleBookmark}
          class="h-8 gap-1.5 text-xs"
        >
          <Bookmark class="h-3.5 w-3.5 {isBookmarked ? 'fill-current' : ''}" />
          {isBookmarked ? m.word_bookmarked() : m.word_bookmark()}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onclick={shareWord}
          class="h-8 gap-1.5 text-xs"
        >
          {#if copiedKey === 'share'}
            <Check class="h-3.5 w-3.5 text-emerald-500" />
            <span>{m.word_copied()}</span>
          {:else}
            <Share2 class="h-3.5 w-3.5" />
            <span>{m.word_share()}</span>
          {/if}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          href="#add-definition-section"
          class="h-8 gap-1 text-xs md:hidden"
        >
          <Plus class="h-3.5 w-3.5" />
          {m.word_add_definition_title()}
        </Button>
      </div>
    </div>

    <!-- Hero Headword Banner Card -->
    <div class="border-primary/20 from-primary/5 via-card to-card relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-xs sm:p-8">
      <div class="flex flex-col justify-between gap-5 lg:flex-row lg:items-start lg:gap-6">
        <div class="min-w-0 space-y-4">
          <!-- Multi-Script Display -->
          <div class="flex flex-wrap items-center gap-2.5 sm:gap-4">
            <h1 class="text-foreground break-words text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              {headword.script_latin}
            </h1>

            {#if headword.script_tifinagh}
              <button
                type="button"
                onclick={() => copyText(headword.script_tifinagh ?? '', 'tifinagh')}
                title="{m.word_copy()} Neo-Tifinagh"
                class="border-primary/25 bg-primary/10 hover:bg-primary/15 group inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 transition-all"
              >
                <span class="text-primary font-serif text-2xl font-semibold sm:text-3xl">
                  {headword.script_tifinagh}
                </span>
                {#if copiedKey === 'tifinagh'}
                  <Check class="h-3.5 w-3.5 text-emerald-500" />
                {:else}
                  <Copy class="text-primary/60 group-hover:text-primary h-3.5 w-3.5 transition-opacity" />
                {/if}
              </button>
              {#if tifinaghLetters.some((item) => item.isTifinagh)}
                <button
                  type="button"
                  onclick={() => (showTifinaghGuide = !showTifinaghGuide)}
                  class="text-muted-foreground hover:border-primary/40 hover:text-primary inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                  aria-expanded={showTifinaghGuide}
                >
                  <BookOpen class="h-3 w-3" />
                  {showTifinaghGuide ? 'Hide script guide' : 'Read Tifinagh'}
                </button>
              {/if}
            {:else}
              <span class="text-muted-foreground/60 rounded-lg border border-dashed px-2.5 py-1 text-xs italic">
                {m.word_no_tifinagh()}
              </span>
            {/if}

            {#if headword.script_arabic}
              <button
                type="button"
                onclick={() => copyText(headword.script_arabic ?? '', 'arabic')}
                title="{m.word_copy()} Arabic"
                class="bg-muted/60 hover:bg-muted group inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 transition-all"
              >
                <span class="text-xl sm:text-2xl" dir="rtl">
                  {headword.script_arabic}
                </span>
                {#if copiedKey === 'arabic'}
                  <Check class="h-3.5 w-3.5 text-emerald-500" />
                {:else}
                  <Copy class="text-muted-foreground group-hover:text-foreground h-3.5 w-3.5" />
                {/if}
              </button>
            {/if}

            {#if user}
              <Dialog.Root bind:open={editScriptsOpen}>
                <Dialog.Trigger>
                  {#snippet child({ props })}
                    <Button
                      variant="ghost"
                      size="sm"
                      class="text-muted-foreground hover:text-foreground h-8 gap-1.5 px-2.5 text-xs"
                      onclick={openEditScripts}
                      {...props}
                    >
                      <Pencil class="h-3.5 w-3.5" />
                      {m.word_edit_scripts()}
                    </Button>
                  {/snippet}
                </Dialog.Trigger>
                <Dialog.Content class="sm:max-w-[440px]">
                  <Dialog.Header>
                    <Dialog.Title>{m.word_update_scripts_title({ word: headword.script_latin ?? '' })}</Dialog.Title>
                  </Dialog.Header>
                  <form
                    method="POST"
                    action="?/updateHeadword"
                    use:enhance={() => {
                      return async ({ update }) => {
                        editScriptsOpen = false;
                        await update();
                      };
                    }}
                    class="space-y-4 pt-2"
                  >
                    <div class="space-y-2">
                      <div class="flex items-center justify-between">
                        <Label for="edit-tifinagh">{m.word_tifinagh_label()}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onclick={autoFillTifinagh}
                          class="text-primary h-6 gap-1 px-2 text-xs"
                        >
                          <WandSparkles class="h-3 w-3" />
                          {m.word_auto_transliterate()}
                        </Button>
                      </div>
                      <Input
                        id="edit-tifinagh"
                        name="script_tifinagh"
                        bind:value={tifinaghInput}
                        placeholder="e.g. ⴰⵎⴰⵏ"
                        class="font-serif text-lg"
                      />
                    </div>

                    <div class="space-y-2">
                      <Label for="edit-arabic">{m.word_arabic_label()}</Label>
                      <Input
                        id="edit-arabic"
                        name="script_arabic"
                        bind:value={arabicInput}
                        placeholder="e.g. أمان"
                        dir="rtl"
                        class="text-lg"
                      />
                    </div>

                    <div class="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onclick={() => (editScriptsOpen = false)}
                      >
                        {m.common_cancel()}
                      </Button>
                      <Button type="submit" size="sm">{m.common_save()}</Button>
                    </div>
                  </form>
                </Dialog.Content>
              </Dialog.Root>
            {/if}
          </div>

          <!-- At-a-Glance Linguistic Summary Strip -->
          <div class="flex flex-wrap items-center gap-2 pt-1">
            {#if hasVerifiedDef}
              <Badge class="gap-1 bg-emerald-600/90 text-white hover:bg-emerald-600">
                <ShieldCheck class="h-3 w-3" />
                {m.word_verified()}
              </Badge>
            {/if}

            {#each distinctPartsOfSpeech as pos}
              <Badge variant="secondary" class="font-serif italic capitalize">
                {pos}
              </Badge>
            {/each}

            {#each detectedRoots as root}
              <a
                href="/search?q={encodeURIComponent(`root:${root}`)}"
                class="border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs font-bold uppercase transition-colors"
                title="Explore words with root {root}"
              >
                {m.word_attr_root()} {root}
              </a>
            {/each}

            {#if availableDialects.length > 0}
              <Badge variant="outline" class="gap-1 text-xs">
                <Globe class="h-3 w-3 text-primary" />
                {m.word_dialects_documented({ count: availableDialects.length })}
              </Badge>
            {/if}
          </div>
        </div>

        <!-- Right Side of Hero: Primary Audio Player, Quick Record & Contributors -->
        <div class="flex flex-col items-start gap-3 lg:items-end">
          <div class="flex flex-wrap items-center gap-2">
            {#if primaryAudioDef?.audio_url}
              <div class="bg-background/80 flex items-center gap-2.5 rounded-xl border p-2 shadow-2xs">
                <AudioPlayer
                  src={primaryAudioDef.audio_url}
                  label={primaryAudioDef.dialects?.name ?? m.word_listen()}
                />
              </div>
            {/if}

            {#if user && headword}
              <Dialog.Root bind:open={audioDialogOpen}>
                <Dialog.Trigger>
                  {#snippet child({ props })}
                    <Button
                      variant={primaryAudioDef?.audio_url ? 'outline' : 'default'}
                      size="sm"
                      class="gap-1.5 rounded-xl shadow-2xs"
                      {...props}
                    >
                      <Mic class="h-3.5 w-3.5" />
                      {primaryAudioDef?.audio_url ? 'Add Dialect Audio' : 'Record Pronunciation'}
                    </Button>
                  {/snippet}
                </Dialog.Trigger>
                <Dialog.Content class="sm:max-w-[440px]">
                  <Dialog.Header>
                    <Dialog.Title class="flex items-center gap-2">
                      <Mic class="text-primary h-4 w-4" />
                      Record Pronunciation for "{headword.script_latin}"
                    </Dialog.Title>
                  </Dialog.Header>

                  <form
                    method="POST"
                    action="?/addPronunciation"
                    enctype="multipart/form-data"
                    use:enhance={() => {
                      isUploadingAudio = true;
                      return async ({ result, update }) => {
                        isUploadingAudio = false;
                        await update();
                        if (result.type === 'success') {
                          audioDialogOpen = false;
                        }
                      };
                    }}
                    class="space-y-4 pt-2"
                  >
                    <input type="hidden" name="headword_id" value={headword.id} />

                    <div class="space-y-1.5">
                      <Label for="audio-dialect">Dialect Spoken</Label>
                      <select
                        id="audio-dialect"
                        name="dialect_id"
                        bind:value={audioDialectId}
                        class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                      >
                        {#each dialects as dialect (dialect.id)}
                          <option value={dialect.id}>{dialect.name}</option>
                        {/each}
                      </select>
                    </div>

                    <div class="space-y-1.5">
                      <Label>Audio Clip (up to 12 seconds)</Label>
                      <AudioRecorder name="audio" />
                    </div>

                    <div class="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onclick={() => (audioDialogOpen = false)}
                      >
                        {m.common_cancel()}
                      </Button>
                      <Button type="submit" size="sm" disabled={isUploadingAudio}>
                        {isUploadingAudio ? 'Uploading...' : 'Save Pronunciation'}
                      </Button>
                    </div>
                  </form>
                </Dialog.Content>
              </Dialog.Root>
            {:else if !primaryAudioDef?.audio_url}
              <span class="text-muted-foreground inline-flex items-center gap-1.5 rounded-xl border border-dashed px-3 py-1.5 text-xs">
                <Mic class="h-3.5 w-3.5" />
                No audio yet · Sign in to record
              </span>
            {/if}
          </div>

          {#if contributors.length > 0}
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground text-[11px]">{m.word_by()}</span>
              <div class="flex -space-x-1.5">
                {#each contributors as c (c.username)}
                  <a
                    href="/user/{c.username}"
                    title="@{c.username}"
                    class="ring-background inline-block rounded-full ring-2 transition-transform hover:z-10 hover:scale-110"
                  >
                    <Avatar.Root class="bg-muted h-6 w-6 border">
                      <Avatar.Image src={c.avatar_url} />
                      <Avatar.Fallback class="text-[9px] font-bold">
                        {c.username.slice(0, 2).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar.Root>
                  </a>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Lexical Network & Consonantal Root Family Bar -->
      <div class="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
            <Link2 class="text-primary h-3.5 w-3.5" />
            {m.word_related_words()}:
          </span>

          {#if relatedWords.length > 0}
            {#each relatedWords as rel (rel.id)}
              <div class="bg-background/80 hover:bg-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs shadow-2xs transition-colors">
                <a
                  href="/word/{rel.word.slug}"
                  class="text-foreground hover:text-primary font-semibold hover:underline"
                >
                  {rel.word.script_latin}
                </a>
                {#if rel.word.script_tifinagh}
                  <span class="text-primary font-serif">{rel.word.script_tifinagh}</span>
                {/if}
                <Badge variant="secondary" class="h-4 px-1.5 text-[9px]">
                  {RELATION_LABELS[rel.relation_type] ?? rel.relation_type}
                </Badge>

                {#if user}
                  <form method="POST" action="?/deleteWordRelation" use:enhance class="inline-flex">
                    <input type="hidden" name="relation_id" value={rel.id} />
                    <button
                      type="submit"
                      class="text-muted-foreground hover:text-destructive ml-0.5 rounded-full p-0.5 transition-colors"
                      title="Unlink related word"
                    >
                      <X class="h-3 w-3" />
                    </button>
                  </form>
                {/if}
              </div>
            {/each}
          {:else}
            <span class="text-muted-foreground text-xs italic">{m.word_none_linked()}</span>
          {/if}

          {#if user}
            <Dialog.Root bind:open={addRelationOpen}>
              <Dialog.Trigger>
                {#snippet child({ props })}
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-primary hover:text-primary/80 h-6 gap-1 px-2 text-xs font-semibold"
                    {...props}
                  >
                    <Plus class="h-3 w-3" />
                    {m.word_link_word()}
                  </Button>
                {/snippet}
              </Dialog.Trigger>
              <Dialog.Content class="sm:max-w-[440px]">
                <Dialog.Header>
                  <Dialog.Title>{m.word_link_dialog_title()}</Dialog.Title>
                </Dialog.Header>

                <form
                  method="POST"
                  action="?/addWordRelation"
                  use:enhance={() => {
                    return async ({ update }) => {
                      addRelationOpen = false;
                      relationSlug = '';
                      relationSearchResults = [];
                      await update();
                    };
                  }}
                  class="space-y-4 pt-2"
                >
                  <div class="space-y-2">
                    <Label>{m.word_relation_type()}</Label>
                    <select
                      name="relation_type"
                      bind:value={relationType}
                      class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                    >
                      {#each WORD_RELATION_TYPES as rt}
                        <option value={rt.value}>{rt.label}</option>
                      {/each}
                    </select>
                  </div>

                  <div class="space-y-2">
                    <Label>{m.word_target_word()}</Label>
                    <Input
                      name="target_slug"
                      value={relationSlug}
                      oninput={(e) => searchRelatedWord((e.target as HTMLInputElement).value)}
                      placeholder={m.word_target_placeholder()}
                      autocomplete="off"
                      required
                    />

                    {#if relationSearchResults.length > 0}
                      <div class="bg-popover max-h-40 overflow-y-auto rounded-md border p-1 shadow-sm">
                        {#each relationSearchResults as item}
                          <button
                            type="button"
                            onclick={() => {
                              relationSlug = item.slug;
                              relationSearchResults = [];
                            }}
                            class="hover:bg-muted flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-left text-xs"
                          >
                            <span class="font-semibold">{item.headword_text}</span>
                            {#if item.script_tifinagh}
                              <span class="text-muted-foreground font-serif">{item.script_tifinagh}</span>
                            {/if}
                          </button>
                        {/each}
                      </div>
                    {/if}
                  </div>

                  <div class="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onclick={() => (addRelationOpen = false)}
                    >
                      {m.common_cancel()}
                    </Button>
                    <Button type="submit" size="sm" disabled={!relationSlug.trim()}>
                      {m.word_link_word()}
                    </Button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Root>
          {/if}
        </div>

        {#if showTifinaghGuide && tifinaghLetters.length > 0}
          <div class="bg-muted/40 flex flex-wrap items-center gap-1.5 rounded-xl border px-3 py-2.5">
            <span class="text-muted-foreground mr-1 text-[10px] font-bold tracking-wider uppercase">
              Script breakdown:
            </span>
            {#each tifinaghLetters as letter}
              {#if letter.char.trim() === ''}
                <span class="w-2"></span>
              {:else}
                <div class="bg-background inline-flex flex-col items-center rounded-md border px-2 py-1 text-center shadow-2xs">
                  <span class="text-primary font-serif text-base leading-none font-bold">
                    {letter.char}
                  </span>
                  <span class="text-muted-foreground mt-0.5 font-mono text-[10px] leading-none">
                    {letter.isTifinagh ? letter.latin : letter.char}
                  </span>
                </div>
              {/if}
            {/each}
          </div>
        {/if}

        {#if sameRootWords.length > 0 && detectedRoots.length > 0}
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
              {m.word_same_root({ root: detectedRoots[0] })}:
            </span>
            {#each sameRootWords as rw (rw.id)}
              <a
                href="/word/{rw.slug}"
                class="border-primary/20 bg-primary/5 hover:bg-primary/15 inline-flex max-w-[220px] items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors"
                title={rw.meaning ?? rw.script_latin}
              >
                <span class="shrink-0 font-semibold">{rw.script_latin}</span>
                {#if rw.script_tifinagh}
                  <span class="text-primary shrink-0 font-serif text-[11px]">{rw.script_tifinagh}</span>
                {/if}
                {#if rw.meaning}
                  <span class="text-muted-foreground truncate text-[11px]">· {rw.meaning}</span>
                {/if}
              </a>
            {/each}
            <a
              href="/search?q={encodeURIComponent(`root:${detectedRoots[0]}`)}"
              class="text-primary hover:underline ml-1 inline-flex items-center gap-1 text-[11px] font-semibold"
            >
              Explore root <ArrowRight class="h-3 w-3" />
            </a>
          </div>
        {/if}

        {#if meaningCognates.length > 0}
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
              Cross-dialect synonyms & cognates:
            </span>
            {#each meaningCognates as cog (cog.id)}
              <div class="border-border/70 bg-background/80 inline-flex max-w-[260px] items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs">
                <a
                  href="/word/{cog.slug}"
                  class="hover:text-primary inline-flex min-w-0 items-center gap-1.5 transition-colors"
                  title="{cog.meaning}{cog.dialectName ? ` (${cog.dialectName})` : ''}"
                >
                  <span class="shrink-0 font-semibold">{cog.script_latin}</span>
                  {#if cog.script_tifinagh}
                    <span class="text-primary shrink-0 font-serif text-[11px]">{cog.script_tifinagh}</span>
                  {/if}
                  {#if cog.dialectName}
                    <span class="text-muted-foreground truncate text-[10px]">· {cog.dialectName}</span>
                  {/if}
                </a>
                {#if user && headword}
                  <form method="POST" action="?/addWordRelation" use:enhance class="inline-flex">
                    <input type="hidden" name="source_headword_id" value={headword.id} />
                    <input type="hidden" name="target_slug" value={cog.slug} />
                    <input type="hidden" name="relation_type" value="synonym" />
                    <button
                      type="submit"
                      class="text-primary/70 hover:text-primary rounded-full p-0.5 transition-colors"
                      title="Link as cross-dialect synonym"
                    >
                      <Plus class="h-3 w-3" />
                    </button>
                  </form>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Main 2-Column Content Grid -->
    <div class="grid gap-8 md:grid-cols-[1fr_350px] lg:grid-cols-[1fr_400px] lg:gap-10">
      <!-- Left Column: Filter Toolbar + Definitions -->
      <div class="min-w-0 space-y-6">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-2xl font-bold tracking-tight">
              {m.word_definitions_header({ count: filteredDefinitions.length })}
            </h2>

            {#if definitions.length > 1}
              <div class="flex items-center gap-1.5">
                <ArrowUpDown class="text-muted-foreground h-3.5 w-3.5" />
                <select
                  bind:value={sortBy}
                  class="border-input bg-background h-8 rounded-lg border px-2.5 text-xs font-medium"
                >
                  <option value="recommended">{m.word_sort_recommended()}</option>
                  <option value="votes">{m.word_sort_top_voted()}</option>
                  <option value="audio">{m.word_sort_audio()}</option>
                  <option value="newest">{m.word_sort_newest()}</option>
                </select>
              </div>
            {/if}
          </div>

          <!-- Interactive Dialect & Language Pill Filter Bar -->
          {#if definitions.length > 1 && (availableDialects.length > 1 || availableLangs.length > 1)}
            <div class="bg-muted/30 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-2.5">
              {#if availableDialects.length > 1}
                <div class="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onclick={() => (selectedDialectId = 'all')}
                    class="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors {selectedDialectId === 'all'
                      ? 'bg-primary text-primary-foreground shadow-2xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
                  >
                    {m.word_all_dialects()} ({definitions.length})
                  </button>
                  {#each availableDialects as d (d.id)}
                    <button
                      type="button"
                      onclick={() => (selectedDialectId = selectedDialectId === d.id ? 'all' : d.id)}
                      class="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors {selectedDialectId === d.id
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'bg-background/80 text-muted-foreground hover:bg-muted hover:text-foreground border'}"
                    >
                      {d.name} <span class="opacity-70">({d.count})</span>
                    </button>
                  {/each}
                </div>
              {/if}

              {#if availableLangs.length > 1}
                <div class="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onclick={() => (selectedLang = 'all')}
                    class="rounded-md px-2 py-0.5 text-[11px] font-bold uppercase transition-colors {selectedLang === 'all'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:text-foreground'}"
                  >
                    ALL
                  </button>
                  {#each availableLangs as lang (lang)}
                    <button
                      type="button"
                      onclick={() => (selectedLang = selectedLang === lang ? 'all' : lang)}
                      class="rounded-md px-2 py-0.5 text-[11px] font-bold uppercase transition-colors {selectedLang === lang
                        ? 'bg-secondary text-secondary-foreground'
                        : 'text-muted-foreground hover:text-foreground'}"
                    >
                      {lang}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>

        {#if filteredDefinitions.length === 0}
          <Card.Root class="bg-muted/30 border-dashed">
            <Card.Content
              class="text-muted-foreground flex flex-col items-center justify-center py-12 text-center"
            >
              <Globe class="mb-4 h-10 w-10 opacity-50" />
              <p class="text-lg font-medium">{m.word_no_definitions()}</p>
              <p class="text-sm">
                {definitions.length === 0
                  ? m.word_be_first_share({ word: headword.script_latin ?? '' })
                  : m.word_no_filter_match()}
              </p>
            </Card.Content>
          </Card.Root>
        {:else}
          {#each filteredDefinitions as def (def.id)}
            <DefinitionCard
              {def}
              userVote={userVotes?.[def.id]}
              {userExampleVotes}
              {user}
              role={role ?? 'user'}
              {dialects}
            />
          {/each}
        {/if}
      </div>

      <!-- Right Sidebar: Academy Integrations + Add Definition -->
      <div class="min-w-0 space-y-6">
        {#if linkedLessons.length > 0 || relatedCourses.length > 0}
          <Card.Root class="border-primary/20 bg-card shadow-xs">
            <Card.Header class="pb-3">
              <Card.Title class="flex items-center gap-2 text-base">
                <GraduationCap class="text-primary h-5 w-5 shrink-0" />
                <span>{m.word_academy_connections()}</span>
              </Card.Title>
              <Card.Description class="text-xs">
                {m.word_academy_desc()}
              </Card.Description>
            </Card.Header>
            <Card.Content class="space-y-2.5">
              {#each linkedLessons as item (item.lessonId)}
                <a
                  href="/courses/{item.courseSlug}/learn/{item.lessonId}"
                  class="bg-primary/5 hover:bg-primary/10 border-primary/20 group flex items-center justify-between gap-2 rounded-xl border p-3 transition-all"
                >
                  <div class="min-w-0 space-y-0.5">
                    <div class="flex items-center gap-1.5">
                      <Badge variant="default" class="h-4 px-1.5 text-[9px]">Lesson</Badge>
                      <span class="text-muted-foreground truncate text-[11px]">{item.courseTitle}</span>
                    </div>
                    <p class="group-hover:text-primary truncate text-xs font-bold transition-colors">
                      {item.lessonTitle}
                    </p>
                  </div>
                  <ArrowRight class="text-primary h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </a>
              {/each}

              {#each relatedCourses as course (course.id)}
                <a
                  href="/courses/{course.slug}"
                  class="bg-muted/30 hover:bg-muted/60 group flex items-center justify-between gap-2 rounded-xl border p-3 transition-all"
                >
                  <div class="min-w-0 space-y-1">
                    <div class="flex flex-wrap items-center gap-1.5">
                      {#if course.dialectName}
                        <Badge variant="outline" class="h-4 px-1.5 text-[9px]">
                          {course.dialectName}
                        </Badge>
                      {/if}
                      {#if course.difficulty_level}
                        <span class="text-muted-foreground text-[10px] capitalize">
                          {course.difficulty_level}
                        </span>
                      {/if}
                    </div>
                    <p class="group-hover:text-primary truncate text-xs font-semibold transition-colors">
                      {course.title}
                    </p>
                  </div>
                  <ArrowRight class="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </a>
              {/each}
            </Card.Content>
          </Card.Root>
        {/if}

        <div id="add-definition-section">
          <AddDefinitionCard {data} />
        </div>
      </div>
    </div>
  </div>
{/if}
