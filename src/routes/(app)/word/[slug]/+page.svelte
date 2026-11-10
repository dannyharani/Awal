<script lang="ts">
  import AddDefinitionCard from '../../../../lib/components/dictionary/AddDefinitionCard.svelte';

  import { page } from '$app/state';

  // UI Components
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Separator } from '$lib/components/ui/separator';
  import { Globe } from '@lucide/svelte';
  import DefinitionCard from '$lib/components/dictionary/DefinitionCard.svelte';

  let { data } = $props();
  let { headword, definitions, dialects, userVotes } = $derived(data);
  let { user } = $derived(page.data);
</script>

<!-- TODO: Add option to modify headword (amazigh script and arabic spelling). -->

<div class="mx-auto max-w-7xl px-4 py-12">
  <div class="mb-10 space-y-4">
    <div class="flex flex-col gap-2 md:flex-row md:items-end md:gap-6">
      <h1 class="text-foreground text-5xl font-extrabold tracking-tight lg:text-6xl">
        {headword.script_latin}
      </h1>
      <div class="text-muted-foreground flex h-7 items-center gap-4">
        <span class="text-primary/80 font-serif text-3xl">{headword.script_tifinagh}</span>
        <Separator orientation="vertical" class="h-6" />
        <span class="text-2xl" dir="rtl">{headword.script_arabic}</span>
      </div>
    </div>
  </div>

  <div class="grid gap-8 md:grid-cols-[1fr_350px] lg:grid-cols-[1fr_400px] lg:gap-12">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-semibold tracking-tight">Definitions</h2>
        <Badge variant="outline" class="rounded-full px-3">{definitions.length} Entries</Badge>
      </div>

      {#if definitions.length === 0}
        <Card.Root class="bg-muted/30 border-dashed">
          <Card.Content
            class="text-muted-foreground flex flex-col items-center justify-center py-12 text-center"
          >
            <Globe class="mb-4 h-10 w-10 opacity-50" />
            <p class="text-lg font-medium">No definitions found</p>
            <p class="text-sm">Be the first to share what "{headword.script_latin}" means.</p>
          </Card.Content>
        </Card.Root>
      {:else}
        {#each definitions as def}
          <DefinitionCard {def} userVote={userVotes?.[def.id]} {user} {dialects} />
        {/each}
      {/if}
    </div>

    <AddDefinitionCard {data} />
  </div>
</div>
