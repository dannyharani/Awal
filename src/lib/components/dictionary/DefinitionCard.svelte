<script lang="ts">
  import { slide } from 'svelte/transition';
  import { Info, ChevronUp, ChevronDown, ShieldCheck, Play } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Avatar from '$lib/components/ui/avatar';
  import * as Card from '$lib/components/ui/card';
  import VoteButtons from './VoteButtons.svelte';
  import EditDefinitionDialog from '$lib/components/dictionary/EditDefinitionDialog.svelte';
  import { getLocale } from '$lib/paraglide/runtime';

  let { def, userVote, user, dialects } = $props();

  const currentLang = getLocale();

  let attributes = $derived(
    typeof def.attributes === 'string' ? JSON.parse(def.attributes) : def.attributes || {}
  );

  let isExpanded = $state(false);
  let hasAttributes = $derived(Object.keys(attributes).length > 0);
</script>

<Card.Root
  class="group border-border bg-card text-card-foreground hover:border-primary/40 overflow-hidden p-0 transition-all duration-300 hover:shadow-md"
>
  <Card.Header
    class="bg-muted/30 flex flex-row items-start justify-between border-b px-4 py-4 sm:items-center"
  >
    <div class="flex flex-wrap items-center gap-2">
      <Badge
        variant="outline"
        class="border-primary/20 bg-background text-foreground hover:bg-background/90 font-medium whitespace-nowrap"
      >
        {def.dialects?.name ?? 'General'}
      </Badge>

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
          class="flex h-5 w-5 items-center justify-center rounded-full bg-green-600/90 p-0 hover:bg-green-600"
          title={`Verified by ${def.verifier?.username}`}
        >
          <ShieldCheck class="h-3 w-3" />
          <span class="sr-only">Verified by {def.verifier?.username}</span>
        </Badge>
      {/if}

      {#if user?.id === def.user_id}
        <EditDefinitionDialog definition={def} {dialects} />
      {/if}
    </div>

    <div class="text-muted-foreground ml-2 flex shrink-0 items-center gap-2 text-xs">
      <span class="hidden sm:inline">by</span>
      <div class="text-foreground flex items-center gap-1.5 font-medium">
        <Avatar.Root class="bg-background h-5 w-5 border">
          <Avatar.Image src={def.author?.avatar_url} />
          <Avatar.Fallback class="text-[9px]">
            {def.author?.username?.slice(0, 2).toUpperCase() ?? 'U'}
          </Avatar.Fallback>
        </Avatar.Root>
        <span class="max-w-[80px] truncate sm:max-w-none">
          {def.author?.username ?? 'Anonymous'}
        </span>
      </div>
    </div>
  </Card.Header>

  <Card.Content class="bg-card space-y-6">
    {#if def.audio_url}
      <div class="bg-muted/40 mb-4 flex w-fit items-center gap-2 rounded-md border px-3 py-1.5">
        <Button
          variant="ghost"
          size="icon"
          class="bg-primary text-primary-foreground hover:bg-primary/80 h-8 w-8 rounded-full"
        >
          <Play class="text-accent ml-0.5 h-4 w-4" />
        </Button>
        <div class="flex flex-col">
          <span class="text-muted-foreground text-[10px] font-bold uppercase">Pronunciation</span>
          <span class="text-xs font-medium">0:04</span>
          <!-- TODO: get audio length -->
        </div>
      </div>
    {/if}

    <p class="text-foreground font-serif text-xl leading-relaxed">
      {def.definition_text}
    </p>

    {#if def.examples && def.examples.length > 0}
      <div class="border-primary/20 relative border-l-2 pl-4">
        <span
          class="text-muted-foreground mb-2 block text-[10px] font-bold tracking-widest uppercase"
        >
          Context
        </span>

        <div class="space-y-3">
          {#each def.examples as example}
            <div class="group/ex">
              <p class="text-foreground/90 text-base font-medium italic">
                "{example.sentence_text}"
              </p>

              {#if example.translation_text}
                <p
                  class="text-muted-foreground group-hover/ex:text-foreground/80 mt-0.5 text-sm transition-colors"
                >
                  — {example.translation_text}
                </p>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </Card.Content>

  <Card.Footer class="bg-muted/30 m-0 flex flex-col border-t p-0">
    <div class="flex w-full justify-between px-4 pb-4">
      {#if hasAttributes}
        <Button
          variant="ghost"
          size="sm"
          onclick={() => (isExpanded = !isExpanded)}
          class="text-muted-foreground hover:text-foreground h-8 gap-1.5 px-3 text-xs font-medium"
        >
          <Info class="h-3.5 w-3.5" />
          {isExpanded ? 'Hide Details' : 'View Details'}
          {#if isExpanded}
            <ChevronUp />
          {:else}
            <ChevronDown />
          {/if}
        </Button>
      {:else}
        <span class="text-muted-foreground/40 px-3 text-xs italic select-none">
          No extra details
        </span>
      {/if}

      <VoteButtons
        score={def.vote_score}
        definitionId={def.id}
        {userVote}
        orientation="horizontal"
      />
    </div>

    {#if isExpanded && hasAttributes}
      <div transition:slide={{ duration: 200 }} class="w-full px-6 pb-6">
        <h4 class="text-muted-foreground mb-3 text-[10px] font-bold tracking-wider uppercase">
          Linguistic Attributes
        </h4>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {#each Object.entries(attributes) as [key, value]}
            <div
              class="bg-background border-border/50 flex flex-col rounded-md border px-3 py-2 text-sm shadow-sm"
            >
              <span
                class="text-muted-foreground mb-0.5 text-[10px] font-bold tracking-wide uppercase opacity-70"
              >
                {key.replace(/_/g, ' ')}
              </span>
              <span class="text-foreground truncate font-medium capitalize">{value}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </Card.Footer>
</Card.Root>
