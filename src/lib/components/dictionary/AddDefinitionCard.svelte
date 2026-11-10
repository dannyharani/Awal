<script lang="ts">
  import { page } from '$app/state';
  import { superForm } from 'sveltekit-superforms';
  import { getLocale, locales, setLocale } from '$lib/paraglide/runtime';

  // UI Components
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

  // Icons
  import { CirclePlus, User, Mic, Type, Languages, ChevronDown } from '@lucide/svelte';
  import { zod4 } from 'sveltekit-superforms/adapters';
  import { definitionSchema } from '$lib/schemas';

  let { data } = $props();
  let { headword, dialects, form } = $derived(data);
  let { user } = $derived(page.data);

  const currentLang = getLocale();

  let hasSubmitted = $state(false);

  const {
    form: formData,
    enhance,
    delayed,
    errors,
    tainted
  } = superForm(form, {
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
            class="bg-background/50 mb-6 flex items-center justify-between rounded-md border px-3 py-2 shadow-sm"
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
            class="space-y-5"
          >
            <input type="hidden" name="headword_id" value={headword.id} />

            <div class="space-y-4">
              <div class="space-y-2">
                <Label for="dialect">Region / Dialect <span class="text-destructive">*</span></Label
                >
                <div class="relative">
                  <select
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

              <div class="space-y-2">
                <Label for="definition">Definition <span class="text-destructive">*</span></Label>
                <Textarea
                  name="definition_text"
                  bind:value={$formData.definition_text}
                  placeholder={`Write the definition...`}
                  class="min-h-[100px] resize-none {showFieldErrors('definition_text')
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

            <div class="bg-muted/30 space-y-4 rounded-lg border border-dashed p-4">
              <div
                class="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase"
              >
                <Type class="h-3 w-3" /> Optional Context
              </div>
              <div class="grid gap-3">
                <div class="space-y-1">
                  <Label class="text-xs">Example Sentence (Amazigh)</Label>
                  <Input
                    name="example_sentence"
                    bind:value={$formData.example_sentence}
                    placeholder="Azul, amek tellid?"
                    class="h-9"
                  />
                </div>
                <div class="space-y-1">
                  <Label class="text-xs">Translation</Label>
                  <Input
                    name="example_translation"
                    bind:value={$formData.example_translation}
                    placeholder="Hello, how are you?"
                    class="h-9"
                  />
                </div>
              </div>
              <div class="space-y-2 pt-2">
                <Label class="flex items-center gap-1 text-xs">
                  <Mic class="h-3 w-3" /> Pronunciation Audio
                </Label>
                <input
                  type="file"
                  name="audio"
                  accept="audio/*"
                  class="border-input bg-background text-muted-foreground file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-xs file:border-0 file:bg-transparent file:text-xs file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                />
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
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</div>
