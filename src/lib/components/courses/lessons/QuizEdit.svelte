<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import AmazighKeyboardBar from '$lib/components/dictionary/AmazighKeyboardBar.svelte';
  import { Plus, Trash2, CheckCircle2 } from '@lucide/svelte';

  let { content = $bindable() } = $props();

  if (!Array.isArray(content.questions) || content.questions.length === 0) {
    content.questions = [
      {
        question: '',
        answers: ['', '', '', ''],
        correct_index: 0,
        explanation: ''
      }
    ];
  }

  function addQuestion() {
    content.questions = [
      ...(content.questions || []),
      {
        question: '',
        answers: ['', '', '', ''],
        correct_index: 0,
        explanation: ''
      }
    ];
  }

  function removeQuestion(qIdx: number) {
    content.questions = content.questions.filter((_: any, i: number) => i !== qIdx);
  }

  function addOption(qIdx: number) {
    content.questions[qIdx].answers = [...content.questions[qIdx].answers, ''];
  }

  function removeOption(qIdx: number, optIdx: number) {
    if (content.questions[qIdx].answers.length <= 2) return;
    content.questions[qIdx].answers = content.questions[qIdx].answers.filter(
      (_: any, i: number) => i !== optIdx
    );
    if (content.questions[qIdx].correct_index >= content.questions[qIdx].answers.length) {
      content.questions[qIdx].correct_index = 0;
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-sm font-bold">Interactive Quiz Questions ({content.questions?.length ?? 0})</h3>
      <p class="text-muted-foreground text-xs">
        Add multiple-choice questions and select the radio button next to the correct answer.
      </p>
    </div>

    <Button type="button" variant="outline" size="sm" onclick={addQuestion} class="gap-1.5 text-xs">
      <Plus class="h-3.5 w-3.5" /> Add Question
    </Button>
  </div>

  <div class="space-y-5">
    {#each content.questions || [] as q, qIdx}
      <div class="bg-muted/20 space-y-4 rounded-xl border p-4">
        <div class="flex items-center justify-between">
          <Badge variant="secondary" class="text-xs">Question #{qIdx + 1}</Badge>
          {#if (content.questions?.length ?? 0) > 1}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="text-muted-foreground hover:text-destructive h-7 w-7"
              onclick={() => removeQuestion(qIdx)}
            >
              <Trash2 class="h-3.5 w-3.5" />
            </Button>
          {/if}
        </div>

        <div class="space-y-1.5">
          <Label class="text-xs">Question Prompt</Label>
          <AmazighKeyboardBar
            onInsert={(ch) => {
              q.question = (q.question || '') + ch;
            }}
          />
          <Input
            bind:value={q.question}
            placeholder="e.g. Which Tifinagh word means 'Water'?"
            class="font-medium"
          />
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label class="text-xs">Answer Choices (Click circle to mark correct)</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="h-6 text-[11px]"
              onclick={() => addOption(qIdx)}
            >
              + Add Option
            </Button>
          </div>

          <div class="grid gap-2 sm:grid-cols-2">
            {#each q.answers as _, optIdx}
              <div
                class="bg-background flex items-center gap-2 rounded-lg border p-2 transition-colors {q.correct_index ===
                optIdx
                  ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                  : ''}"
              >
                <button
                  type="button"
                  onclick={() => (q.correct_index = optIdx)}
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border {q.correct_index ===
                  optIdx
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-muted-foreground/40'}"
                  title="Mark as correct answer"
                >
                  {#if q.correct_index === optIdx}
                    <CheckCircle2 class="h-3.5 w-3.5" />
                  {/if}
                </button>

                <Input
                  bind:value={q.answers[optIdx]}
                  placeholder={`Option ${optIdx + 1}`}
                  class="h-7 border-0 px-1.5 text-xs shadow-none focus-visible:ring-0"
                />

                {#if q.answers.length > 2}
                  <button
                    type="button"
                    onclick={() => removeOption(qIdx, optIdx)}
                    class="text-muted-foreground hover:text-destructive p-1"
                    title="Remove option"
                  >
                    <Trash2 class="h-3 w-3" />
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <div class="space-y-1">
          <Label class="text-xs">Explanation / Hint shown after answering (Optional)</Label>
          <Input
            bind:value={q.explanation}
            placeholder="e.g. Aman (ⴰⵎⴰⵏ) means water across Amazigh dialects."
            class="h-8 text-xs"
          />
        </div>
      </div>
    {/each}
  </div>
</div>
