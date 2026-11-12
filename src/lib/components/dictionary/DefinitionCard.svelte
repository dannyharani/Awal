<script lang="ts">
  import { enhance } from '$app/forms';
  import { slide } from 'svelte/transition';
  import {
    Info,
    ChevronUp,
    ChevronDown,
    ShieldCheck,
    MessageSquare,
    Plus,
    Trash2
  } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Avatar from '$lib/components/ui/avatar';
  import * as Card from '$lib/components/ui/card';
  import VoteButtons from './VoteButtons.svelte';
  import AudioPlayer from './AudioPlayer.svelte';
  import DefinitionComments from './DefinitionComments.svelte';
  import AmazighKeyboardBar from './AmazighKeyboardBar.svelte';
  import EditDefinitionDialog from '$lib/components/dictionary/EditDefinitionDialog.svelte';
  import { isSystemUsername } from '$lib/constants';
  import { getLocale } from '$lib/paraglide/runtime';
  import * as m from '$lib/paraglide/messages.js';

  let {
    def,
    userVote,
    userExampleVotes = {},
    user,
    role = 'user',
    dialects
  } = $props();

  const currentLang = getLocale();

  let attributes = $derived(
    typeof def.attributes === 'string' ? JSON.parse(def.attributes) : def.attributes || {}
  );

  let isExpanded = $state(false);
  let showComments = $state(false);
  let showAddExample = $state(false);
  let newExampleSentence = $state('');
  let newExampleTranslation = $state('');
  let isAddingExample = $state(false);

  const INTERNAL_ATTR_KEYS = new Set(['root_estimated', 'source']);
  let displayAttributes = $derived(
    Object.entries(attributes).filter(
      ([key, value]) =>
        !INTERNAL_ATTR_KEYS.has(key) &&
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
    )
  );
  let hasAttributes = $derived(displayAttributes.length > 0);
  let isDglaiImport = $derived(
    attributes.source === 'dglai' || isSystemUsername(def.author?.username)
  );
  let canModerate = $derived(
    role === 'admin' || role === 'moderator' || role === 'instructor'
  );
  let canEdit = $derived(
    Boolean(user && (user.id === def.user_id || canModerate))
  );

  let attrLabels = $derived<Record<string, string>>({
    part_of_speech: m.word_part_of_speech(),
    gender: m.word_gender(),
    grammatical_number: m.word_number(),
    construct_state: m.word_construct_state(),
    plural: m.word_plural_form(),
    root: m.word_consonantal_root(),
    verb_stems: m.word_verb_stems()
  });

  function tokenizeSentence(sentence: string): Array<{ text: string; slug: string | null }> {
    if (!sentence) return [];
    const parts = sentence.split(/([\p{L}\p{M}-]+)/gu);
    return parts.filter(Boolean).map((part) => {
      if (/^[\p{L}\p{M}-]+$/u.test(part) && part.length >= 2) {
        const cleanSlug = part.toLowerCase().replace(/^-+|-+$/g, '');
        return { text: part, slug: cleanSlug || null };
      }
      return { text: part, slug: null };
    });
  }
</script>

<Card.Root
  class="group border-border bg-card text-card-foreground hover:border-primary/40 gap-0 overflow-hidden p-0 transition-all duration-300 hover:shadow-md"
