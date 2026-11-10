<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Card from '$lib/components/ui/card';
  import { Separator } from '$lib/components/ui/separator';
  import AmazighKeyboardBar from '$lib/components/dictionary/AmazighKeyboardBar.svelte';
  import { generateWordSlug, latinToTifinagh } from '$lib/utils/amazigh';
  import * as m from '$lib/paraglide/messages.js';
  import {
    ArrowLeft,
    Languages,
    Type,
    Globe,
    Link as LinkIcon,
    Info,
    Check,
    CircleAlert,
    WandSparkles
  } from '@lucide/svelte';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance, delayed, message } = superForm(data.form);

  // Dynamic preview for the user as they type
  let slugPreview = $derived($form.script_latin ? generateWordSlug($form.script_latin) || '...' : '...');

  let isSuccess = $derived($message && typeof $message === 'object' && 'slug' in $message);

  function autoFillTifinagh() {
    if ($form.script_latin) {
      $form.script_tifinagh = latinToTifinagh($form.script_latin);
    }
  }
</script>

<div class="container mx-auto flex w-full flex-col items-center px-4 py-6 sm:min-h-[80vh] sm:justify-center sm:py-10">
  <div class="w-full max-w-lg space-y-6">
    <div class="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        href="/"
        class="text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft class="mr-2 h-4 w-4" />
        {m.word_back_to_dict()}
      </Button>
    </div>

    <Card.Root class="shadow-lg">
      <Card.Header class="space-y-1">
        <Card.Title class="text-2xl">{m.word_create_title()}</Card.Title>
        <Card.Description>
          {m.word_create_desc()}
        </Card.Description>
      </Card.Header>

      <Card.Content>
        {#if isSuccess}
          <div
            class="animate-in fade-in zoom-in flex flex-col items-center justify-center space-y-4 py-6 text-center duration-300"
          >
            <div
              class="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full"
            >
              <Check class="h-6 w-6" />
            </div>
            <div class="space-y-1">
              <h3 class="text-lg font-semibold">{m.word_created_success()}</h3>
              <p class="text-muted-foreground text-sm">
                The entry for <span class="text-foreground font-medium">{$form.script_latin}</span> has
                been added.
              </p>
            </div>
            <Button href="/word/{$message.slug}" class="w-full gap-2">
              {m.word_add_definition_now()}
              <ArrowLeft class="h-4 w-4 rotate-180" />
            </Button>
          </div>
        {:else}
          {#if $message && typeof $message === 'string'}
            <div
              class="bg-destructive/10 text-destructive border-destructive/20 animate-in slide-in-from-top-2 mb-6 flex items-center gap-2 rounded-md border p-3 text-sm font-medium"
            >
              <CircleAlert class="h-4 w-4" />
              {$message}
            </div>
          {/if}

          <form method="POST" use:enhance class="space-y-6">
            <div class="space-y-3">
              <Label for="latin">{m.word_latin_label()} <span class="text-destructive">*</span></Label>
              <div class="relative">
                <Type
                  class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                />
                <Input
                  id="latin"
                  name="script_latin"
                  bind:value={$form.script_latin}
                  placeholder={m.word_latin_placeholder()}
                  class="pl-10"
                />
              </div>

              <AmazighKeyboardBar bind:value={$form.script_latin} />

              {#if $errors.script_latin}
                <span class="text-destructive text-xs font-medium">{$errors.script_latin}</span>
              {/if}

              <div
                class="bg-muted/50 text-muted-foreground flex items-center justify-between gap-2 overflow-hidden rounded-md px-3 py-2 text-xs"
              >
                <span class="flex min-w-0 items-center gap-2">
                  <LinkIcon class="h-3 w-3 shrink-0" />
                  <span class="truncate">
                    .../word/<span class="text-foreground font-mono font-medium">{slugPreview}</span>
                  </span>
                </span>
                {#if $form.script_latin}
                  <span class="font-tifinagh text-primary shrink-0 text-xs">
                    {latinToTifinagh($form.script_latin)}
                  </span>
                {/if}
              </div>
            </div>

            <Separator />

            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <Label for="tifinagh" class="flex items-center gap-1.5 text-sm">
                    {m.word_tifinagh_label()}
                  </Label>
                  {#if $form.script_latin}
                    <button
                      type="button"
                      onclick={autoFillTifinagh}
                      class="text-primary hover:text-primary/80 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                      title="Convert Latin script to Neo-Tifinagh"
                    >
                      <WandSparkles class="h-3 w-3" />
                      {m.word_tifinagh_autofill()}
                    </button>
                  {/if}
                </div>
                <div class="relative">
                  <Globe
                    class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                  />
                  <Input
                    id="tifinagh"
                    name="script_tifinagh"
                    bind:value={$form.script_tifinagh}
                    placeholder={m.word_tifinagh_placeholder()}
                    class="font-tifinagh pl-10"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="arabic" class="flex items-center gap-2 text-sm">
                  {m.word_arabic_label()}
                </Label>
                <div class="relative">
                  <Languages
                    class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                  />
                  <Input
                    id="arabic"
                    name="script_arabic"
                    bind:value={$form.script_arabic}
                    placeholder={m.word_arabic_placeholder()}
                    class="pl-10 text-right"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            <div
              class="flex gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-400"
            >
              <Info class="h-5 w-5 shrink-0" />
              <p>
                {m.word_create_desc()}
              </p>
            </div>

            <Button type="submit" class="w-full" disabled={$delayed}>
              {#if $delayed}
                <div
                  class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                ></div>
                {m.word_submit_btn()}...
              {:else}
                {m.word_submit_btn()}
              {/if}
            </Button>
          </form>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</div>
