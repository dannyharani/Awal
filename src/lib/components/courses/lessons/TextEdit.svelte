<script lang="ts">
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import AmazighKeyboardBar from '$lib/components/dictionary/AmazighKeyboardBar.svelte';
  import { Eye, Code, WandSparkles } from '@lucide/svelte';
  import { latinToTifinagh } from '$lib/utils/amazigh';

  let { content = $bindable() } = $props();

  let previewMode = $state(false);

  function insertChar(ch: string) {
    content.markdown = (content.markdown || '') + ch;
  }

  function insertTemplate(snippet: string) {
    content.markdown = (content.markdown ? content.markdown + '\n\n' : '') + snippet;
  }

  function renderSimpleMarkdown(md: string): string {
    if (!md) return '<p class="text-muted-foreground italic">Nothing written yet...</p>';
    return md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-5 mb-2 border-b pb-1">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-extrabold mt-4 mb-3">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/\n\n/g, '</p><p class="my-3 leading-relaxed">')
      .replace(/\n/g, '<br />');
  }
</script>

<div class="flex h-full flex-col space-y-4">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <Label class="text-sm font-semibold">Lesson Reading & Notes (Markdown)</Label>
    </div>

    <div class="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        class="h-7 text-xs"
        onclick={() => insertTemplate('## Section Heading\n\n- **Tamaziɣt** (`ⵜⴰⵎⴰⵣⵉⵖⵜ`) — Meaning')}
      >
        + Vocab List
      </Button>
      <Button
        type="button"
        variant={previewMode ? 'default' : 'outline'}
        size="sm"
        class="h-7 gap-1.5 text-xs"
        onclick={() => (previewMode = !previewMode)}
      >
        {#if previewMode}
          <Code class="h-3.5 w-3.5" /> Edit Markdown
        {:else}
          <Eye class="h-3.5 w-3.5" /> Preview
        {/if}
      </Button>
    </div>
  </div>

  {#if !previewMode}
    <AmazighKeyboardBar onInsert={insertChar} />

    <Textarea
      bind:value={content.markdown}
      class="min-h-[320px] flex-1 resize-y p-4 font-mono text-sm leading-relaxed"
      placeholder="# Welcome to the Lesson&#10;&#10;Write your cultural notes, grammar explanations, and examples here..."
    />
    <p class="text-muted-foreground text-xs">
      Supports Markdown headings (`#`, `##`), bold (`**word**`), italics (`*word*`), inline Tifinagh (`ⵜⴰⵎⴰⵣⵉⵖⵜ`), and bullet lists (`- item`).
    </p>
  {:else}
    <div class="bg-muted/20 prose dark:prose-invert max-w-none min-h-[320px] rounded-lg border p-6 text-sm leading-relaxed">
      {@html renderSimpleMarkdown(content.markdown)}
    </div>
  {/if}
</div>
