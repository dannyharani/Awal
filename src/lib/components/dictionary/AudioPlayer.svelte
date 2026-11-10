<script lang="ts">
  import { Play, Pause, Volume2 } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';

  let { src, label = 'Pronunciation' }: { src: string; label?: string } = $props();

  let audioEl: HTMLAudioElement | undefined = $state();
  let isPlaying = $state(false);
  let duration = $state(0);
  let currentTime = $state(0);
  let hasError = $state(false);

  function formatSeconds(sec: number): string {
    if (!isFinite(sec) || sec <= 0) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.max(1, Math.round(sec % 60));
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async function togglePlay() {
    if (!audioEl || hasError) return;
    try {
      if (isPlaying) {
        audioEl.pause();
      } else {
        await audioEl.play();
      }
    } catch (err) {
      console.error('Audio playback error:', err);
      hasError = true;
    }
  }

  let progressPercent = $derived(duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0);
</script>

<audio
  bind:this={audioEl}
  {src}
  preload="metadata"
  onloadedmetadata={() => {
    if (audioEl && isFinite(audioEl.duration)) {
      duration = audioEl.duration;
    }
  }}
  ontimeupdate={() => {
    if (audioEl) {
      currentTime = audioEl.currentTime;
    }
  }}
  onplay={() => (isPlaying = true)}
  onpause={() => (isPlaying = false)}
  onended={() => {
    isPlaying = false;
    currentTime = 0;
  }}
  onerror={() => (hasError = true)}
  class="hidden"
></audio>

<div class="bg-muted/40 border-border/80 inline-flex items-center gap-3 rounded-full border py-1.5 pr-4 pl-2 shadow-2xs transition-colors hover:border-primary/40">
  <Button
    type="button"
    variant="ghost"
    size="icon"
    onclick={togglePlay}
    disabled={hasError}
    class="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground h-8 w-8 shrink-0 rounded-full shadow-xs"
    title={isPlaying ? 'Pause pronunciation' : 'Play pronunciation'}
  >
    {#if isPlaying}
      <Pause class="h-3.5 w-3.5 fill-current" />
    {:else}
      <Play class="ml-0.5 h-3.5 w-3.5 fill-current" />
    {/if}
  </Button>

  <div class="flex min-w-[96px] max-w-[180px] flex-col gap-1 sm:min-w-[110px] sm:max-w-[220px]">
    <div class="flex items-center justify-between gap-2">
      <span class="text-muted-foreground flex min-w-0 items-center gap-1 text-[10px] font-bold tracking-wider uppercase">
        <Volume2 class="h-3 w-3 shrink-0" />
        <span class="truncate">{label}</span>
      </span>
      <span class="text-foreground shrink-0 font-mono text-[11px] font-medium">
        {isPlaying ? formatSeconds(currentTime) : duration > 0 ? formatSeconds(duration) : 'Play'}
      </span>
    </div>

    <div class="bg-muted h-1.5 w-full overflow-hidden rounded-full">
      <div
        class="bg-primary h-full rounded-full transition-all duration-100"
        style={`width: ${isPlaying ? Math.max(8, progressPercent) : duration > 0 ? 100 : 0}%; opacity: ${isPlaying ? 1 : 0.35};`}
      ></div>
    </div>
  </div>
</div>
