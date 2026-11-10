<script lang="ts">
  import { enhance } from '$app/forms';
  import type { SubmitFunction } from '@sveltejs/kit';
  import { Button } from '$lib/components/ui/button';
  import { ArrowBigUp, ArrowBigDown } from '@lucide/svelte';

  interface Props {
    score: number;
    definitionId?: number;
    exampleId?: number;
    userVote?: number | null;
    orientation?: 'vertical' | 'horizontal';
    size?: 'default' | 'sm';
  }

  let {
    score = 0,
    definitionId,
    exampleId,
    userVote = null,
    orientation = 'vertical',
    size = 'default'
  }: Props = $props();

  let optimisticScore = $state(0);
  let optimisticVote = $state<number | null>(null);

  $effect(() => {
    optimisticScore = score ?? 0;
    optimisticVote = userVote ?? null;
  });

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

  let btnClass = $derived(size === 'sm' ? 'h-7 w-7' : 'h-9 w-9');
  let iconClass = $derived(size === 'sm' ? 'h-4 w-4 stroke-[2.5px]' : 'h-6 w-6 stroke-[3px]');
</script>

<div
  class={orientation === 'horizontal'
    ? 'flex flex-row items-center gap-1.5'
    : 'flex flex-col items-center gap-1'}
>
  <form method="POST" action="?/vote" use:enhance={handleVote}>
    {#if definitionId}
      <input type="hidden" name="definition_id" value={definitionId} />
    {/if}
    {#if exampleId}
      <input type="hidden" name="example_id" value={exampleId} />
    {/if}
    <input type="hidden" name="value" value="1" />
    <Button
      variant="ghost"
      size="icon"
      type="submit"
      class="{btnClass} rounded-full transition-colors hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-950/60 {optimisticVote ===
      1
        ? 'bg-emerald-100 text-emerald-600 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60'
        : 'text-muted-foreground'}"
    >
      <ArrowBigUp class={iconClass} />
    </Button>
  </form>

  <span
    class="min-w-[1.25rem] text-center font-mono {size === 'sm'
      ? 'text-xs'
      : 'text-sm'} font-bold select-none
      {optimisticVote === 1
      ? 'text-emerald-600'
      : optimisticVote === -1
        ? 'text-rose-600'
        : 'text-muted-foreground'}"
  >
    {optimisticScore}
  </span>

  <form method="POST" action="?/vote" use:enhance={handleVote}>
    {#if definitionId}
      <input type="hidden" name="definition_id" value={definitionId} />
    {/if}
    {#if exampleId}
      <input type="hidden" name="example_id" value={exampleId} />
    {/if}
    <input type="hidden" name="value" value="-1" />
    <Button
      variant="ghost"
      size="icon"
      type="submit"
      class="{btnClass} rounded-full transition-colors hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/60 {optimisticVote ===
      -1
        ? 'bg-rose-100 text-rose-600 ring-1 ring-rose-600/20 dark:bg-rose-950/60'
        : 'text-muted-foreground'}"
    >
      <ArrowBigDown class={iconClass} />
    </Button>
  </form>
</div>
