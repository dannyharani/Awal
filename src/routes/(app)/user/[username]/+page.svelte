<script lang="ts">
  import { page } from '$app/state';
  import * as Avatar from '$lib/components/ui/avatar';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import { Trophy, BookOpen, Star, Calendar, ArrowRight, ArrowLeft, Settings, Bookmark, Crown, ShieldAlert, ShieldCheck } from '@lucide/svelte';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();
  const { profile, stats, contributions } = $derived(data);

  // Get the logged-in user from the root layout data
  let { user } = $derived(page.data);

  // Check if this is MY profile
  let isOwnProfile = $derived(user?.id === profile.id);
  let isOwner = $derived(data.isOwner);
  let isBlocked = $derived(Boolean((profile as any)?.is_blocked));
  let displayName = $derived(
    profile.first_name || profile.last_name
      ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
      : profile.username
  );

  let selectedRole = $state('user');
  $effect(() => {
    selectedRole = profile.role ?? 'user';
  });
</script>

<div class="container mx-auto max-w-4xl px-4 py-10">
  <div class="mb-6">
    <Button variant="ghost" size="sm" href="/community" class="text-muted-foreground hover:text-foreground -ml-2 gap-1.5 text-xs">
      <ArrowLeft class="h-3.5 w-3.5" />
      Back to Community Directory
    </Button>
  </div>

  <div class="mb-12 flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
    <Avatar.Root
      class="border-background ring-border/20 mx-auto h-32 w-32 shrink-0 border-4 shadow-xl ring-1 md:mx-0 md:h-40 md:w-40"
    >
      <Avatar.Image src={profile.avatar_url} alt={profile.username} class="object-cover" />
      <Avatar.Fallback
        class="bg-muted text-muted-foreground flex items-center justify-center text-5xl font-bold"
      >
        {profile.username.slice(0, 2).toUpperCase()}
      </Avatar.Fallback>
    </Avatar.Root>

    <div class="flex min-w-0 flex-1 flex-col gap-4 text-center md:text-left">
      <div class="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div class="space-y-1.5">
          <div class="flex flex-wrap items-center justify-center gap-2.5 md:justify-start">
            <h1 class="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {displayName}
            </h1>
            {#if profile.role === 'owner'}
              <Badge class="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs font-semibold uppercase">
                <Crown class="h-3 w-3 text-amber-500" />
                Creator & Owner
              </Badge>
            {:else if profile.role && profile.role !== 'user'}
              <Badge variant="default" class="text-xs capitalize">
                {profile.role}
              </Badge>
            {/if}
            {#if isBlocked}
              <Badge variant="destructive" class="gap-1 text-xs font-semibold uppercase">
                <ShieldAlert class="h-3 w-3" />
                Suspended
              </Badge>
            {/if}
          </div>
          <div
            class="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-start"
          >
            <p class="text-foreground font-medium">@{profile.username}</p>
            <span class="hidden md:inline">•</span>
            <div class="flex items-center gap-1.5 text-sm">
              <Calendar class="h-3.5 w-3.5" />
              <span>
                Joined {profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString(undefined, {
                      month: 'long',
                      year: 'numeric'
                    })
                  : ''}
              </span>
            </div>
          </div>
        </div>

        {#if isOwnProfile}
          <div class="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <Button variant="outline" class="group gap-2 shadow-xs" href="/saved">
              <Bookmark class="h-4 w-4 text-primary" />
              <span>{m.nav_saved_words()}</span>
            </Button>
            <Button variant="outline" class="group gap-2 shadow-xs" href="/settings/profile">
              <Settings class="h-4 w-4 transition-transform group-hover:rotate-45" />
              <span>Edit Profile</span>
            </Button>
          </div>
        {/if}
      </div>

      {#if profile.bio}
        <p class="text-muted-foreground max-w-2xl text-lg leading-relaxed">
          {profile.bio}
        </p>
      {:else if isOwnProfile}
        <p class="text-muted-foreground italic">
          You haven't added a bio yet. <a
            href="/settings/profile"
            class="hover:text-primary underline">Add one now.</a
          >
        </p>
      {/if}

      <!-- Creator & Owner Moderation Console -->
      {#if isOwner && !isOwnProfile}
        <div class="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-left shadow-xs">
          <div class="mb-3 flex items-center justify-between">
            <span class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Crown class="h-4 w-4" />
              Creator Administration Console
            </span>
            <span class="text-[11px] text-muted-foreground">User ID: <code class="text-[10px]">{profile.id}</code></span>
          </div>

          <div class="flex flex-wrap items-center gap-4">
            <!-- Role Selector -->
            <form method="POST" action="?/updateUserRole" class="flex items-center gap-2">
              <input type="hidden" name="target_user_id" value={profile.id} />
              <label for="new_role" class="text-xs font-medium text-foreground">Role:</label>
              <select
                id="new_role"
                name="new_role"
                bind:value={selectedRole}
                class="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs font-medium shadow-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
              >
                <option value="user">User (Standard)</option>
                <option value="moderator">Moderator (Dictionary)</option>
                <option value="instructor">Instructor (Courses & Studio)</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner / Creator</option>
              </select>
              <Button type="submit" size="sm" variant="outline" class="h-8 text-xs">
                Save Role
              </Button>
            </form>

            <Separator orientation="vertical" class="hidden h-6 md:block" />

            <!-- Block / Unblock Toggle -->
            <form method="POST" action="?/toggleBlockUser" class="flex items-center gap-2">
              <input type="hidden" name="target_user_id" value={profile.id} />
              <input type="hidden" name="block_action" value={isBlocked ? 'unblock' : 'block'} />
              {#if isBlocked}
                <Button type="submit" size="sm" variant="outline" class="h-8 gap-1.5 border-emerald-500/40 text-xs text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                  <ShieldCheck class="h-3.5 w-3.5" />
                  Unblock User
                </Button>
              {:else}
                <Button type="submit" size="sm" variant="destructive" class="h-8 gap-1.5 text-xs">
                  <ShieldAlert class="h-3.5 w-3.5" />
                  Block / Suspend User
                </Button>
              {/if}
            </form>
          </div>
        </div>
      {/if}

      <div
        class="mt-2 flex flex-wrap justify-center gap-6 border-t pt-6 md:justify-start md:gap-12"
      >
        <div class="flex flex-col items-center gap-1 md:items-start">
          <div class="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <Trophy class="h-4 w-4 text-yellow-500" />
            Reputation
          </div>
          <span class="text-2xl font-bold tracking-tight"
            >{(profile.reputation_points ?? stats.reputation_score ?? 0).toLocaleString()}</span
          >
        </div>

        <div class="flex flex-col items-center gap-1 md:items-start">
          <div class="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <BookOpen class="h-4 w-4 text-blue-500" />
            Contributions
          </div>
          <span class="text-2xl font-bold tracking-tight"
            >{stats.definition_count.toLocaleString()}</span
          >
        </div>

        <div class="flex flex-col items-center gap-1 md:items-start">
          <div class="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <Star class="h-4 w-4 text-orange-500" />
            Upvotes
          </div>
          <span class="text-2xl font-bold tracking-tight"
            >{stats.total_upvotes.toLocaleString()}</span
          >
        </div>
      </div>
    </div>
  </div>

  <Separator class="my-10" />

  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold tracking-tight">Recent Contributions</h2>
    </div>

    {#if contributions.length > 0}
      <div class="grid gap-4">
        {#each contributions as def}
          <Card.Root class="group hover:border-primary/40 gap-4 pt-5 pb-0 transition-all hover:shadow-sm">
            <Card.Header>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2.5">
                  <a
                    href="/word/{def.headword?.slug}"
                    class="decoration-primary text-lg font-bold decoration-2 underline-offset-4 hover:underline"
                  >
                    {def.headword?.script_latin}
                  </a>
                  {#if def.headword?.script_tifinagh}
                    <span
                      class="text-muted-foreground font-tifinagh bg-muted/50 rounded px-2 py-0.5 text-sm"
                    >
                      {def.headword.script_tifinagh}
                    </span>
                  {/if}
                </div>
                <Badge variant="outline" class="text-xs font-normal">
                  {def.dialect?.name ?? 'General'}
                </Badge>
              </div>
            </Card.Header>

            <Card.Content>
              <p class="text-muted-foreground line-clamp-2 leading-relaxed italic">
                "{def.definition_text}"
              </p>
            </Card.Content>

            <Card.Footer
              class="bg-muted/30 text-muted-foreground flex items-center justify-between border-t py-3.5 text-xs"
            >
              <div class="flex items-center gap-4">
                <span class="flex items-center gap-1.5 font-medium">
                  <Star class="text-muted-foreground/70 h-3.5 w-3.5" />
                  {def.vote_score} points
                </span>
                <span>
                  {new Date(def.created_at).toLocaleDateString()}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                class="hover:text-primary h-7 gap-1 text-xs"
                href="/word/{def.headword?.slug}"
              >
                View <ArrowRight class="h-3 w-3" />
              </Button>
            </Card.Footer>
          </Card.Root>
        {/each}
      </div>
    {:else}
      <div
        class="bg-muted/10 flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center"
      >
        <div class="bg-muted mb-4 rounded-full p-4">
          <BookOpen class="text-muted-foreground h-8 w-8" />
        </div>
        <h3 class="text-lg font-medium">No contributions yet</h3>
        <p class="text-muted-foreground mx-auto mt-1 max-w-xs">
          {#if isOwnProfile}
            You haven't added any definitions yet. Why not start today?
            <br />
            <Button variant="link" href="/add" class="text-primary mt-2">Contribute a word</Button>
          {:else}
            This user hasn't added any definitions yet.
          {/if}
        </p>
      </div>
    {/if}
  </section>
</div>
