<script lang="ts">
  import { page } from '$app/state';
  import AuthButton from './AuthButton.svelte';
  import LanguageSwitcher from './LanguageSwitcher.svelte';
  import SearchBar from '../layout/SearchBar.svelte';
  import { Button } from '$lib/components/ui/button';
  import {
    Plus,
    BookOpen,
    GraduationCap,
    Sparkles,
    Gamepad2,
    Users,
    Info,
    Menu,
    X,
    Bookmark,
    Search
  } from '@lucide/svelte';
  import * as m from '$lib/paraglide/messages.js';

  let role = $derived(page.data.role);
  let canAccessStudio = $derived(role === 'owner' || role === 'instructor');
  let pathname = $derived(page.url.pathname);

  let mobileMenuOpen = $state(false);

  // Close mobile menu on route change
  $effect(() => {
    // track pathname
    if (pathname) {
      mobileMenuOpen = false;
    }
  });
</script>

<header
  class="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur"
>
  <div class="container mx-auto flex h-14 max-w-screen-2xl items-center gap-3 px-4">
    <div class="flex items-center gap-4 xl:gap-6">
      <a href="/" class="flex items-center space-x-1 shrink-0">
        <span class="text-xl font-bold tracking-tight">
          Asafu <span class="text-primary font-serif">.</span>
        </span>
      </a>

      <!-- Desktop Navigation: Visible on xl screens (>= 1280px) to prevent cutoff -->
      <nav class="hidden items-center gap-4 text-sm font-medium xl:flex">
        <a
          href="/"
          class="flex items-center gap-1.5 transition-colors {pathname === '/' ||
          pathname.startsWith('/word')
            ? 'text-foreground font-semibold'
            : 'text-foreground/60 hover:text-foreground/80'}"
        >
          <BookOpen class="h-4 w-4" />
          {m.nav_dictionary()}
        </a>

        <a
          href="/courses"
          class="flex items-center gap-1.5 transition-colors {pathname.startsWith('/courses')
            ? 'text-foreground font-semibold'
            : 'text-foreground/60 hover:text-foreground/80'}"
        >
          <GraduationCap class="h-4 w-4" />
          {m.nav_courses()}
        </a>

        <a
          href="/games"
          class="flex items-center gap-1.5 transition-colors {pathname.startsWith('/games')
            ? 'text-foreground font-semibold'
            : 'text-foreground/60 hover:text-foreground/80'}"
        >
          <Gamepad2 class="h-4 w-4" />
          <span>{m.nav_games()}</span>
          <span class="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400">
            Play
          </span>
        </a>

        <a
          href="/community"
          class="flex items-center gap-1.5 transition-colors {pathname.startsWith('/community') ||
          pathname.startsWith('/user/')
            ? 'text-foreground font-semibold'
            : 'text-foreground/60 hover:text-foreground/80'}"
        >
          <Users class="h-4 w-4" />
          <span>{m.nav_community()}</span>
        </a>

        {#if canAccessStudio}
          <a
            href="/admin/courses"
            class="flex items-center gap-1.5 transition-colors {pathname.startsWith('/admin')
              ? 'text-primary font-semibold'
              : 'text-foreground/60 hover:text-foreground/80'}"
          >
            <Sparkles class="h-4 w-4" />
            {m.nav_studio()}
          </a>
        {/if}

        <a
          href="/about"
          class="transition-colors {pathname === '/about'
            ? 'text-foreground font-semibold'
            : 'text-foreground/60 hover:text-foreground/80'}"
        >
          {m.nav_about()}
        </a>
      </nav>
    </div>

    <div class="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
      <div class="min-w-0 flex-1 sm:max-w-xs md:max-w-sm">
        <SearchBar />
      </div>

      <LanguageSwitcher />

      <Button
        variant="ghost"
        size="icon"
        href="/saved"
        class="text-muted-foreground hover:text-foreground hidden h-9 w-9 shrink-0 sm:inline-flex {pathname === '/saved' ? 'text-primary bg-muted' : ''}"
        title={m.nav_saved_words()}
      >
        <Bookmark class="h-4 w-4 {pathname === '/saved' ? 'fill-current' : ''}" />
      </Button>

      <Button variant="outline" size="sm" href="/add" class="hidden shrink-0 gap-1.5 md:flex">
        <Plus class="h-4 w-4" />
        <span>{m.nav_add_word()}</span>
      </Button>

      <AuthButton />

      <!-- Mobile / Tablet Hamburger Toggle Button -->
      <Button
        variant="ghost"
        size="icon"
        class="h-9 w-9 shrink-0 xl:hidden"
        onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
        aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileMenuOpen}
      >
        {#if mobileMenuOpen}
          <X class="h-5 w-5" />
        {:else}
          <Menu class="h-5 w-5" />
        {/if}
      </Button>
    </div>
  </div>

  <!-- Responsive Mobile & Tablet Dropdown Drawer -->
  {#if mobileMenuOpen}
    <div
      class="bg-background/98 border-b shadow-lg backdrop-blur xl:hidden animate-in fade-in-0 slide-in-from-top-2"
    >
      <div class="container mx-auto space-y-3 px-4 py-4">
        <nav class="grid grid-cols-1 gap-1 text-sm font-medium sm:grid-cols-2">
          <a
            href="/"
            onclick={() => (mobileMenuOpen = false)}
            class="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors {pathname === '/' ||
            pathname.startsWith('/word')
              ? 'bg-muted text-primary font-semibold'
              : 'text-foreground/80 hover:bg-muted/60'}"
          >
            <BookOpen class="h-4 w-4" />
            <span>{m.nav_dictionary()}</span>
          </a>

          <a
            href="/search"
            onclick={() => (mobileMenuOpen = false)}
            class="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors {pathname.startsWith(
              '/search'
            )
              ? 'bg-muted text-primary font-semibold'
              : 'text-foreground/80 hover:bg-muted/60'}"
          >
            <Search class="h-4 w-4" />
            <span>Search Explorer</span>
          </a>

          <a
            href="/courses"
            onclick={() => (mobileMenuOpen = false)}
            class="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors {pathname.startsWith(
              '/courses'
            )
              ? 'bg-muted text-primary font-semibold'
              : 'text-foreground/80 hover:bg-muted/60'}"
          >
            <GraduationCap class="h-4 w-4" />
            <span>{m.nav_courses()}</span>
          </a>

          <a
            href="/games"
            onclick={() => (mobileMenuOpen = false)}
            class="flex items-center justify-between rounded-lg px-3 py-2 transition-colors {pathname.startsWith(
              '/games'
            )
              ? 'bg-muted text-primary font-semibold'
              : 'text-foreground/80 hover:bg-muted/60'}"
          >
            <div class="flex items-center gap-2.5">
              <Gamepad2 class="h-4 w-4" />
              <span>{m.nav_games()}</span>
            </div>
            <span class="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400">
              Play
            </span>
          </a>

          <a
            href="/community"
            onclick={() => (mobileMenuOpen = false)}
            class="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors {pathname.startsWith(
              '/community'
            ) || pathname.startsWith('/user/')
              ? 'bg-muted text-primary font-semibold'
              : 'text-foreground/80 hover:bg-muted/60'}"
          >
            <Users class="h-4 w-4" />
            <span>{m.nav_community()}</span>
          </a>

          {#if canAccessStudio}
            <a
              href="/admin/courses"
              onclick={() => (mobileMenuOpen = false)}
              class="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors {pathname.startsWith(
                '/admin'
              )
                ? 'bg-muted text-primary font-semibold'
                : 'text-primary font-medium hover:bg-muted/60'}"
            >
              <Sparkles class="h-4 w-4" />
              <span>{m.nav_studio()}</span>
            </a>
          {/if}

          <a
            href="/saved"
            onclick={() => (mobileMenuOpen = false)}
            class="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors {pathname ===
            '/saved'
              ? 'bg-muted text-primary font-semibold'
              : 'text-foreground/80 hover:bg-muted/60'}"
          >
            <Bookmark class="h-4 w-4 {pathname === '/saved' ? 'fill-current' : ''}" />
            <span>{m.nav_saved_words()}</span>
          </a>

          <a
            href="/about"
            onclick={() => (mobileMenuOpen = false)}
            class="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors {pathname ===
            '/about'
              ? 'bg-muted text-primary font-semibold'
              : 'text-foreground/80 hover:bg-muted/60'}"
          >
            <Info class="h-4 w-4" />
            <span>{m.nav_about()}</span>
          </a>
        </nav>

        <div class="border-t pt-2 flex items-center justify-between gap-2">
          <Button
            href="/add"
            size="sm"
            class="w-full gap-2 text-xs"
            onclick={() => (mobileMenuOpen = false)}
          >
            <Plus class="h-4 w-4" />
            <span>{m.nav_add_word()}</span>
          </Button>
        </div>
      </div>
    </div>
  {/if}
</header>
