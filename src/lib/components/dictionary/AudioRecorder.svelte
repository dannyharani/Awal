<script lang="ts">
  import { Mic, Square, RotateCcw, Upload, CircleAlert } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import AudioPlayer from './AudioPlayer.svelte';

  let { name = 'audio', onFileChange }: { name?: string; onFileChange?: (file: File | undefined) => void } = $props();

  let fileInput: HTMLInputElement | undefined = $state();
  let isRecording = $state(false);
  let recordingSeconds = $state(0);
  let recordedUrl = $state<string | null>(null);
  let fileName = $state<string | null>(null);
  let errorMsg = $state<string | null>(null);
  let mode = $state<'record' | 'upload'>('record');

  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  const MAX_SECONDS = 12;

  function assignFileToInput(file: File | undefined) {
    if (!fileInput) return;
    const dt = new DataTransfer();
    if (file) {
      dt.items.add(file);
    }
    fileInput.files = dt.files;
    onFileChange?.(file);
  }

  async function startRecording() {
    errorMsg = null;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      errorMsg = 'Microphone recording is not supported in this browser.';
      mode = 'upload';
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';

      mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (timerInterval) clearInterval(timerInterval);
        isRecording = false;

        const blobType = mediaRecorder?.mimeType || 'audio/webm';
        const ext = blobType.includes('mp4') ? 'm4a' : 'webm';
        const blob = new Blob(audioChunks, { type: blobType });

        if (blob.size > 500 * 1024) {
          errorMsg = 'Recording exceeds 500KB limit. Please record a shorter clip.';
          return;
        }

        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        recordedUrl = URL.createObjectURL(blob);

        const file = new File([blob], `pronunciation_${Date.now()}.${ext}`, { type: blobType });
        fileName = file.name;
        assignFileToInput(file);
      };

      recordingSeconds = 0;
      isRecording = true;
      mediaRecorder.start();

      timerInterval = setInterval(() => {
        recordingSeconds += 1;
        if (recordingSeconds >= MAX_SECONDS) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      console.error('Mic access error:', err);
      errorMsg = 'Could not access microphone. Check browser permissions or upload a file.';
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }

  function clearRecording() {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      recordedUrl = null;
    }
    fileName = null;
    errorMsg = null;
    recordingSeconds = 0;
    assignFileToInput(undefined);
  }

  function handleManualFileSelect(e: Event) {
    errorMsg = null;
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      clearRecording();
      return;
    }
    if (file.size > 500 * 1024) {
      errorMsg = 'Audio file must be under 500KB.';
      clearRecording();
      return;
    }
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    recordedUrl = URL.createObjectURL(file);
    fileName = file.name;
    onFileChange?.(file);
  }
</script>

<div class="space-y-2.5">
  <div class="flex items-center justify-between">
    <span class="text-foreground flex items-center gap-1.5 text-xs font-medium">
      <Mic class="text-primary h-3.5 w-3.5" />
      Pronunciation Audio
    </span>

    <div class="bg-muted inline-flex rounded-md p-0.5 text-[11px]">
      <button
        type="button"
        onclick={() => (mode = 'record')}
        class="rounded px-2 py-0.5 font-medium transition-colors {mode === 'record'
          ? 'bg-background text-foreground shadow-2xs'
          : 'text-muted-foreground hover:text-foreground'}"
      >
        Record Mic
      </button>
      <button
        type="button"
        onclick={() => (mode = 'upload')}
        class="rounded px-2 py-0.5 font-medium transition-colors {mode === 'upload'
          ? 'bg-background text-foreground shadow-2xs'
          : 'text-muted-foreground hover:text-foreground'}"
      >
        Upload File
      </button>
    </div>
  </div>

  <!-- Hidden or active file input submitted with the form -->
  <input
    bind:this={fileInput}
    type="file"
    {name}
    accept="audio/*"
    onchange={handleManualFileSelect}
    class={mode === 'upload' && !recordedUrl
      ? 'border-input bg-background text-muted-foreground file:text-foreground flex w-full rounded-md border px-3 py-2 text-xs file:mr-2 file:border-0 file:bg-transparent file:text-xs file:font-semibold'
      : 'hidden'}
  />

  {#if recordedUrl}
    <div class="bg-background flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5">
      <AudioPlayer src={recordedUrl} label="Preview" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onclick={clearRecording}
        class="text-muted-foreground hover:text-destructive h-7 gap-1 px-2 text-xs"
      >
        <RotateCcw class="h-3 w-3" />
        Redo
      </Button>
    </div>
  {:else if mode === 'record'}
    <div class="bg-background/80 flex items-center justify-between rounded-lg border p-2.5">
      {#if isRecording}
        <div class="flex items-center gap-2.5">
          <span class="relative flex h-3 w-3">
            <span class="bg-destructive absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
            <span class="bg-destructive relative inline-flex h-3 w-3 rounded-full"></span>
          </span>
          <span class="text-destructive font-mono text-xs font-semibold">
            Recording 0:{recordingSeconds.toString().padStart(2, '0')} / 0:{MAX_SECONDS}
          </span>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onclick={stopRecording}
          class="h-8 gap-1.5 text-xs"
        >
          <Square class="h-3 w-3 fill-current" />
          Stop
        </Button>
      {:else}
        <span class="text-muted-foreground text-xs">
          Speak clearly in your dialect (max {MAX_SECONDS}s)
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onclick={startRecording}
          class="h-8 gap-1.5 text-xs font-medium"
        >
          <Mic class="text-primary h-3.5 w-3.5" />
          Start Recording
        </Button>
      {/if}
    </div>
  {/if}

  {#if errorMsg}
    <p class="text-destructive flex items-center gap-1.5 text-xs font-medium">
      <CircleAlert class="h-3.5 w-3.5 shrink-0" />
      {errorMsg}
    </p>
  {/if}
</div>