>
  <Card.Header
    class="bg-muted/30 flex flex-row flex-wrap items-center justify-between gap-2 border-b px-4 py-3.5"
  >
    <div class="flex flex-wrap items-center gap-2">
      <Badge
        variant="outline"
        class="border-primary/20 bg-background text-foreground hover:bg-background/90 font-medium whitespace-nowrap"
      >
        {def.dialects?.name ?? 'General'}
      </Badge>

      {#if attributes.part_of_speech}
        <Badge variant="secondary" class="font-serif text-xs italic capitalize">
          {attributes.part_of_speech}
          {#if attributes.gender === 'masculine'}
            <span class="text-muted-foreground ml-1 not-italic">(m.)</span>
          {:else if attributes.gender === 'feminine'}
            <span class="text-muted-foreground ml-1 not-italic">(f.)</span>
          {/if}
        </Badge>
      {/if}

      {#if def.language_code && def.language_code !== currentLang}
        <Badge
          variant="secondary"
          class="text-muted-foreground h-5 px-1.5 text-[10px] font-bold tracking-wider uppercase"
          title={`Definition written in ${def.language_code.toUpperCase()}`}
        >
          {def.language_code}
        </Badge>
      {/if}

      {#if def.is_verified}
        <Badge
          variant="default"
          class="flex items-center gap-1 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] text-white hover:bg-emerald-600"
          title={def.verifier?.username
            ? `Verified by ${def.verifier.username}`
            : 'Verified entry'}
        >
          <ShieldCheck class="h-3 w-3" />
          <span>{m.word_verified()}</span>
        </Badge>
      {/if}

      {#if canModerate}
        <form method="POST" action="?/verifyDefinition" use:enhance>
          <input type="hidden" name="definition_id" value={def.id} />
          <input
            type="hidden"
            name="is_verified"
            value={def.is_verified ? 'false' : 'true'}
          />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            class="h-6 gap-1 px-2 text-[11px] {def.is_verified
              ? 'text-muted-foreground hover:text-destructive'
              : 'text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700'}"
            title={def.is_verified ? 'Remove verification badge' : 'Verify this definition'}
          >
            <ShieldCheck class="h-3.5 w-3.5" />
            {def.is_verified ? m.word_unverify() : m.word_verify()}
          </Button>
        </form>
      {/if}

      {#if canEdit}
        <EditDefinitionDialog definition={def} {dialects} />
      {/if}
    </div>

    <div class="text-muted-foreground ml-auto flex shrink-0 items-center gap-2 text-xs">
      {#if isDglaiImport}
        <Badge
          variant="outline"
          class="border-amber-500/30 bg-amber-500/5 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400"
          title="Imported from IRCAM DGLAI lexicon"
        >
          IRCAM DGLAI
        </Badge>
      {:else}
        <span class="hidden sm:inline">{m.word_by()}</span>
        {#if def.author?.username}
          <a
            href="/user/{def.author.username}"
            class="text-foreground hover:text-primary flex items-center gap-1.5 font-medium transition-colors"
          >
            <Avatar.Root class="bg-background h-5 w-5 border">
              <Avatar.Image src={def.author?.avatar_url} />
              <Avatar.Fallback class="text-[9px]">
                {def.author.username.slice(0, 2).toUpperCase()}
              </Avatar.Fallback>
            </Avatar.Root>
            <span class="max-w-[110px] truncate hover:underline sm:max-w-none">
              {def.author.username}
            </span>
          </a>
          {#if def.author?.role && def.author.role !== 'user'}
            <Badge variant="outline" class="h-4 px-1.5 text-[9px] capitalize">
              {def.author.role}
            </Badge>
          {/if}
        {:else}
          <div class="text-foreground flex items-center gap-1.5 font-medium">
            <Avatar.Root class="bg-background h-5 w-5 border">
              <Avatar.Fallback class="text-[9px]">U</Avatar.Fallback>
            </Avatar.Root>
            <span>{m.word_anonymous()}</span>
          </div>
        {/if}
      {/if}
    </div>
  </Card.Header>

  <Card.Content class="bg-card space-y-4 py-4 sm:space-y-5 sm:py-5">
    {#if def.audio_url}
      <div>
        <AudioPlayer src={def.audio_url} />
      </div>
    {/if}

    <p class="text-foreground font-serif text-xl leading-relaxed">
      {def.definition_text}
    </p>

    <!-- Quick Morphology Pills (Construct State, Plural, Root, Verb Stems) -->
    {#if attributes.construct_state || attributes.plural || attributes.root || attributes.verb_stems}
      <div class="flex flex-wrap items-center gap-2 pt-1">
        {#if attributes.construct_state}
          <div class="bg-muted/50 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs">
            <span class="text-muted-foreground font-medium">{m.word_attr_construct()}</span>
            <span class="text-foreground font-semibold">{attributes.construct_state}</span>
          </div>
        {/if}
        {#if attributes.plural}
          <div class="bg-muted/50 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs">
            <span class="text-muted-foreground font-medium">{m.word_attr_plural()}</span>
            <span class="text-foreground font-semibold">{attributes.plural}</span>
          </div>
        {/if}
        {#if attributes.root}
          <a
            href="/search?q={encodeURIComponent(`root:${attributes.root}`)}"
            class="bg-muted/50 hover:border-primary/40 hover:bg-primary/10 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors"
            title="Search words sharing root {attributes.root}"
          >
            <span class="text-muted-foreground font-medium">{m.word_attr_root()}</span>
            <span class="text-primary font-mono font-bold tracking-wider uppercase">{attributes.root}</span>
            {#if attributes.root_estimated}
              <span class="text-muted-foreground text-[10px]" title="Algorithmically estimated root">(est.)</span>
            {/if}
          </a>
        {/if}
        {#if attributes.verb_stems}
          <div class="bg-muted/50 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs">
            <span class="text-muted-foreground font-medium">{m.word_attr_stems()}</span>
            <span class="text-foreground font-semibold">{attributes.verb_stems}</span>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Examples Section -->
    {#if (def.examples && def.examples.length > 0) || user}
      <div class="border-primary/20 relative space-y-3 border-l-2 pl-4">
        <div class="flex items-center justify-between">
          <span
            class="text-muted-foreground block text-[10px] font-bold tracking-widest uppercase"
          >
            {m.word_examples_in_context({ count: def.examples?.length ?? 0 })}
          </span>

          {#if user}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="text-primary hover:text-primary/80 h-6 gap-1 px-2 text-xs"
              onclick={() => (showAddExample = !showAddExample)}
            >
              <Plus class="h-3 w-3" />
              {showAddExample ? m.common_cancel() : m.word_add_example()}
            </Button>
          {/if}
        </div>

        {#if def.examples && def.examples.length > 0}
          <div class="space-y-3">
            {#each def.examples as example (example.id)}
              <div class="group/ex bg-muted/20 hover:bg-muted/30 flex flex-col justify-between gap-2.5 rounded-lg border border-transparent hover:border-border/50 p-3 transition-colors sm:flex-row sm:items-start sm:gap-3">
                <div class="min-w-0 space-y-1">
                  <p class="text-foreground/95 break-words text-base font-medium italic leading-relaxed">
                    "{#each tokenizeSentence(example.sentence_text) as token}{#if token.slug}<a
                          href="/word/{encodeURIComponent(token.slug)}"
                          title={m.word_click_word_hint()}
                          class="hover:text-primary decoration-primary/40 hover:decoration-primary rounded-xs transition-colors hover:underline decoration-dotted underline-offset-4"
                          >{token.text}</a
                        >{:else}{token.text}{/if}{/each}"
                  </p>

                  {#if example.translation_text}
                    <p class="text-muted-foreground break-words text-sm">
                      — {example.translation_text}
                    </p>
                  {/if}

                  {#if example.author?.username && !isSystemUsername(example.author.username)}
                    <p class="text-muted-foreground/70 text-[10px]">
                      {m.word_added_by()} <a
                        href="/user/{example.author.username}"
                        class="hover:text-foreground hover:underline"
                        >{example.author.username}</a
                      >
                    </p>
                  {/if}
                </div>

                <div class="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                  <VoteButtons
                    score={example.vote_score ?? 0}
                    exampleId={example.id}
                    userVote={userExampleVotes?.[example.id] ?? null}
                    orientation="horizontal"
                    size="sm"
                  />

                  {#if user && (user.id === example.user_id || role === 'admin' || role === 'moderator')}
                    <form method="POST" action="?/deleteExample" use:enhance>
                      <input type="hidden" name="example_id" value={example.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        class="text-muted-foreground hover:text-destructive h-7 w-7 opacity-60 hover:opacity-100"
                        title="Delete example"
                      >
                        <Trash2 class="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-muted-foreground text-xs italic">
            {m.word_no_examples()}
          </p>
        {/if}

        {#if showAddExample && user}
          <form
            method="POST"
            action="?/addExample"
            use:enhance={() => {
              isAddingExample = true;
              return async ({ update }) => {
                isAddingExample = false;
                newExampleSentence = '';
                newExampleTranslation = '';
                showAddExample = false;
                await update();
              };
            }}
            class="bg-muted/30 space-y-2.5 rounded-lg border p-3"
          >
            <input type="hidden" name="definition_id" value={def.id} />
            <div class="space-y-1.5">
              <AmazighKeyboardBar
                onInsert={(ch) => {
                  newExampleSentence += ch;
                }}
              />
              <Input
                name="sentence"
                bind:value={newExampleSentence}
                placeholder={m.word_example_placeholder()}
                class="h-8 text-xs"
                required
              />
            </div>
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                name="translation"
                bind:value={newExampleTranslation}
                placeholder={m.word_translation_placeholder()}
                class="h-8 flex-1 text-xs"
              />
              <Button
                type="submit"
                size="sm"
                class="h-8 w-full px-3 text-xs sm:w-auto"
                disabled={isAddingExample || !newExampleSentence.trim()}
              >
                {isAddingExample ? m.word_saving() : m.word_save_example()}
              </Button>
            </div>
          </form>
        {/if}
      </div>
    {/if}
  </Card.Content>

  <Card.Footer class="bg-muted/30 m-0 flex flex-col border-t p-0">
    <div class="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3">
      <div class="flex items-center gap-2">
        {#if hasAttributes}
          <Button
            variant="ghost"
            size="sm"
            onclick={() => (isExpanded = !isExpanded)}
            class="text-muted-foreground hover:text-foreground h-8 gap-1.5 px-3 text-xs font-medium"
          >
            <Info class="h-3.5 w-3.5" />
            {isExpanded ? m.word_hide_morphology() : m.word_morphology()}
            {#if isExpanded}
              <ChevronUp class="h-3.5 w-3.5" />
            {:else}
              <ChevronDown class="h-3.5 w-3.5" />
            {/if}
          </Button>
        {/if}

        <Button
          variant="ghost"
          size="sm"
          onclick={() => (showComments = !showComments)}
          class="text-muted-foreground hover:text-foreground h-8 gap-1.5 px-3 text-xs font-medium {showComments
            ? 'bg-muted text-foreground'
            : ''}"
        >
          <MessageSquare class="h-3.5 w-3.5" />
          {m.word_discussion({ count: def.comments?.length ?? 0 })}
        </Button>
      </div>

      <VoteButtons
        score={def.vote_score}
        definitionId={def.id}
        {userVote}
        orientation="horizontal"
      />
    </div>

    {#if isExpanded && hasAttributes}
      <div transition:slide={{ duration: 200 }} class="border-border/60 w-full border-t px-4 py-4 sm:px-6">
        <h4 class="text-muted-foreground mb-3 text-[10px] font-bold tracking-wider uppercase">
          {m.word_morphology_title()}
        </h4>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {#each displayAttributes as [key, value]}
            <div
              class="bg-background border-border/50 flex flex-col rounded-md border px-3 py-2 text-sm shadow-sm"
            >
              <span
                class="text-muted-foreground mb-0.5 text-[10px] font-bold tracking-wide uppercase opacity-70"
              >
                {attrLabels[key] ?? key.replace(/_/g, ' ')}
              </span>
              <span class="text-foreground break-words font-medium">
                {value}
                {#if key === 'root' && attributes.root_estimated}
                  <span class="text-muted-foreground ml-1 text-xs font-normal">(est.)</span>
                {/if}
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if showComments}
      <div transition:slide={{ duration: 200 }} class="w-full">
        <DefinitionComments
          definitionId={def.id}
          comments={def.comments ?? []}
          {user}
          {role}
        />
      </div>
    {/if}
  </Card.Footer>
</Card.Root>
