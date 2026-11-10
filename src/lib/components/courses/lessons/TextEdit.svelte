<script lang="ts">
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from '$lib/components/ui/label';

  // Svelte 5 Props
  // We accept the whole 'content' object and bind to it
  let { content = $bindable() } = $props();
</script>

<div class="h-full flex flex-col space-y-4">
  <div class="space-y-2 flex-1 flex flex-col">
    <Label>Markdown Content</Label>
    <Textarea
      bind:value={content.markdown}
      class="flex-1 font-mono text-sm leading-relaxed p-6 resize-none"
      placeholder="# Lesson Header&#10;&#10;Write your content here..."
    />
  </div>
  <p class="text-xs text-muted-foreground">Markdown is supported.</p>
</div>
