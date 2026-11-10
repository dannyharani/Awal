<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from '$lib/components/ui/label';
  import { Video } from '@lucide/svelte';

  let { content = $bindable() } = $props();

  let videoUrl = $derived(content.video_url || content.url || '');

  function getEmbedUrl(url: string): string | null {
    if (!url) return null;
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    return null;
  }

  let embedUrl = $derived(getEmbedUrl(videoUrl));
</script>

<div class="space-y-5">
  <div class="space-y-2">
    <Label>Video Title (Optional)</Label>
    <Input
      bind:value={content.title}
      placeholder="e.g. Pronouncing Emphatic Consonants (ḍ, ṭ, ẓ)"
    />
  </div>

  <div class="space-y-2">
    <Label>Video URL (YouTube, Vimeo, or Direct MP4)</Label>
    <Input
      value={videoUrl}
      oninput={(e) => {
        const val = (e.target as HTMLInputElement).value;
        content.video_url = val;
        content.url = val;
      }}
      placeholder="https://www.youtube.com/watch?v=..."
    />
  </div>

  {#if videoUrl}
    <div class="bg-muted/30 overflow-hidden rounded-xl border">
      {#if embedUrl}
        <iframe
          src={embedUrl}
          title={content.title || 'Lesson Video'}
          class="aspect-video w-full"
          allowfullscreen
        ></iframe>
      {:else}
        <!-- svelte-ignore a11y_media_has_caption -->
        <video src={videoUrl} controls class="aspect-video w-full bg-black"></video>
      {/if}
    </div>
  {:else}
    <div
      class="bg-muted/20 text-muted-foreground flex aspect-video flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center"
    >
      <Video class="mb-2 h-8 w-8 opacity-40" />
      <p class="text-sm font-medium">Paste a video URL above to preview the player</p>
    </div>
  {/if}

  <div class="space-y-2">
    <Label>Transcript / Study Notes (Optional)</Label>
    <Textarea
      bind:value={content.notes}
      placeholder="Add key timestamps, dialogue transcript, or listening notes..."
      class="min-h-[110px]"
    />
  </div>
</div>
