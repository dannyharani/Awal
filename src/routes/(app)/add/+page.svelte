<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Card from '$lib/components/ui/card';
  import { Separator } from '$lib/components/ui/separator';
  import {
    ArrowLeft,
    Languages,
    Type,
    Globe,
    Link as LinkIcon,
    Info,
    Check,
    CircleAlert
  } from '@lucide/svelte';

  let { data } = $props();

  const { form, errors, enhance, delayed, message } = superForm(data.form);

  // Dynamic preview for the user as they type
  let slugPreview = $derived(
    $form.script_latin
      ? $form.script_latin
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9ɣɛ\-_]/g, '')
      : '...'
  );

  // Robust Success Check:
  // We check if $message exists AND if it has the specific 'slug' property we return on success
  let isSuccess = $derived($message && typeof $message === 'object' && 'slug' in $message);
</script>

<div class="container mx-auto flex min-h-[85vh] w-full flex-col items-center justify-center py-10">
  <div class="w-full max-w-lg space-y-6">
    <div class="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        href="/"
        class="text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft class="mr-2 h-4 w-4" />
        Back to Dictionary
      </Button>
    </div>

    <Card.Root class="shadow-lg">
      <Card.Header class="space-y-1">
        <Card.Title class="text-2xl">Add New Word</Card.Title>
        <Card.Description>
          Contribute to the dictionary by creating a new headword.
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
              <h3 class="text-lg font-semibold">Word Created!</h3>
              <p class="text-muted-foreground text-sm">
                The entry for <span class="text-foreground font-medium">{$form.script_latin}</span> has
                been added.
              </p>
            </div>
            <Button href="/word/{$message.slug}" class="w-full gap-2">
              Add Definition Now
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
              <Label for="latin">Latin Script <span class="text-destructive">*</span></Label>
              <div class="relative">
                <Type
                  class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                />
                <Input
                  id="latin"
                  name="script_latin"
                  bind:value={$form.script_latin}
                  placeholder="e.g. Aɣrum"
                  class="pl-10"
                />
              </div>
              {#if $errors.script_latin}
                <span class="text-destructive text-xs font-medium">{$errors.script_latin}</span>
              {/if}

              <div
                class="bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-md px-3 py-2 text-xs"
              >
                <LinkIcon class="h-3 w-3" />
                <span>
                  .../word/<span class="text-foreground font-mono font-medium">{slugPreview}</span>
                </span>
              </div>
            </div>

            <Separator />

            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <Label for="tifinagh" class="flex items-center gap-2 text-sm">
                  Tifinagh <span
                    class="text-muted-foreground text-[10px] font-normal tracking-wider uppercase"
                    >(Optional)</span
                  >
                </Label>
                <div class="relative">
                  <Globe
                    class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                  />
                  <Input
                    id="tifinagh"
                    name="script_tifinagh"
                    bind:value={$form.script_tifinagh}
                    placeholder="e.g. ⴰⵖⵔⵓⵎ"
                    class="font-tifinagh pl-10"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="arabic" class="flex items-center gap-2 text-sm">
                  Arabic <span
                    class="text-muted-foreground text-[10px] font-normal tracking-wider uppercase"
                    >(Optional)</span
                  >
                </Label>
                <div class="relative">
                  <Languages
                    class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                  />
                  <Input
                    id="arabic"
                    name="script_arabic"
                    bind:value={$form.script_arabic}
                    placeholder="e.g. أغروم"
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
                Create the headword first. You will be able to add definitions, examples, and audio
                recordings on the next screen.
              </p>
            </div>

            <Button type="submit" class="w-full" disabled={$delayed}>
              {#if $delayed}
                <div
                  class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                ></div>
                Creating Headword...
              {:else}
                Create Word Entry
              {/if}
            </Button>
          </form>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</div>
