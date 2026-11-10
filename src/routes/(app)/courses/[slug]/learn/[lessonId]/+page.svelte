<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import * as Card from '$lib/components/ui/card';
  import AudioPlayer from '$lib/components/dictionary/AudioPlayer.svelte';
  import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Sparkles,
    BookOpen,
    HelpCircle
  } from '@lucide/svelte';

  let { data, form } = $props();
  const { course, lesson, prevLesson, nextLesson, isCompleted, user } = $derived(data);

  let steps = $derived(lesson.steps ?? []);
  let currentStepIdx = $state(0);
  let activeStep = $derived(steps[currentStepIdx] ?? null);

  // Reset state when switching lessons
  $effect(() => {
    void lesson.id;
    currentStepIdx = 0;
    flippedCards = {};
    quizSelections = {};
    completionBanner = false;
  });

  // Flashcard flip state: cardIndex -> boolean
  let flippedCards = $state<Record<number, boolean>>({});

  // Quiz answer state: `${stepId}_${questionIdx}` -> selectedOptionIdx
  let quizSelections = $state<Record<string, number>>({});
  let completionBanner = $state(false);
  let xpAwarded = $state(0);

  function toggleCardFlip(idx: number) {
    flippedCards[idx] = !flippedCards[idx];
  }

  function selectQuizAnswer(stepId: number, qIdx: number, optIdx: number) {
    const key = `${stepId}_${qIdx}`;
    if (quizSelections[key] !== undefined) return; // Lock in first answer for immediate feedback
    quizSelections[key] = optIdx;
  }

  function resetQuiz(stepId: number, totalQ: number) {
    for (let i = 0; i < totalQ; i++) {
      delete quizSelections[`${stepId}_${i}`];
    }
    quizSelections = { ...quizSelections };
  }

  function renderMarkdown(md: string): string {
    if (!md) return '';
    return md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-5 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-6 mb-3 border-b pb-1.5">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-extrabold mt-2 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(
        /`(.*?)`/g,
        '<code class="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-serif text-base">$1</code>'
      )
      .replace(/^- (.*$)/gm, '<li class="ml-5 list-disc my-1">$1</li>')
      .replace(/\n\n/g, '</p><p class="my-3 leading-relaxed">')
      .replace(/\n/g, '<br />');
  }

  function getEmbedUrl(url: string): string | null {
    if (!url) return null;
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
  }
</script>

