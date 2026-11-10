<script lang="ts">
  import { page } from '$app/state';
  import { superForm } from 'sveltekit-superforms';
  import { getLocale, locales, setLocale } from '$lib/paraglide/runtime';
  import * as m from '$lib/paraglide/messages.js';
  import { slide } from 'svelte/transition';

  // UI Components
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import AmazighKeyboardBar from './AmazighKeyboardBar.svelte';
  import AudioRecorder from './AudioRecorder.svelte';
  import {
    PARTS_OF_SPEECH,
    GENDERS,
    GRAMMATICAL_NUMBERS
  } from '$lib/utils/amazigh';

  // Icons
  import {
    CirclePlus,
    User,
    Mic,
    Type,
    Languages,
    ChevronDown,
    ChevronUp,
    BookOpen
  } from '@lucide/svelte';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { definitionSchema } from '$lib/schemas';

  let { data } = $props();
  let { headword, dialects } = $derived(data);
  let { user } = $derived(page.data);

  const currentLang = getLocale();

  let hasSubmitted = $state(false);
  let showGrammar = $state(false);

  // svelte-ignore state_referenced_locally
  const {
    form: formData,
    enhance,
    delayed,
    errors,
    tainted
  } = superForm(data.form, {
    validators: zod4(definitionSchema),
    validationMethod: 'auto',
    onSubmit: () => {
      hasSubmitted = true;
    }
  });

  function showFieldErrors(field: keyof typeof $formData) {
    return $errors[field] && ($tainted?.[field] || hasSubmitted);
  }
</script>

