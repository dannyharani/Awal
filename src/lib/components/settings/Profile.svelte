<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import * as Avatar from '$lib/components/ui/avatar';
  import * as Card from '$lib/components/ui/card';
  import { Separator } from '$lib/components/ui/separator';
  import { Loader, CircleCheck, Upload } from '@lucide/svelte';

  let { data } = $props();
  const { profile } = $derived(data);

  // svelte-ignore state_referenced_locally
  const { form, errors, enhance, delayed, message } = superForm(data.form, {
    resetForm: false
  });

  // Local state for image preview
  // svelte-ignore state_referenced_locally
  let previewUrl = $state(profile?.avatar_url);
  let fileInput: HTMLInputElement; // Reference to the hidden input

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      previewUrl = URL.createObjectURL(file);
    }
  }

  function triggerFileInput() {
    fileInput?.click();
  }
</script>

<div class="container mx-auto max-w-3xl py-10">
  <form method="POST" action="?/updateProfile" enctype="multipart/form-data" use:enhance>
    <div class="space-y-6">
      <div>
        <h3 class="text-2xl font-bold tracking-tight">Profile Settings</h3>
        <p class="text-muted-foreground">
          Manage your public profile and how others see you on Aselkim.
        </p>
      </div>

      {#if $message}
        <div
          class="animate-in fade-in slide-in-from-top-2 flex items-center gap-2 rounded-md border border-green-500/20 bg-green-500/10 p-3 text-sm font-medium text-green-600"
        >
          <CircleCheck class="h-4 w-4" />
          {$message}
        </div>
      {/if}

      <Card.Root>
        <Card.Content class="space-y-8 p-6">
          <div class="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar.Root class="border-muted h-24 w-24 border-2 shadow-sm">
              <Avatar.Image src={previewUrl} class="object-cover" />
              <Avatar.Fallback class="bg-muted text-2xl font-bold">
                {profile?.username?.slice(0, 2).toUpperCase() ?? 'ME'}
              </Avatar.Fallback>
            </Avatar.Root>

            <div class="flex-1 space-y-2">
              <Label class="text-base font-semibold">Profile Picture</Label>
              <div class="flex items-center gap-3">
                <Button variant="outline" size="sm" type="button" onclick={triggerFileInput}>
                  <Upload class="mr-2 h-4 w-4" />
                  Change photo
                </Button>
                <input
                  bind:this={fileInput}
                  id="avatar"
                  type="file"
                  name="avatar"
                  accept="image/*"
                  class="hidden"
                  onchange={handleFileSelect}
                />
              </div>
              <p class="text-muted-foreground text-[13px]">
                Supports JPG, GIF or PNG. Max size 2MB.
              </p>
            </div>
          </div>

          <Separator />

          <div class="grid gap-6 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="first_name">First Name</Label>
              <Input name="first_name" bind:value={$form.first_name} placeholder="Danny" />
              {#if $errors.first_name}
                <span class="text-destructive text-xs">{$errors.first_name}</span>
              {/if}
            </div>

            <div class="space-y-2">
              <Label for="last_name">Last Name</Label>
              <Input name="last_name" bind:value={$form.last_name} placeholder="Harani" />
              {#if $errors.last_name}
                <span class="text-destructive text-xs">{$errors.last_name}</span>
              {/if}
            </div>
          </div>

          <div class="space-y-2">
            <Label for="username">Username</Label>
            <div class="relative">
              <Input name="username" bind:value={$form.username} placeholder="danny_harani" />
            </div>
            <div class="flex justify-between">
              <p class="text-muted-foreground text-[11px]">Public display name. No spaces.</p>
              {#if $errors.username}
                <span class="text-destructive text-xs">{$errors.username}</span>
              {/if}
            </div>
          </div>

          <div class="space-y-2">
            <Label for="bio">Bio</Label>
            <Textarea
              name="bio"
              bind:value={$form.bio}
              placeholder="Tell us a little about yourself..."
              class="min-h-[120px] resize-y"
            />
            <div class="flex items-center justify-between">
              {#if $errors.bio}
                <span class="text-destructive text-xs">{$errors.bio}</span>
              {:else}
                <span></span>
              {/if}
              <span
                class="text-muted-foreground text-xs {($form.bio?.length ?? 0) > 160
                  ? 'text-destructive'
                  : ''}"
              >
                {$form.bio?.length ?? 0}/160
              </span>
            </div>
          </div>
        </Card.Content>

        <Card.Footer class="bg-muted/20 flex justify-end border-t px-6 py-4">
          <Button type="submit" disabled={$delayed} class="min-w-[140px]">
            {#if $delayed}
              <Loader class="mr-2 h-4 w-4 animate-spin" />
              Saving...
            {:else}
              Save Changes
            {/if}
          </Button>
        </Card.Footer>
      </Card.Root>
    </div>
  </form>
</div>
