<script lang="ts">
  import { page } from '$app/state';
  import * as Avatar from '$lib/components/ui/avatar';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import { Trophy, BookOpen, Star, Calendar, ArrowRight, Settings } from '@lucide/svelte';

  let { data } = $props();
  const { profile, stats, contributions } = $derived(data);

  // Get the logged-in user from the root layout data
  let { user } = $derived(page.data);

  // Check if this is MY profile
  let isOwnProfile = $derived(user?.id === profile.id);
</script>

<div class="container mx-auto max-w-4xl px-4 py-12">
  <div class="mb-12 flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
    <Avatar.Root
      class="border-background ring-border/20 h-32 w-32 shrink-0 border-4 shadow-xl ring-1 md:h-40 md:w-40"
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
        <div class="space-y-1">
          <h1 class="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {profile.first_name + ' ' + profile.last_name}
          </h1>
          <div
            class="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-start"
          >
            <p class="text-foreground font-medium">@{profile.username}</p>
            <span class="hidden md:inline">•</span>
            <div class="flex items-center gap-1.5 text-sm">
              <Calendar class="h-3.5 w-3.5" />
              <span
                >Joined {profile.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric'
                }) : ''}</span>
              >
            </div>
          </div>
        </div>

        {#if isOwnProfile}
          <Button variant="outline" class="group gap-2 shadow-sm" href="/settings/profile">
            <Settings class="h-4 w-4 transition-transform group-hover:rotate-45" />
            Edit Profile
          </Button>
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

      <div
        class="mt-2 flex flex-wrap justify-center gap-6 border-t pt-6 md:justify-start md:gap-12"
      >
        <div class="flex flex-col items-center gap-1 md:items-start">
          <div class="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <Trophy class="h-4 w-4 text-yellow-500" />
            Reputation
          </div>
          <span class="text-2xl font-bold tracking-tight"
            >{stats.reputation_score.toLocaleString()}</span
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
          <Card.Root class="group hover:border-primary/40 p-0 transition-all hover:shadow-sm">
            <Card.Header class="pt-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
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
              class="bg-muted/30 text-muted-foreground flex items-center justify-between border-t px-6 py-6 text-xs"
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
