<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Input } from '$lib/components/ui/input';
  import { Separator } from '$lib/components/ui/separator';

  // Icons
  import { Pencil, Trash2, Plus, X, Mic, Play, Languages, Type } from '@lucide/svelte';

  let { definition, dialects } = $props();
  let open = $state(false);
  let loading = $state(false);

  // Helper to display language name
  const langName = new Intl.DisplayNames(['en'], { type: 'language' }).of(
    // svelte-ignore state_referenced_locally
    definition.language_code || 'en'
  );
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>
    {#snippet child({ props })}
      <Button
        variant="ghost"
        size="icon"
        class="text-muted-foreground hover:text-foreground h-6 w-6"
        {...props}
      >
        <Pencil class="h-3.5 w-3.5" />
      </Button>
    {/snippet}
  </Dialog.Trigger>

  <Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
    <Dialog.Header>
      <Dialog.Title>Manage Definition</Dialog.Title>
    </Dialog.Header>

    <div class="py-4">
      <div class="bg-muted/40 mb-6 flex items-center gap-2 rounded-md border px-3 py-2">
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
            update();
          };
        }}
        class="grid gap-5"
      >
        <input type="hidden" name="definition_id" value={definition.id} />

        <div class="space-y-4">
          <div class="space-y-2">
            <Label>Dialect</Label>
            <div class="relative">
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
          </div>

          <div class="space-y-2">
            <Label>Definition</Label>
            <Textarea
              name="definition_text"
              class="min-h-[80px] resize-none"
              value={definition.definition_text}
            />
          </div>
        </div>

        <div class="bg-muted/30 rounded-lg border border-dashed p-4">
          <div
            class="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider uppercase"
          >
            <Mic class="h-3 w-3" /> Audio
          </div>

          {#if definition.audio_url}
            <div class="bg-background flex items-center justify-between rounded-md border p-2">
              <div class="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  class="h-8 w-8 rounded-full"
                  type="button"
                  onclick={() => new Audio(definition.audio_url).play()}
                >
                  <Play class="ml-0.5 h-4 w-4" />
                </Button>
                <span class="text-muted-foreground text-xs font-medium">Recorded</span>
              </div>
              <Button
                type="submit"
                formaction="?/deleteAudio"
                variant="ghost"
                size="sm"
                class="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 gap-2"
              >
                <Trash2 class="h-3.5 w-3.5" />
                <span class="text-xs">Remove</span>
              </Button>
            </div>
          {:else}
            <div class="space-y-2">
              <Label class="text-xs">Upload new recording</Label>
              <input
                type="file"
                name="audio"
                accept="audio/*"
                class="border-input bg-background text-muted-foreground file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-xs file:border-0 file:bg-transparent file:text-xs file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
            </div>
          {/if}
        </div>

        <div class="flex justify-end">
          <Button type="submit" size="sm" disabled={loading}>Save Changes</Button>
        </div>
      </form>

      <Separator class="my-6" />

      <div class="space-y-4">
        <div
          class="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase"
        >
          <Type class="h-3 w-3" /> Examples
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
                    class="text-destructive h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
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
          <div class="grid flex-1 gap-1">
            <Input name="sentence" placeholder="New Amazigh sentence..." class="h-8 text-xs" />
            <Input name="translation" placeholder="Translation..." class="h-8 text-xs" />
          </div>
          <Button type="submit" size="icon" variant="outline" class="h-16 w-10 shrink-0">
            <Plus class="h-4 w-4" />
          </Button>
        </form>
      </div>

      <Separator class="my-6" />

      <div class="border-destructive/20 bg-destructive/5 rounded-md border p-4">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-destructive text-sm font-medium">Delete Definition</p>
            <p class="text-muted-foreground text-xs">This action cannot be undone.</p>
          </div>
          <form
            method="POST"
            action="?/deleteDefinition"
            use:enhance={() => {
              return async ({ update }) => {
                open = false;
                update();
              };
            }}
          >
            <input type="hidden" name="definition_id" value={definition.id} />
            <Button variant="destructive" size="sm" type="submit">
              <Trash2 class="mr-2 h-3 w-3" /> Delete
            </Button>
          </form>
        </div>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
