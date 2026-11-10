<script lang="ts">
  import { page } from '$app/state';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import * as Avatar from '$lib/components/ui/avatar';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Settings, LogOut, User, Sparkles, ExternalLink, Users, Bookmark } from '@lucide/svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import * as m from '$lib/paraglide/messages.js';

  let session = $derived(page.data.session);
  let role = $derived(page.data.role);
  let username = $derived(page.data.username);
  let supabase = $derived(page.data.supabase);
  let userProfile = $derived(session?.user?.user_metadata);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${page.url.origin}/auth/callback`
      }
    });
  };

  const redirectPublicProfile = async () => {
    if (username) {
      goto(`/user/${username}`);
    } else {
      goto('/settings/profile');
    }
  };
  const redirectEditProfile = async () => {
    goto('/settings/profile');
  };
  const redirectSavedWords = async () => {
    goto('/saved');
  };
  const redirectSettings = async () => {
    goto('/settings');
  };
  const redirectStudio = async () => {
    goto('/admin/courses');
  };
  const redirectCommunity = async () => {
    goto('/community');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    invalidateAll();
    window.location.reload();
  };
</script>

{#if session}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      class={buttonVariants({ variant: 'ghost', class: 'relative h-8 w-8 rounded-full' })}
    >
      <Avatar.Root class="h-8 w-8">
        <Avatar.Image src={userProfile?.avatar_url} alt={userProfile?.full_name} />
        <Avatar.Fallback>{userProfile?.full_name?.slice(0, 2) ?? 'U'}</Avatar.Fallback>
      </Avatar.Root>
    </DropdownMenu.Trigger>

    <DropdownMenu.Content class="w-56" align="end">
      <DropdownMenu.Label class="flex flex-col">
        <span>{m.nav_my_account()}</span>
        {#if username}
          <span class="text-muted-foreground text-xs font-normal">@{username}</span>
        {/if}
      </DropdownMenu.Label>
      <DropdownMenu.Separator />
      {#if role === 'admin' || role === 'instructor'}
        <DropdownMenu.Item onclick={redirectStudio}>
          <Sparkles class="mr-2 h-4 w-4" />
          {m.nav_studio()}
        </DropdownMenu.Item>
      {/if}
      {#if username}
        <DropdownMenu.Item onclick={redirectPublicProfile}>
          <ExternalLink class="mr-2 h-4 w-4" />
          Public {m.nav_profile()}
        </DropdownMenu.Item>
      {/if}
      <DropdownMenu.Item onclick={redirectEditProfile}>
        <User class="mr-2 h-4 w-4" />
        Edit {m.nav_profile()}
      </DropdownMenu.Item>
      <DropdownMenu.Item onclick={redirectSavedWords}>
        <Bookmark class="mr-2 h-4 w-4" />
        {m.nav_saved_words()}
      </DropdownMenu.Item>
      <DropdownMenu.Item onclick={redirectSettings}>
        <Settings class="mr-2 h-4 w-4" />
        {m.settings_title()}
      </DropdownMenu.Item>
      <DropdownMenu.Item onclick={redirectCommunity}>
        <Users class="mr-2 h-4 w-4" />
        {m.nav_community()}
      </DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item onclick={handleLogout}>
        <LogOut class="mr-2 h-4 w-4" />
        {m.nav_logout()}
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{:else}
  <Button onclick={handleLogin} size="sm" variant="default">{m.nav_sign_in()}</Button>
{/if}
