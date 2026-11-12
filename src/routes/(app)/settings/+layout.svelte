<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import { Settings, User, Bell, ExternalLink, Users } from '@lucide/svelte';
  import * as m from '$lib/paraglide/messages.js';

  let { children } = $props();

  let pathname = $derived(page.url.pathname);
  let username = $derived(page.data.username || page.data.profile?.username);
</script>

<div class="container mx-auto max-w-5xl space-y-8 px-4 py-10">
  <!-- Unified Settings & Profile Header -->
  <div class="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">{m.settings_title()}</h1>
      <p class="text-muted-foreground mt-1 text-sm">
        Manage your account preferences, public profile, and Asafu experience.
      </p>
    </div>

    {#if username}
      <Button variant="outline" size="sm" href="/user/{username}" class="gap-1.5 text-xs">
        <ExternalLink class="h-3.5 w-3.5" />
        View Public Profile (@{username})
      </Button>
    {/if}
  </div>

  <!-- Mobile Horizontal Tabs (visible below md) -->
  <div class="flex items-center gap-2 overflow-x-auto border-b pb-3 md:hidden">
    <Button
      variant={pathname === '/settings' ? 'default' : 'ghost'}
      size="sm"
      href="/settings"
      class="gap-1.5 text-xs"
    >
      <Settings class="h-3.5 w-3.5" />
      General
    </Button>
    <Button
      variant={pathname.startsWith('/settings/profile') ? 'default' : 'ghost'}
      size="sm"
      href="/settings/profile"
      class="gap-1.5 text-xs"
    >
      <User class="h-3.5 w-3.5" />
      Public Profile
    </Button>
    {#if username}
      <Button variant="ghost" size="sm" href="/user/{username}" class="gap-1.5 text-xs">
        <ExternalLink class="h-3.5 w-3.5" />
        Public Page
      </Button>
    {/if}
  </div>

  <!-- Cohesive 2-Column Layout -->
  <div class="grid gap-8 md:grid-cols-[240px_1fr]">
    <!-- Left Sidebar Navigation -->
    <nav class="hidden flex-col gap-1.5 text-sm md:flex" aria-label="Settings navigation">
      <Button
        variant="ghost"
        href="/settings"
        class="justify-start gap-2.5 {pathname === '/settings'
          ? 'bg-muted text-foreground font-semibold'
          : 'text-muted-foreground hover:text-foreground'}"
      >
        <Settings class="h-4 w-4" />
        General
      </Button>

      <Button
        variant="ghost"
        href="/settings/profile"
        class="justify-start gap-2.5 {pathname.startsWith('/settings/profile')
          ? 'bg-muted text-foreground font-semibold'
          : 'text-muted-foreground hover:text-foreground'}"
      >
        <User class="h-4 w-4" />
        Public Profile
      </Button>

      <Button
        variant="ghost"
        disabled
        class="text-muted-foreground cursor-not-allowed justify-start gap-2.5 opacity-50"
      >
        <Bell class="h-4 w-4" />
        Notifications
      </Button>

      {#if username}
        <div class="my-2 border-t pt-2">
          <Button
            variant="ghost"
            href="/user/{username}"
            class="text-muted-foreground hover:text-foreground w-full justify-between text-xs"
          >
            <span class="flex items-center gap-2">
              <Users class="h-4 w-4" />
              Public Showcase
            </span>
            <ExternalLink class="h-3.5 w-3.5" />
          </Button>
        </div>
      {/if}
    </nav>

    <!-- Active Settings / Profile Content -->
    <div class="min-w-0">
      {@render children()}
    </div>
  </div>
</div>