<div class="relative">
  <div class="sticky top-24">
    <Card.Root class="border-primary/20 from-card to-secondary/10 bg-gradient-to-b shadow-lg">
      <Card.Header class="pb-4">
        <Card.Title class="flex items-center gap-2 text-lg">
          <CirclePlus class="text-primary h-5 w-5 shrink-0" />
          <span>{m.word_add_definition_title()}</span>
        </Card.Title>
        <Card.Description class="text-xs leading-relaxed">
          {m.word_add_definition_desc()}
        </Card.Description>
      </Card.Header>

      <Card.Content class="space-y-4">
        {#if user}
          <div
            class="bg-background/60 flex items-center justify-between rounded-lg border px-3 py-2 text-xs shadow-xs"
          >
            <div class="text-muted-foreground flex items-center gap-2">
              <Languages class="text-primary h-4 w-4" />
              <span>
                {m.word_contributing_in()} <span class="text-foreground font-bold uppercase">{currentLang}</span>
              </span>
            </div>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                {#snippet child({ props })}
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-primary hover:text-primary/80 h-6 gap-1 px-2 text-[11px] font-semibold uppercase"
                    {...props}
                  >
                    {m.word_change()} <ChevronDown class="h-3 w-3" />
                  </Button>
                {/snippet}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                {#each locales as lang}
                  <DropdownMenu.Item onclick={() => setLocale(lang)}>
                    <span class="mr-2 text-xs font-bold uppercase">{lang}</span>
                    <span class="text-muted-foreground text-xs capitalize">
                      {new Intl.DisplayNames([lang], { type: 'language' }).of(lang)}
                    </span>
                  </DropdownMenu.Item>
                {/each}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>

          <form
            method="POST"
            action="?/addDefinition"
            enctype="multipart/form-data"
            use:enhance
            class="space-y-4"
          >
            <input type="hidden" name="headword_id" value={headword.id} />

            <div class="space-y-3.5">
              <div class="space-y-1.5">
                <Label for="dialect" class="text-xs font-medium">
                  {m.word_region_dialect()} <span class="text-destructive">*</span>
                </Label>
                <div class="relative">
                  <select
                    id="dialect"
                    name="dialect_id"
                    bind:value={$formData.dialect_id}
                    class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
                    class:border-destructive={showFieldErrors('dialect_id')}
                  >
                    <option value={0} disabled>{m.word_select_dialect()}</option>
                    {#each dialects as dialect}
                      <option value={dialect.id}>{dialect.name}</option>
                    {/each}
                  </select>
                </div>

                {#if showFieldErrors('dialect_id')}
                  <span class="text-destructive animate-in slide-in-from-top-1 text-xs font-medium">
                    Please select a valid dialect.
                  </span>
                {/if}
              </div>

              <div class="space-y-1.5">
                <Label for="definition" class="text-xs font-medium">
                  {m.word_definition_label()} <span class="text-destructive">*</span>
                </Label>
                <Textarea
                  id="definition"
                  name="definition_text"
                  bind:value={$formData.definition_text}
                  placeholder={m.word_definition_placeholder()}
                  class="min-h-[85px] resize-none text-sm {showFieldErrors('definition_text')
                    ? 'border-destructive'
                    : ''}"
                />

                {#if showFieldErrors('definition_text')}
                  <span class="text-destructive text-xs font-medium">
                    {$errors.definition_text}
                  </span>
                {/if}
              </div>
            </div>

            <!-- Grammar & Morphology Accordion -->
            <div class="bg-muted/30 rounded-lg border border-border/70 overflow-hidden transition-all">
              <button
                type="button"
                onclick={() => (showGrammar = !showGrammar)}
                class="text-muted-foreground hover:text-foreground hover:bg-muted/50 flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-semibold tracking-wide uppercase transition-colors"
              >
                <span class="flex items-center gap-2">
                  <BookOpen class="text-primary h-3.5 w-3.5" />
                  <span>{m.word_grammar_morphology()}</span>
                  <span class="text-[10px] lowercase font-normal opacity-60">(optional)</span>
                </span>
                {#if showGrammar}
                  <ChevronUp class="h-3.5 w-3.5" />
                {:else}
                  <ChevronDown class="h-3.5 w-3.5" />
                {/if}
              </button>

              {#if showGrammar}
                <div transition:slide={{ duration: 150 }} class="space-y-3 border-t px-3.5 py-3">
                  <div class="grid grid-cols-2 gap-2.5">
                    <div class="space-y-1">
                      <Label class="text-[11px] font-medium">{m.word_part_of_speech()}</Label>
                      <select
                        name="part_of_speech"
                        bind:value={$formData.part_of_speech}
                        class="border-input bg-background flex h-8 w-full rounded-md border px-2 text-xs"
                      >
                        <option value="">— Select —</option>
                        {#each PARTS_OF_SPEECH as pos}
                          <option value={pos.value}>{pos.label}</option>
                        {/each}
                      </select>
                    </div>

                    <div class="space-y-1">
                      <Label class="text-[11px] font-medium">{m.word_gender()}</Label>
                      <select
                        name="gender"
                        bind:value={$formData.gender}
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
                      <Label class="text-[11px] font-medium">{m.word_number()}</Label>
                      <select
                        name="grammatical_number"
                        bind:value={$formData.grammatical_number}
                        class="border-input bg-background flex h-8 w-full rounded-md border px-2 text-xs"
                      >
                        <option value="">— Select —</option>
                        {#each GRAMMATICAL_NUMBERS as num}
                          <option value={num.value}>{num.label}</option>
                        {/each}
                      </select>
                    </div>

                    <div class="space-y-1">
                      <Label class="text-[11px] font-medium" title="Consonantal root, e.g. G-L-D or Z-Ɣ">
                        {m.word_consonantal_root()}
                      </Label>
                      <Input
                        name="root"
                        bind:value={$formData.root}
                        placeholder="e.g. G-L-D"
                        class="h-8 text-xs uppercase"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2.5">
                    <div class="space-y-1">
                      <Label class="text-[11px] font-medium" title="Addad Amaruz (Annexed State)">
                        {m.word_construct_state()}
                      </Label>
                      <Input
                        name="construct_state"
                        bind:value={$formData.construct_state}
                        placeholder="e.g. uɣrum / waman"
                        class="h-8 text-xs"
                      />
                    </div>

                    <div class="space-y-1">
                      <Label class="text-[11px] font-medium">{m.word_plural_form()}</Label>
                      <Input
                        name="plural"
                        bind:value={$formData.plural}
                        placeholder="e.g. iɣerman"
                        class="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div class="space-y-1">
                    <Label class="text-[11px] font-medium" title="Verb aspects: Aorist / Preterite / Intensive">
                      {m.word_verb_stems()}
                    </Label>
                    <Input
                      name="verb_stems"
                      bind:value={$formData.verb_stems}
                      placeholder="e.g. aru / yura / ttaru"
                      class="h-8 text-xs"
                    />
                  </div>
                </div>
              {/if}
            </div>

            <!-- Context & Audio -->
            <div class="bg-muted/30 space-y-3.5 rounded-lg border border-border/70 p-3.5">
              <div
                class="text-muted-foreground flex items-center justify-between text-xs font-semibold tracking-wide uppercase"
              >
                <div class="flex items-center gap-2">
                  <Type class="text-primary h-3.5 w-3.5" />
                  <span>{m.word_context_audio()}</span>
                </div>
                <span class="text-[10px] lowercase font-normal opacity-60">(optional)</span>
              </div>

              <div class="grid gap-2.5">
                <div class="space-y-1.5">
                  <Label class="text-xs font-medium">{m.word_example_sentence()}</Label>
                  <AmazighKeyboardBar
                    onInsert={(ch) => {
                      $formData.example_sentence = ($formData.example_sentence || '') + ch;
                    }}
                  />
                  <Input
                    name="example_sentence"
                    bind:value={$formData.example_sentence}
                    placeholder="Azul, amek tellid?"
                    class="h-9 text-xs"
                  />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs font-medium">{m.word_sentence_translation()}</Label>
                  <Input
                    name="example_translation"
                    bind:value={$formData.example_translation}
                    placeholder="Hello, how are you?"
                    class="h-9 text-xs"
                  />
                </div>
              </div>

              <div class="pt-1 border-t border-border/40">
                <AudioRecorder name="audio" />
              </div>
            </div>

            <Button type="submit" class="w-full font-semibold shadow-sm" disabled={$delayed}>
              {$delayed ? m.word_submitting() : m.word_submit_contribution()}
            </Button>
          </form>
        {:else}
          <div class="flex flex-col items-center gap-4 py-4 text-center">
            <div class="bg-muted rounded-full p-3">
              <User class="text-muted-foreground h-6 w-6" />
            </div>
            <p class="text-muted-foreground text-sm">
              {m.word_must_be_logged_in()}
            </p>
            <Button variant="outline" size="sm" href="/login">
              {m.word_sign_in_to_contribute()}
            </Button>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</div>
