<script lang="ts">
  import { page } from '$app/state';
  import { superForm } from 'sveltekit-superforms';
  import { getLocale, locales, setLocale } from '$lib/paraglide/runtime';
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
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <CirclePlus class="text-primary h-5 w-5" />
          Add Definition
        </Card.Title>
        <Card.Description>
          Help expand the Amazigh dictionary by adding a meaning from your region.
        </Card.Description>
      </Card.Header>

      <Card.Content>
        {#if user}
          <div
            class="bg-background/50 mb-5 flex items-center justify-between rounded-md border px-3 py-2 shadow-sm"
          >
            <div class="text-muted-foreground flex items-center gap-2 text-xs">
              <Languages class="h-3.5 w-3.5" />
              <span
                >Contributing in <span class="text-foreground font-bold uppercase"
                  >{currentLang}</span
                ></span
              >
            </div>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                {#snippet child({ props })}
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-primary hover:text-primary/80 h-6 gap-1 px-2 text-[10px] uppercase"
                    {...props}
                  >
                    Change <ChevronDown class="h-3 w-3" />
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

            <div class="space-y-3">
              <div class="space-y-1.5">
                <Label for="dialect">Region / Dialect <span class="text-destructive">*</span></Label>
                <div class="relative">
                  <select
                    id="dialect"
                    name="dialect_id"
                    bind:value={$formData.dialect_id}
                    class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    class:border-destructive={showFieldErrors('dialect_id')}
                  >
                    <option value={0} disabled>Select a dialect...</option>
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
                <Label for="definition">Definition <span class="text-destructive">*</span></Label>
                <Textarea
                  id="definition"
                  name="definition_text"
                  bind:value={$formData.definition_text}
                  placeholder="Write the definition or translation..."
                  class="min-h-[85px] resize-none {showFieldErrors('definition_text')
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
            <div class="bg-muted/30 rounded-lg border border-dashed">
              <button
                type="button"
                onclick={() => (showGrammar = !showGrammar)}
                class="text-muted-foreground hover:text-foreground flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors"
              >
                <span class="flex items-center gap-2">
                  <BookOpen class="h-3.5 w-3.5" /> Grammar & Morphology
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
                      <Label class="text-[11px]">Part of Speech</Label>
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
                      <Label class="text-[11px]">Gender</Label>
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
                      <Label class="text-[11px]">Number</Label>
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
                      <Label class="text-[11px]" title="Consonantal root, e.g. G-L-D or Z-Ɣ">
                        Consonantal Root
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
                      <Label class="text-[11px]" title="Addad Amaruz (Annexed State)">
                        Construct State (Addad Amaruz)
                      </Label>
                      <Input
                        name="construct_state"
                        bind:value={$formData.construct_state}
                        placeholder="e.g. uɣrum / waman"
                        class="h-8 text-xs"
                      />
                    </div>

                    <div class="space-y-1">
                      <Label class="text-[11px]">Plural Form</Label>
                      <Input
                        name="plural"
                        bind:value={$formData.plural}
                        placeholder="e.g. iɣerman"
                        class="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div class="space-y-1">
                    <Label class="text-[11px]" title="Verb aspects: Aorist / Preterite / Intensive">
                      Verb Stems (Aorist / Preterite / Intensive)
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
            <div class="bg-muted/30 space-y-3 rounded-lg border border-dashed p-3.5">
              <div
                class="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase"
              >
                <Type class="h-3.5 w-3.5" /> Context & Audio
              </div>

              <div class="grid gap-2.5">
                <div class="space-y-1.5">
                  <Label class="text-xs">Example Sentence (Amazigh)</Label>
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
                  <Label class="text-xs">Sentence Translation</Label>
                  <Input
                    name="example_translation"
                    bind:value={$formData.example_translation}
                    placeholder="Hello, how are you?"
                    class="h-9 text-xs"
                  />
                </div>
              </div>

              <div class="space-y-1.5 pt-1">
                <Label class="flex items-center gap-1.5 text-xs">
                  <Mic class="h-3.5 w-3.5" /> Pronunciation Audio
                </Label>
                <AudioRecorder name="audio" />
              </div>
            </div>

            <Button type="submit" class="w-full" disabled={$delayed}>
              {$delayed ? 'Submitting...' : 'Submit Contribution'}
            </Button>
          </form>
        {:else}
          <div class="flex flex-col items-center gap-4 py-4 text-center">
            <div class="bg-muted rounded-full p-3">
              <User class="text-muted-foreground h-6 w-6" />
            </div>
            <p class="text-muted-foreground text-sm">
              You must be logged in to contribute to the community dictionary.
            </p>
            <Button variant="outline" size="sm" href="/login">Sign In to Contribute</Button>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</div>
