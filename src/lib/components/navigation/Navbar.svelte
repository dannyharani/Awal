<script lang="ts">
  import { page } from '$app/state';
  import AuthButton from './AuthButton.svelte';
  import LanguageSwitcher from './LanguageSwitcher.svelte';
  import SearchBar from '../layout/SearchBar.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Plus, BookOpen, GraduationCap, Sparkles, Gamepad2 } from '@lucide/svelte';
  import * as m from '$lib/paraglide/messages.js';

  let role = $derived(page.data.role);
  let canAccessStudio = $derived(role === 'admin' || role === 'instructor');
  let pathname = $derived(page.url.pathname);
</script>

<header
  class="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur"
>
  <div class="container mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4">
    <div class="flex items-center gap-6">
      <a href="/" class="flex items-center space-x-1">
        <span class="text-xl font-bold tracking-tight">
          Aselkim <span class="text-primary">.</span>
        </span>
      </a>

      <nav class="hidden items-center gap-5 text-sm font-medium md:flex">
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
          <span class="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-primary">
            Soon
          </span>
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

    <div class="flex flex-1 items-center justify-end gap-2">
      <div class="w-full flex-1 md:w-auto md:flex-none">
        <SearchBar />
      </div>

      <LanguageSwitcher />

      <Button variant="outline" size="sm" href="/add" class="hidden gap-1.5 sm:flex">
        <Plus class="h-4 w-4" />
        <span>{m.nav_add_word()}</span>
      </Button>

      <AuthButton />
    </div>
  </div>
</header>
