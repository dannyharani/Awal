<script lang="ts">
  import { enhance } from '$app/forms';
  import type { SubmitFunction } from '@sveltejs/kit';
  import { Button } from '$lib/components/ui/button';
  import { ArrowBigUp, ArrowBigDown } from '@lucide/svelte';

  // 1. Receive data from parent + new orientation prop (defaulting to vertical)
  let { score, definitionId, userVote, orientation = 'vertical' } = $props();

  // 2. Create Local State (Optimistic Truth)
  let optimisticScore = $derived(score);
  let optimisticVote = $derived(userVote);

  // 3. Sync Logic
  $effect(() => {
    optimisticScore = score;
    optimisticVote = userVote;
  });

  // 4. The Optimistic Handler
  const handleVote: SubmitFunction = ({ formData }) => {
    const value = Number(formData.get('value'));
    const previousVote = optimisticVote;

    if (previousVote === value) {
      optimisticVote = null;
      optimisticScore -= value;
    } else if (previousVote) {
      optimisticVote = value;
      optimisticScore += value * 2;
    } else {
      optimisticVote = value;
      optimisticScore += value;
    }

    return async ({ update }) => {
      await update();
    };
  };
</script>

<div
  class={orientation === 'horizontal'
    ? 'flex flex-row items-center gap-3'
    : 'flex flex-col items-center gap-1'}
>
  <form method="POST" action="?/vote" use:enhance={handleVote}>
    <input type="hidden" name="definition_id" value={definitionId} />
    <input type="hidden" name="value" value="1" />
    <Button
      variant="ghost"
      size="icon"
      type="submit"
      class="h-9 w-9 rounded-full transition-colors hover:bg-emerald-100 hover:text-emerald-600 {optimisticVote ===
      1
        ? 'bg-emerald-100 text-emerald-600 ring-1 ring-emerald-600/20'
        : 'text-muted-foreground'}"
    >
      <ArrowBigUp class="h-6 w-6 stroke-[3px]" />
    </Button>
  </form>

  <span
    class="min-w-[1.5rem] text-center font-mono text-sm font-bold select-none
      {optimisticVote === 1
      ? 'text-emerald-600'
      : optimisticVote === -1
        ? 'text-rose-600'
        : 'text-muted-foreground'}"
  >
    {optimisticScore}
  </span>

  <form method="POST" action="?/vote" use:enhance={handleVote}>
    <input type="hidden" name="definition_id" value={definitionId} />
    <input type="hidden" name="value" value="-1" />
    <Button
      variant="ghost"
      size="icon"
      type="submit"
      class="h-9 w-9 rounded-full transition-colors hover:bg-rose-100 hover:text-rose-600 {optimisticVote ===
      -1
        ? 'bg-rose-100 text-rose-600 ring-1 ring-rose-600/20'
        : 'text-muted-foreground'}"
    >
      <ArrowBigDown class="h-6 w-6 stroke-[3px]" />
    </Button>
  </form>
</div>
