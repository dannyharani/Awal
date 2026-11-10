<script lang="ts">
  import AddDefinitionCard from '$lib/components/dictionary/AddDefinitionCard.svelte';
  import DefinitionCard from '$lib/components/dictionary/DefinitionCard.svelte';
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import { latinToTifinagh, WORD_RELATION_TYPES } from '$lib/utils/amazigh';
  import * as m from '$lib/paraglide/messages.js';

  // UI Components
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
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
    Filter
  } from '@lucide/svelte';

  let { data } = $props();
  let {
    headword,
    definitions,
    dialects,
    relatedWords = [],
    userVotes,
    userExampleVotes,
    role
  } = $derived(data);
  let { user, supabase } = $derived(page.data);

  // Edit scripts dialog state
  let editScriptsOpen = $state(false);
  let tifinaghInput = $state('');
  let arabicInput = $state('');

  function openEditScripts() {
    tifinaghInput = headword.script_tifinagh ?? '';
    arabicInput = headword.script_arabic ?? '';
    editScriptsOpen = true;
  }

  function autoFillTifinagh() {
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

  // Filter definitions state
  let selectedDialectId = $state<number | 'all'>('all');
  let selectedLang = $state<string>('all');

  let availableDialects = $derived.by(() => {
    const map = new Map<number, string>();
    for (const def of definitions) {
      if (def.dialect_id && def.dialects?.name) {
        map.set(def.dialect_id, def.dialects.name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  });

  let availableLangs = $derived.by(() => {
    const set = new Set<string>();
    for (const def of definitions) {
      if (def.language_code) set.add(def.language_code);
    }
    return Array.from(set);
  });

  let filteredDefinitions = $derived(
    definitions.filter((def: { dialect_id: number | null; language_code: string | null }) => {
      if (selectedDialectId !== 'all' && def.dialect_id !== selectedDialectId) return false;
      if (selectedLang !== 'all' && def.language_code !== selectedLang) return false;
      return true;
    })
  );

  const RELATION_LABELS: Record<string, string> = {
    variant: 'Dialect Variant',
    synonym: 'Synonym',
    antonym: 'Antonym',
    derived: 'Derived Form'
  };
</script>

<div class="mx-auto max-w-7xl px-4 py-10">
  <!-- Headword Header -->
  <div class="mb-8 space-y-4">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:gap-6">
        <h1 class="text-foreground text-5xl font-extrabold tracking-tight lg:text-6xl">
          {headword.script_latin}
        </h1>
        <div class="text-muted-foreground flex flex-wrap items-center gap-4">
          {#if headword.script_tifinagh}
            <span class="text-primary/90 font-serif text-3xl" title="Neo-Tifinagh script">
              {headword.script_tifinagh}
            </span>
          {:else}
            <span class="text-muted-foreground/50 text-sm italic">No Tifinagh script yet</span>
          {/if}

          {#if headword.script_arabic}
            <Separator orientation="vertical" class="h-6" />
            <span class="text-2xl" dir="rtl" title="Arabic script">
              {headword.script_arabic}
            </span>
          {/if}

          {#if user}
            <Dialog.Root bind:open={editScriptsOpen}>
              <Dialog.Trigger>
                {#snippet child({ props })}
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-7 gap-1.5 px-2.5 text-xs"
                    onclick={openEditScripts}
                    {...props}
                  >
                    <Pencil class="h-3 w-3" />
                    {m.word_edit_scripts()}
                  </Button>
                {/snippet}
              </Dialog.Trigger>
              <Dialog.Content class="sm:max-w-[440px]">
                <Dialog.Header>
                  <Dialog.Title>Update Scripts for "{headword.script_latin}"</Dialog.Title>
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
                      <Label for="edit-tifinagh">Tifinagh Script (Neo-Tifinagh)</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onclick={autoFillTifinagh}
                        class="text-primary h-6 gap-1 px-2 text-xs"
                      >
                        <WandSparkles class="h-3 w-3" />
                        Auto-transliterate
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
                    <Label for="edit-arabic">Arabic Script</Label>
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
      </div>
    </div>

    <!-- Cross-Dialect Variants & Related Words Bar -->
    <div class="flex flex-wrap items-center gap-2 pt-2">
      <span class="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
        <Link2 class="h-3.5 w-3.5" />
        {m.word_related_words()}:
      </span>

      {#if relatedWords.length > 0}
        {#each relatedWords as rel (rel.id)}
          <div class="bg-muted/40 hover:bg-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors">
            <a
              href="/word/{rel.word.slug}"
              class="text-foreground hover:text-primary font-semibold hover:underline"
            >
              {rel.word.script_latin}
            </a>
            {#if rel.word.script_tifinagh}
              <span class="text-muted-foreground font-serif">{rel.word.script_tifinagh}</span>
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
        <span class="text-muted-foreground text-xs italic">None linked yet</span>
      {/if}

      {#if user}
        <Dialog.Root bind:open={addRelationOpen}>
          <Dialog.Trigger>
            {#snippet child({ props })}
              <Button
                variant="ghost"
                size="sm"
                class="text-primary hover:text-primary/80 h-6 gap-1 px-2 text-xs"
                {...props}
              >
                <Plus class="h-3 w-3" />
                Link Word
              </Button>
            {/snippet}
          </Dialog.Trigger>
          <Dialog.Content class="sm:max-w-[440px]">
            <Dialog.Header>
              <Dialog.Title>Link Related or Cross-Dialect Word</Dialog.Title>
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
                <Label>Relation Type</Label>
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
                <Label>Target Word</Label>
                <Input
                  name="target_slug"
                  value={relationSlug}
                  oninput={(e) => searchRelatedWord((e.target as HTMLInputElement).value)}
                  placeholder="Type a word in the dictionary (e.g. aydi, tafukt)..."
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
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={!relationSlug.trim()}>
                  Link Word
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Root>
      {/if}
    </div>
  </div>

  <div class="grid gap-8 md:grid-cols-[1fr_350px] lg:grid-cols-[1fr_400px] lg:gap-12">
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <h2 class="text-2xl font-semibold tracking-tight">{m.word_definitions_header({ count: filteredDefinitions.length })}</h2>
        </div>

        <!-- Dialect & Language Filter Bar -->
        {#if definitions.length > 1 && (availableDialects.length > 1 || availableLangs.length > 1)}
          <div class="flex flex-wrap items-center gap-2">
            <Filter class="text-muted-foreground h-3.5 w-3.5" />
            {#if availableDialects.length > 1}
              <select
                bind:value={selectedDialectId}
                class="border-input bg-background h-8 rounded-md border px-2.5 text-xs"
              >
                <option value="all">{m.word_all_dialects()} ({definitions.length})</option>
                {#each availableDialects as d}
                  <option value={d.id}>{d.name}</option>
                {/each}
              </select>
            {/if}

            {#if availableLangs.length > 1}
              <select
                bind:value={selectedLang}
                class="border-input bg-background h-8 rounded-md border px-2.5 text-xs uppercase"
              >
                <option value="all">{m.word_all_languages()} ({definitions.length})</option>
                {#each availableLangs as lang}
                  <option value={lang}>{lang.toUpperCase()}</option>
                {/each}
              </select>
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
            <p class="text-lg font-medium">No definitions found</p>
            <p class="text-sm">
              {definitions.length === 0
                ? `Be the first to share what "${headword.script_latin}" means.`
                : 'No entries match your active dialect or language filter.'}
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

    <AddDefinitionCard {data} />
  </div>
</div>
