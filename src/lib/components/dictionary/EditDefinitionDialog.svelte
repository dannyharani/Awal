<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Input } from '$lib/components/ui/input';
  import { Separator } from '$lib/components/ui/separator';
  import AudioPlayer from './AudioPlayer.svelte';
  import AudioRecorder from './AudioRecorder.svelte';
  import * as m from '$lib/paraglide/messages.js';
  import {
    PARTS_OF_SPEECH,
    GENDERS,
    GRAMMATICAL_NUMBERS
  } from '$lib/utils/amazigh';

  // Icons
  import { Pencil, Trash2, Plus, X, Mic, Languages, Type, BookOpen } from '@lucide/svelte';

  let { definition, dialects } = $props();
  let open = $state(false);
  let loading = $state(false);

  let attributes = $derived(
    typeof definition.attributes === 'string'
      ? JSON.parse(definition.attributes)
      : definition.attributes || {}
  );

  let langName = $derived(
    new Intl.DisplayNames(['en'], { type: 'language' }).of(definition.language_code || 'en')
  );
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>
    {#snippet child({ props })}
      <Button
        variant="ghost"
        size="icon"
        class="text-muted-foreground hover:text-foreground h-6 w-6"
        title="Edit definition"
        {...props}
      >
        <Pencil class="h-3.5 w-3.5" />
      </Button>
    {/snippet}
  </Dialog.Trigger>

  <Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-[580px]">
    <Dialog.Header>
      <Dialog.Title>Manage Definition</Dialog.Title>
    </Dialog.Header>

    <div class="py-3">
      <div class="bg-muted/40 mb-5 flex items-center gap-2 rounded-md border px-3 py-2">
        <Languages class="text-muted-foreground h-3.5 w-3.5" />
        <span class="text-muted-foreground text-xs">
          Editing <span class="text-foreground font-bold uppercase">{definition.language_code}</span
          >
          ({langName}) definition
        </span>
      </div>

      <form
        method="POST"
        action="?/updateDefinition"
        enctype="multipart/form-data"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            loading = false;
            open = false;
            await update();
          };
        }}
        class="grid gap-4"
      >
        <input type="hidden" name="definition_id" value={definition.id} />

        <div class="space-y-3">
          <div class="space-y-1.5">
            <Label>{m.word_region_dialect()}</Label>
            <select
              name="dialect_id"
              class="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
              value={definition.dialect_id}
            >
              {#each dialects as dialect}
                <option value={dialect.id}>{dialect.name}</option>
              {/each}
            </select>
          </div>

          <div class="space-y-1.5">
            <Label>{m.word_definition_label()}</Label>
            <Textarea
              name="definition_text"
              class="min-h-[80px] resize-none"
              value={definition.definition_text}
              required
            />
          </div>
        </div>

        <!-- Grammar & Morphology -->
        <div class="bg-muted/30 space-y-3 rounded-lg border border-dashed p-3.5">
          <div
            class="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase"
          >
            <BookOpen class="h-3.5 w-3.5" /> {m.word_grammar_morphology()}
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div class="space-y-1">
              <Label class="text-[11px]">{m.word_part_of_speech()}</Label>
              <select
                name="part_of_speech"
                value={attributes.part_of_speech ?? ''}
                class="border-input bg-background flex h-8 w-full rounded-md border px-2 text-xs"
              >
                <option value="">— Select —</option>
                {#each PARTS_OF_SPEECH as pos}
                  <option value={pos.value}>{pos.label}</option>
                {/each}
              </select>
            </div>

            <div class="space-y-1">
              <Label class="text-[11px]">{m.word_gender()}</Label>
              <select
                name="gender"
                value={attributes.gender ?? ''}
                class="border-input bg-background flex h-8 w-full rounded-md border px-2 text-xs"
              >
                <option value="">— Select —</option>
                {#each GENDERS as g}
                  <option value={g.value}>{g.label}</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div class="space-y-1">
              <Label class="text-[11px]">{m.word_number()}</Label>
              <select
                name="grammatical_number"
                value={attributes.grammatical_number ?? ''}
                class="border-input bg-background flex h-8 w-full rounded-md border px-2 text-xs"
              >
                <option value="">— Select —</option>
                {#each GRAMMATICAL_NUMBERS as num}
                  <option value={num.value}>{num.label}</option>
                {/each}
              </select>
            </div>

            <div class="space-y-1">
              <Label class="text-[11px]">{m.word_consonantal_root()}</Label>
              <Input
                name="root"
                value={attributes.root ?? ''}
                placeholder="e.g. G-L-D"
                class="h-8 text-xs uppercase"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div class="space-y-1">
              <Label class="text-[11px]">{m.word_construct_state()}</Label>
              <Input
                name="construct_state"
                value={attributes.construct_state ?? ''}
                placeholder="e.g. uɣrum"
                class="h-8 text-xs"
              />
            </div>

            <div class="space-y-1">
              <Label class="text-[11px]">{m.word_plural_form()}</Label>
              <Input
                name="plural"
                value={attributes.plural ?? ''}
                placeholder="e.g. iɣerman"
                class="h-8 text-xs"
              />
            </div>
          </div>

          <div class="space-y-1">
            <Label class="text-[11px]">{m.word_verb_stems()}</Label>
            <Input
              name="verb_stems"
              value={attributes.verb_stems ?? ''}
              placeholder="e.g. aru / yura / ttaru"
              class="h-8 text-xs"
            />
          </div>
        </div>

        <div class="bg-muted/30 rounded-lg border border-dashed p-3.5">
          <div
            class="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase"
          >
            <Mic class="h-3.5 w-3.5" /> {m.word_pronunciation_audio()}
          </div>

          {#if definition.audio_url}
            <div class="bg-background flex flex-wrap items-center justify-between gap-2 rounded-md border p-2">
              <AudioPlayer src={definition.audio_url} />
              <Button
                type="submit"
                formaction="?/deleteAudio"
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 gap-1.5"
              >
                <Trash2 class="h-3.5 w-3.5" />
                <span class="text-xs">{m.common_delete()}</span>
              </Button>
            </div>
          {:else}
            <AudioRecorder name="audio" />
          {/if}
        </div>

        <div class="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onclick={() => (open = false)}>
            {m.common_cancel()}
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? m.word_saving() : m.common_save()}
          </Button>
        </div>
      </form>

      <Separator class="my-5" />

      <div class="space-y-3">
        <div
          class="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase"
        >
          <Type class="h-3.5 w-3.5" /> Examples
        </div>

        {#if definition.examples?.length > 0}
          <div class="space-y-2">
            {#each definition.examples as ex}
              <div
                class="bg-muted/40 group flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
              >
                <div class="flex flex-col">
                  <span class="font-medium italic">"{ex.sentence_text}"</span>
                  <span class="text-muted-foreground text-xs">{ex.translation_text}</span>
                </div>
                <form method="POST" action="?/deleteExample" use:enhance>
                  <input type="hidden" name="example_id" value={ex.id} />
                  <Button
                    variant="ghost"
                    size="icon"
                    type="submit"
                    class="text-destructive h-6 w-6 opacity-70 transition-opacity hover:opacity-100"
                    title="Delete example"
                  >
                    <X class="h-3 w-3" />
                  </Button>
                </form>
              </div>
            {/each}
          </div>
        {/if}

        <form method="POST" action="?/addExample" use:enhance class="flex items-end gap-2">
          <input type="hidden" name="definition_id" value={definition.id} />
          <div class="grid flex-1 gap-1.5">
            <Input name="sentence" placeholder="New Amazigh sentence..." class="h-8 text-xs" required />
            <Input name="translation" placeholder="Translation..." class="h-8 text-xs" />
          </div>
          <Button type="submit" size="icon" variant="outline" class="h-[68px] w-10 shrink-0">
            <Plus class="h-4 w-4" />
          </Button>
        </form>
      </div>

      <Separator class="my-5" />

      <div class="border-destructive/20 bg-destructive/5 rounded-md border p-3.5">
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <p class="text-destructive text-sm font-medium">Delete Definition</p>
            <p class="text-muted-foreground text-xs">This action cannot be undone.</p>
          </div>
          <form
            method="POST"
            action="?/deleteDefinition"
            use:enhance={() => {
              return async ({ update }) => {
                open = false;
                await update();
              };
            }}
          >
            <input type="hidden" name="definition_id" value={definition.id} />
            <Button variant="destructive" size="sm" type="submit">
              <Trash2 class="mr-1.5 h-3.5 w-3.5" /> Delete
            </Button>
          </form>
        </div>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
