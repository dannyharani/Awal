<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { locales, setLocale } from '$lib/paraglide/runtime';
  import { mode, setMode } from 'mode-watcher';

  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Avatar from '$lib/components/ui/avatar';
  import { Badge } from '$lib/components/ui/badge';
  import { Label } from '$lib/components/ui/label';
  import { Separator } from '$lib/components/ui/separator';
  import { Shield, Moon, Sun, Languages, ChevronRight, Loader, ExternalLink } from '@lucide/svelte';

  let { data } = $props();
  const { profile } = $derived(data);

  // svelte-ignore state_referenced_locally
  const { form, enhance, delayed, message } = superForm(data.form, {
    onUpdate({ form, result }) {
      if (form.valid && result.type === 'success') {
        const newLang = form.data.preferred_locale as (typeof locales)[number];
        document.cookie = `PARAGLIDE_LOCALE=${newLang}; path=/; max-age=34560000; SameSite=Lax`;
        setLocale(newLang, { reload: true });
        window.location.reload();
      }
    }
  });

  const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
</script>

<div class="space-y-6">
  <Card.Root>
    <Card.Header>
      <Card.Title>Account Overview</Card.Title>
      <Card.Description>Your basic account information and community standing.</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
        <div class="flex items-center gap-4">
          <Avatar.Root class="h-12 w-12 border">
            <Avatar.Image src={profile.avatar_url} />
            <Avatar.Fallback>{profile.username.slice(0, 2).toUpperCase()}</Avatar.Fallback>
          </Avatar.Root>
          <div>
            <p class="leading-none font-medium">@{profile.username}</p>
            <div class="mt-1.5 flex items-center gap-2">
              <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'} class="h-5 text-[10px] uppercase">
                {profile.role}
              </Badge>
              <span class="text-muted-foreground text-xs">Reputation: {profile.reputation_points}</span>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" href="/user/{profile.username}" class="gap-1 text-xs">
            Public Profile <ExternalLink class="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" href="/settings/profile">
            Edit Profile <ChevronRight class="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card.Content>
  </Card.Root>

  <form method="POST" action="?/updatePreferences" use:enhance>
    <Card.Root>
      <Card.Header>
        <Card.Title>App Preferences</Card.Title>
        <Card.Description>Customize how Awal looks and feels.</Card.Description>
      </Card.Header>
      <Card.Content class="space-y-8">
        <div class="grid gap-2">
          <Label class="flex items-center gap-2">
            <Languages class="text-muted-foreground h-4 w-4" />
            Interface Language
          </Label>
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {#each locales as lang}
              <label class="relative cursor-pointer">
                <input
                  type="radio"
                  name="preferred_locale"
                  value={lang}
                  class="peer sr-only"
                  bind:group={$form.preferred_locale}
                />
                <div
                  class="hover:bg-accent hover:text-accent-foreground flex flex-col items-center justify-center rounded-md border-2 p-3 text-center transition-all
                    {lang === $form.preferred_locale
                    ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
                    : 'border-muted bg-popover'}"
                >
                  <span class="block font-bold tracking-wider uppercase">{lang}</span>
                  <span class="text-muted-foreground text-xs capitalize">
                    {displayNames.of(lang)}
                  </span>

                  {#if lang === $form.preferred_locale}
                    <span class="absolute top-2 right-2 flex h-2 w-2">
                      <span class="bg-primary absolute inline-flex h-full w-full rounded-full opacity-75"></span>
                      <span class="bg-primary relative inline-flex h-2 w-2 rounded-full"></span>
                    </span>
                  {/if}
                </div>
              </label>
            {/each}
          </div>
          <p class="text-muted-foreground text-[11px]">This updates the UI language immediately after saving.</p>
        </div>

        <Separator />

        <div class="grid gap-2">
          <Label class="flex items-center gap-2">
            <Sun class="text-muted-foreground h-4 w-4" />
            Appearance
          </Label>
          <div class="grid max-w-md grid-cols-2 gap-2 sm:grid-cols-3">
            <Button
              type="button"
              variant="ghost"
              class="justify-start gap-2 {mode.current === 'light' ? 'bg-accent' : ''}"
              onclick={() => setMode('light')}
            >
              <Sun class="h-4 w-4" /> Light
            </Button>
            <Button
              type="button"
              variant="ghost"
              class="justify-start gap-2 {mode.current == 'dark' ? 'bg-accent' : ''}"
              onclick={() => setMode('dark')}
            >
              <Moon class="h-4 w-4" /> Dark
            </Button>
          </div>
        </div>
      </Card.Content>

      <Card.Footer class="flex items-center justify-between border-t pt-4">
        <p class="text-muted-foreground text-xs">
          {#if $message}
            <span class="font-medium text-green-600">{$message}</span>
          {:else}
            Settings are auto-saved locally, click to persist language.
          {/if}
        </p>
        <Button type="submit" disabled={$delayed} size="sm">
          {#if $delayed}
            <Loader class="mr-2 h-3 w-3 animate-spin" /> Saving...
          {:else}
            Save Preferences
          {/if}
        </Button>
      </Card.Footer>
    </Card.Root>
  </form>

  <Card.Root class="bg-muted/10 border-dashed opacity-70 shadow-none">
    <Card.Header>
      <Card.Title class="text-muted-foreground flex items-center gap-2 text-base">
        <Shield class="h-4 w-4" /> Security & Notifications
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <p class="text-muted-foreground text-sm">
        Password changes, 2FA, and email notification settings will be available in a future update.
      </p>
    </Card.Content>
  </Card.Root>
</div>
