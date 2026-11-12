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

<div class="bg-muted/40 flex flex-wrap items-center gap-1.5 rounded-lg border px-2 py-2 sm:gap-1 sm:py-1.5">
  {#if !compact}
    <span class="text-muted-foreground mr-1 flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase select-none">
      <Keyboard class="h-3 w-3" />
      Chars:
    </span>
  {/if}

  <button
    type="button"
    onclick={() => (uppercase = !uppercase)}
    class="border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted mr-0.5 flex h-9 min-w-[36px] touch-manipulation items-center justify-center rounded-md border px-2 text-[11px] font-bold transition-all active:scale-95 sm:h-7 sm:min-w-[28px] sm:rounded sm:px-1.5 sm:text-[10px]"
    title="Toggle Uppercase / Lowercase"
  >
    {uppercase ? 'ABC' : 'abc'}
  </button>

  {#each AMAZIGH_SPECIAL_CHARS as item (item.char)}
    <button
      type="button"
      onclick={() => handleInsert(item)}
      class="border-border/60 bg-background hover:border-primary/50 hover:bg-primary/10 hover:text-primary flex h-9 min-w-[34px] touch-manipulation items-center justify-center rounded-md border px-2 font-mono text-sm font-semibold shadow-2xs transition-all active:scale-90 sm:h-7 sm:min-w-[26px] sm:rounded sm:px-1.5 sm:text-xs"
      title={`${item.hint} · Tifinagh: ${item.tifinagh}`}
    >
      {uppercase ? item.upper : item.char}
    </button>
  {/each}
</div>
