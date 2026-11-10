<script lang="ts">
  import { AMAZIGH_SPECIAL_CHARS } from '$lib/utils/amazigh';
  import { Keyboard } from '@lucide/svelte';

  let {
    value = $bindable(''),
    onInsert,
    compact = false
  }: {
    value?: string;
    onInsert?: (char: string) => void;
    compact?: boolean;
  } = $props();

  let uppercase = $state(false);

  function handleInsert(charObj: (typeof AMAZIGH_SPECIAL_CHARS)[number]) {
    const ch = uppercase ? charObj.upper : charObj.char;
    if (onInsert) {
      onInsert(ch);
    } else {
      value = (value ?? '') + ch;
    }
  }
</script>

<div class="bg-muted/40 flex flex-wrap items-center gap-1 rounded-md border px-2 py-1.5">
  {#if !compact}
    <span class="text-muted-foreground mr-1 flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase select-none">
      <Keyboard class="h-3 w-3" />
      Chars:
    </span>
  {/if}

  <button
    type="button"
    onclick={() => (uppercase = !uppercase)}
    class="border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted mr-0.5 rounded border px-1.5 py-0.5 text-[10px] font-bold transition-colors"
    title="Toggle Uppercase / Lowercase"
  >
    {uppercase ? 'ABC' : 'abc'}
  </button>

  {#each AMAZIGH_SPECIAL_CHARS as item (item.char)}
    <button
      type="button"
      onclick={() => handleInsert(item)}
      class="border-border/60 bg-background hover:border-primary/50 hover:bg-primary/10 hover:text-primary flex h-6 min-w-[24px] items-center justify-center rounded border px-1.5 font-mono text-xs font-medium shadow-2xs transition-all active:scale-95"
      title={`${item.hint} · Tifinagh: ${item.tifinagh}`}
    >
      {uppercase ? item.upper : item.char}
    </button>
  {/each}
</div>
