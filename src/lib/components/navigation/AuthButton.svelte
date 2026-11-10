<script lang="ts">
  import { page } from '$app/state';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import * as Avatar from '$lib/components/ui/avatar';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Settings, LogOut, User, Sparkles } from '@lucide/svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import * as m from '$lib/paraglide/messages.js';

  let session = $derived(page.data.session);
  let role = $derived(page.data.role);
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

  const redirectProfile = async () => {
    goto('/settings/profile');
  };
  const redirectSettings = async () => {
    goto('/settings');
  };
  const redirectStudio = async () => {
    goto('/admin/courses');
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
      <DropdownMenu.Label>{m.nav_my_account()}</DropdownMenu.Label>
      <DropdownMenu.Separator />
      {#if role === 'admin' || role === 'instructor'}
        <DropdownMenu.Item onclick={redirectStudio}>
          <Sparkles class="mr-2 h-4 w-4" />
          {m.nav_studio()}
        </DropdownMenu.Item>
      {/if}
      <DropdownMenu.Item onclick={redirectProfile}>
        <User class="mr-2 h-4 w-4" />
        {m.nav_profile()}
      </DropdownMenu.Item>
      <DropdownMenu.Item onclick={redirectSettings}>
        <Settings class="mr-2 h-4 w-4" />
        {m.settings_title()}
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
