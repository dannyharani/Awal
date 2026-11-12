<script lang="ts">
  import { page } from '$app/state';
  import * as Avatar from '$lib/components/ui/avatar';
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import AmazighWord from '$lib/components/dictionary/AmazighWord.svelte';
  import {
    Users,
    Search,
    Award,
    BookOpen,
    GraduationCap,
    Sparkles,
    ArrowRight,
    Calendar,
    MessageSquareQuote,
    UserCheck,
    X
  } from '@lucide/svelte';

  let { data } = $props();
  const { members } = $derived(data);
  let currentUsername = $derived(page.data.username);

  let searchQuery = $state('');
  let roleFilter = $state<'all' | 'educators' | 'contributors'>('all');
  let sortBy = $state<'reputation' | 'contributions' | 'newest'>('reputation');

  let filteredMembers = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = members.filter((m) => {
      if (roleFilter === 'educators') {
        if (m.role !== 'admin' && m.role !== 'instructor' && m.role !== 'moderator') return false;
      } else if (roleFilter === 'contributors') {
        if (m.totalContributions === 0 && (m.reputation_points ?? 0) === 0) return false;
      }

      if (q.length > 0) {
        const fullName = `${m.first_name ?? ''} ${m.last_name ?? ''}`.toLowerCase();
        const uname = (m.username ?? '').toLowerCase();
        const bio = (m.bio ?? '').toLowerCase();
        if (!fullName.includes(q) && !uname.includes(q) && !bio.includes(q)) {
          return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'contributions') {
        return b.totalContributions - a.totalContributions || b.reputation_points - a.reputation_points;
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      }
      return b.reputation_points - a.reputation_points || b.totalContributions - a.totalContributions;
    });
  });

  let totalEducators = $derived(
    members.filter((m) => m.role === 'admin' || m.role === 'instructor' || m.role === 'moderator').length
  );
  let totalContributionsAll = $derived(members.reduce((acc, m) => acc + m.totalContributions, 0));
  let totalLessonsAll = $derived(members.reduce((acc, m) => acc + m.lessonsCompletedCount, 0));
</script>