<div class="container mx-auto max-w-3xl space-y-6 px-4 py-8">
  <!-- Top Progress & Navigation Header -->
  <div class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <Button variant="ghost" size="sm" href="/courses/{course.slug}" class="-ml-2 gap-1.5 text-xs">
        <ArrowLeft class="h-4 w-4" />
        {course.title}
      </Button>

      <div class="flex items-center gap-2">
        {#if isCompleted || completionBanner}
          <Badge variant="default" class="gap-1 bg-emerald-600 text-white">
            <CheckCircle2 class="h-3 w-3" /> Completed
          </Badge>
        {/if}
        <Badge variant="outline" class="font-mono text-xs">
          Step {steps.length > 0 ? currentStepIdx + 1 : 0} / {steps.length}
        </Badge>
      </div>
    </div>

    <h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl">{lesson.title}</h1>

    <!-- Step Progress Pills -->
    {#if steps.length > 0}
      <div class="flex w-full gap-1.5 pt-1">
        {#each steps as s, idx (s.id)}
          <button
            type="button"
            onclick={() => (currentStepIdx = idx)}
            class="h-2 flex-1 rounded-full transition-all {idx === currentStepIdx
              ? 'bg-primary'
              : idx < currentStepIdx
                ? 'bg-primary/40'
                : 'bg-muted'}"
            title="Go to Step {idx + 1} ({s.step_type})"
          ></button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Active Step Content -->
  {#if activeStep}
    {@const content = (activeStep.content ?? {}) as Record<string, any>}
    <Card.Root class="border-border gap-0 shadow-sm">
      <Card.Header class="bg-muted/20 flex flex-row flex-wrap items-center justify-between gap-2 border-b px-4 py-3.5 sm:px-6">
        <Badge variant="secondary" class="text-xs uppercase">{activeStep.step_type}</Badge>

        {#if activeStep.headword}
          <a
            href="/word/{activeStep.headword.slug}"
            target="_blank"
            class="text-primary flex items-center gap-1.5 text-xs font-semibold hover:underline"
          >
            <BookOpen class="h-3.5 w-3.5 shrink-0" />
            <span>Dictionary Entry: {activeStep.headword.script_latin}</span>
            {#if activeStep.headword.script_tifinagh}
              <span class="font-serif">({activeStep.headword.script_tifinagh})</span>
            {/if}
          </a>
        {/if}
      </Card.Header>

      <Card.Content class="p-4 sm:p-8">
        {#if activeStep.step_type === 'text'}
          <div class="prose dark:prose-invert max-w-none text-base leading-relaxed">
            {@html renderMarkdown(content.markdown || '')}
          </div>
        {:else if activeStep.step_type === 'video'}
          {@const videoUrl = content.video_url || content.url || ''}
          {@const embedUrl = getEmbedUrl(videoUrl)}
          <div class="space-y-4">
            {#if content.title}
              <h3 class="text-lg font-bold">{content.title}</h3>
            {/if}
            {#if embedUrl}
              <iframe
                src={embedUrl}
                title={content.title || 'Lesson Video'}
                class="aspect-video w-full rounded-xl border"
                allowfullscreen
              ></iframe>
            {:else if videoUrl}
              <!-- svelte-ignore a11y_media_has_caption -->
              <video src={videoUrl} controls class="aspect-video w-full rounded-xl bg-black"></video>
            {/if}
            {#if content.notes}
              <div class="bg-muted/30 rounded-lg border p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {content.notes}
              </div>
            {/if}
          </div>
        {:else if activeStep.step_type === 'flashcard'}
          <div class="space-y-5">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold">{content.deck_title || 'Vocabulary Cards'}</h3>
              <span class="text-muted-foreground text-xs">Click any card to flip</span>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {#each content.cards || [] as card, cIdx}
                {@const isFlipped = Boolean(flippedCards[cIdx])}
                <div
                  role="button"
                  tabindex="0"
                  onclick={() => toggleCardFlip(cIdx)}
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') toggleCardFlip(cIdx);
                  }}
                  class="group relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-6 text-center transition-all duration-200 {isFlipped
                    ? 'border-primary bg-primary/5'
                    : 'bg-card hover:border-primary/40 shadow-sm'}"
                >
                  <Badge variant="outline" class="absolute top-3 right-3 text-[10px]">
                    {isFlipped ? 'Meaning' : 'Tamaziɣt'}
                  </Badge>

                  {#if !isFlipped}
                    <p class="text-foreground text-2xl font-extrabold">{card.front_latin}</p>
                    {#if card.front_tifinagh}
                      <p class="text-primary mt-1 font-serif text-2xl">{card.front_tifinagh}</p>
                    {/if}
                  {:else}
                    <p class="text-foreground text-xl font-bold">{card.back_text}</p>
                    {#if card.notes}
                      <p class="text-muted-foreground mt-2 text-xs">{card.notes}</p>
                    {/if}
                  {/if}

                  {#if card.audio_url}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div class="mt-4" onclick={(e) => e.stopPropagation()}>
                      <AudioPlayer src={card.audio_url} />
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {:else if activeStep.step_type === 'quiz'}
          {@const questions = content.questions || []}
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <h3 class="flex items-center gap-2 text-lg font-bold">
                <HelpCircle class="text-primary h-5 w-5" />
                Knowledge Check
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="h-7 gap-1 text-xs"
                onclick={() => resetQuiz(activeStep.id, questions.length)}
              >
                <RotateCcw class="h-3.5 w-3.5" /> Retry Quiz
              </Button>
            </div>

            {#each questions as q, qIdx}
              {@const key = `${activeStep.id}_${qIdx}`}
              {@const chosen = quizSelections[key]}
              {@const hasAnswered = chosen !== undefined}
              {@const isCorrect = chosen === q.correct_index}

              <div class="bg-muted/20 space-y-3 rounded-xl border p-5">
                <p class="font-semibold">
                  {qIdx + 1}. {q.question}
                </p>

                <div class="grid gap-2.5 sm:grid-cols-2">
                  {#each q.answers || [] as ans, optIdx}
                    <button
                      type="button"
                      onclick={() => selectQuizAnswer(activeStep.id, qIdx, optIdx)}
                      disabled={hasAnswered}
                      class="flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all {hasAnswered
                        ? optIdx === q.correct_index
                          ? 'border-emerald-600 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : chosen === optIdx
                            ? 'border-rose-600 bg-rose-500/15 text-rose-700 dark:text-rose-300'
                            : 'bg-background opacity-60'
                        : 'bg-background hover:border-primary hover:bg-primary/5'}"
                    >
                      <span>{ans}</span>
                      {#if hasAnswered && optIdx === q.correct_index}
                        <CheckCircle2 class="h-4 w-4 shrink-0 text-emerald-600" />
                      {:else if hasAnswered && chosen === optIdx && !isCorrect}
                        <XCircle class="h-4 w-4 shrink-0 text-rose-600" />
                      {/if}
                    </button>
                  {/each}
                </div>

                {#if hasAnswered && q.explanation}
                  <div
                    class="rounded-md border px-3.5 py-2.5 text-xs {isCorrect
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200'}"
                  >
                    <strong>{isCorrect ? 'Correct!' : 'Explanation:'}</strong>
                    {q.explanation}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>

      <!-- Step Navigation Footer -->
      <Card.Footer class="bg-muted/20 flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3.5 sm:px-6 sm:py-4">
        <Button
          variant="outline"
          size="sm"
          disabled={currentStepIdx === 0}
          onclick={() => (currentStepIdx = Math.max(0, currentStepIdx - 1))}
        >
          <ArrowLeft class="mr-1.5 h-4 w-4" /> Previous Step
        </Button>

        {#if currentStepIdx < steps.length - 1}
          <Button size="sm" onclick={() => (currentStepIdx = currentStepIdx + 1)}>
            Next Step <ArrowRight class="ml-1.5 h-4 w-4" />
          </Button>
        {:else if user}
          <form
            method="POST"
            action="?/completeLesson"
            use:enhance={() => {
              return async ({ result, update }) => {
                if (result.type === 'success') {
                  completionBanner = true;
                  xpAwarded = (result.data as any)?.result?.xp_awarded ?? 0;
                }
                await update();
              };
            }}
          >
            <Button type="submit" size="sm" class="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
              <CheckCircle2 class="h-4 w-4" />
              {isCompleted || completionBanner ? 'Lesson Completed' : 'Complete Lesson (+10 XP)'}
            </Button>
          </form>
        {:else}
          <Button size="sm" href="/courses/{course.slug}">Finish Lesson</Button>
        {/if}
      </Card.Footer>
    </Card.Root>
  {:else}
    <Card.Root class="border-dashed py-12 text-center">
      <Card.Content>
        <p class="text-muted-foreground">This lesson does not have any steps yet.</p>
      </Card.Content>
    </Card.Root>
  {/if}

  <!-- Celebratory Completion Banner & Next/Prev Lesson Navigation -->
  {#if completionBanner}
    <Card.Root class="border-emerald-500/40 bg-emerald-500/10">
      <Card.Content class="flex flex-wrap items-center justify-between gap-4 p-6">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Sparkles class="h-5 w-5" />
          </div>
          <div>
            <h3 class="font-bold">Ayyuz! Lesson Completed!</h3>
            <p class="text-muted-foreground text-xs">
              {xpAwarded > 0
                ? `You earned +${xpAwarded} reputation points!`
                : 'Your progress has been saved.'}
            </p>
          </div>
        </div>

        {#if nextLesson}
          <Button href="/courses/{course.slug}/learn/{nextLesson.id}" class="gap-2">
            Next Lesson: {nextLesson.title}
            <ArrowRight class="h-4 w-4" />
          </Button>
        {:else}
          <Button href="/courses/{course.slug}" variant="outline">Back to Course Syllabus</Button>
        {/if}
      </Card.Content>
    </Card.Root>
  {/if}

  <div class="flex flex-col gap-2 pt-2 text-xs sm:flex-row sm:items-center sm:justify-between">
    {#if prevLesson}
      <a
        href="/courses/{course.slug}/learn/{prevLesson.id}"
        class="text-muted-foreground hover:text-foreground flex min-w-0 items-center gap-1 font-medium"
      >
        <ArrowLeft class="h-3.5 w-3.5 shrink-0" />
        <span class="truncate">Prev: {prevLesson.title}</span>
      </a>
    {:else}
      <span class="hidden sm:inline"></span>
    {/if}

    {#if nextLesson}
      <a
        href="/courses/{course.slug}/learn/{nextLesson.id}"
        class="text-primary flex min-w-0 items-center justify-end gap-1 font-semibold hover:underline"
      >
        <span class="truncate">Next: {nextLesson.title}</span>
        <ArrowRight class="h-3.5 w-3.5 shrink-0" />
      </a>
    {/if}
  </div>
</div>