<div class="container mx-auto max-w-6xl space-y-10 px-4 py-10">
  <!-- Header Banner -->
  <div class="flex flex-wrap items-end justify-between gap-4 border-b pb-8">
    <div class="max-w-2xl space-y-2">
      <div class="text-primary flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
        <Users class="h-4 w-4" />
        <span>Community Directory • ⴰⵎⵣⴷⴰⵢ</span>
      </div>
      <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl">
        The <AmazighWord word="Asafu" />
        <AmazighWord word="Amezday" showTifinaghInline />
      </h1>
      <p class="text-muted-foreground text-lg">
        Meet the contributors, native speakers, educators, and learners preserving
        <AmazighWord word="Tamaziɣt" /> across <AmazighWord word="Tamazɣa" /> and the diaspora.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      {#if currentUsername}
        <Button variant="outline" href="/user/{currentUsername}" class="gap-1.5">
          <UserCheck class="h-4 w-4" />
          My Public Profile
        </Button>
      {/if}
      <Button href="/add" class="gap-1.5">
        <Sparkles class="h-4 w-4" />
        Contribute & Earn XP
      </Button>
    </div>
  </div>

  <!-- Community Summary Metrics -->
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
    <div class="bg-card rounded-xl border p-4 shadow-xs">
      <p class="text-2xl font-extrabold">{members.length}</p>
      <p class="text-muted-foreground text-xs font-medium">Registered Members</p>
    </div>
    <div class="bg-card rounded-xl border p-4 shadow-xs">
      <p class="text-2xl font-extrabold">{totalEducators}</p>
      <p class="text-muted-foreground text-xs font-medium">Educators & Moderators</p>
    </div>
    <div class="bg-card rounded-xl border p-4 shadow-xs">
      <p class="text-2xl font-extrabold">{totalContributionsAll}</p>
      <p class="text-muted-foreground text-xs font-medium">Definitions & Examples</p>
    </div>
    <div class="bg-card rounded-xl border p-4 shadow-xs">
      <p class="text-2xl font-extrabold">{totalLessonsAll}</p>
      <p class="text-muted-foreground text-xs font-medium">Lessons Completed</p>
    </div>
  </div>

  <!-- Search, Role Filter & Sort Bar -->
  <div class="bg-muted/20 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onclick={() => (roleFilter = 'all')}
        class="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors {roleFilter === 'all'
          ? 'bg-primary text-primary-foreground shadow-xs'
          : 'bg-background text-muted-foreground hover:text-foreground border'}"
      >
        All Members ({members.length})
      </button>
      <button
        type="button"
        onclick={() => (roleFilter = 'educators')}
        class="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors {roleFilter === 'educators'
          ? 'bg-primary text-primary-foreground shadow-xs'
          : 'bg-background text-muted-foreground hover:text-foreground border'}"
      >
        Educators & Curators ({totalEducators})
      </button>
      <button
        type="button"
        onclick={() => (roleFilter = 'contributors')}
        class="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors {roleFilter === 'contributors'
          ? 'bg-primary text-primary-foreground shadow-xs'
          : 'bg-background text-muted-foreground hover:text-foreground border'}"
      >
        Active Contributors
      </button>
    </div>

    <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      <div class="relative w-full sm:w-72">
        <Search class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
        <Input
          type="search"
          bind:value={searchQuery}
          placeholder="Search name, @username, or bio..."
          class="h-9 pl-9 text-xs"
        />
      </div>

      <select
        bind:value={sortBy}
        aria-label="Sort community members"
        class="border-input bg-background h-9 w-full rounded-md border px-3 text-xs font-medium sm:w-auto"
      >
        <option value="reputation">Sort: Highest Reputation</option>
        <option value="contributions">Sort: Most Contributions</option>
        <option value="newest">Sort: Newest Joined</option>
      </select>

      {#if searchQuery || roleFilter !== 'all'}
        <Button
          variant="ghost"
          size="sm"
          onclick={() => {
            searchQuery = '';
            roleFilter = 'all';
          }}
          class="h-9 gap-1 text-xs"
        >
          <X class="h-3.5 w-3.5" />
          Reset
        </Button>
      {/if}
    </div>
  </div>

  <!-- Members Grid -->
  {#if filteredMembers.length === 0}
    <Card.Root class="border-dashed py-16 text-center">
      <Card.Content class="space-y-3">
        <Users class="text-muted-foreground mx-auto h-10 w-10 opacity-40" />
        <p class="text-lg font-semibold">No members match your filter</p>
        <p class="text-muted-foreground text-sm">Try clearing your search query or switching back to All Members.</p>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {#each filteredMembers as member (member.id)}
        {@const displayName =
          member.first_name || member.last_name
            ? `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim()
            : member.username}
        <a href="/user/{member.username}" class="group block">
          <Card.Root
            class="hover:border-primary/50 flex h-full flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <Card.Header class="space-y-3 pb-3">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-center gap-3 overflow-hidden">
                  <Avatar.Root class="h-12 w-12 shrink-0 border-2">
                    <Avatar.Image src={member.avatar_url} alt={member.username} />
                    <Avatar.Fallback class="text-sm font-bold">
                      {member.username.slice(0, 2).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <div class="truncate">
                    <Card.Title class="group-hover:text-primary truncate text-base transition-colors">
                      {displayName}
                    </Card.Title>
                    <p class="text-muted-foreground truncate text-xs">@{member.username}</p>
                  </div>
                </div>

                <span
                  class="bg-primary/10 text-primary inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
                >
                  <Award class="h-3.5 w-3.5" />
                  {member.reputation_points}
                </span>
              </div>

              <div class="flex flex-wrap items-center gap-1.5">
                {#if member.role && member.role !== 'user'}
                  <Badge variant="default" class="text-[10px] capitalize">
                    {member.role}
                  </Badge>
                {:else}
                  <Badge variant="secondary" class="text-[10px]">Member</Badge>
                {/if}

                {#if member.created_at}
                  <span class="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
                    <Calendar class="h-3 w-3" />
                    Joined {new Date(member.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                {/if}
              </div>

              {#if member.bio}
                <p class="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                  {member.bio}
                </p>
              {:else}
                <p class="text-muted-foreground/60 text-xs italic">Asafu community member</p>
              {/if}
            </Card.Header>

            <Card.Footer class="bg-muted/20 flex items-center justify-between border-t px-5 py-3 text-xs">
              <div class="text-muted-foreground flex items-center gap-3">
                <span class="inline-flex items-center gap-1" title="Definitions contributed">
                  <BookOpen class="h-3.5 w-3.5" />
                  {member.definitionsCount}
                </span>
                <span class="inline-flex items-center gap-1" title="Example sentences">
                  <MessageSquareQuote class="h-3.5 w-3.5" />
                  {member.examplesCount}
                </span>
                <span class="inline-flex items-center gap-1" title="Lessons completed">
                  <GraduationCap class="h-3.5 w-3.5" />
                  {member.lessonsCompletedCount}
                </span>
              </div>

              <span class="text-primary inline-flex items-center gap-1 font-semibold group-hover:underline">
                Profile
                <ArrowRight class="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Card.Footer>
          </Card.Root>
        </a>
      {/each}
    </div>
  {/if}
</div>
