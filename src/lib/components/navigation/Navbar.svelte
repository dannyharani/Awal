<script lang="ts">
  import AuthButton from './AuthButton.svelte';
  import SearchBar from '../layout/SearchBar.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Plus } from '@lucide/svelte';

  // We'll add a language switcher later, for now let's get the structure up
</script>

<header
  class="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur"
>
  <div class="container mx-auto flex h-14 max-w-screen-2xl items-center px-4">
    <div class="mr-4 flex">
      <a href="/" class="mr-6 flex items-center space-x-2">
        <span class="text-xl font-bold tracking-tight">
          Aselkim <span class="text-primary">.</span>
        </span>
      </a>

      <nav class="hidden items-center space-x-6 text-sm font-medium md:flex">
        <a href="/about" class="hover:text-foreground/80 text-foreground/60 transition-colors">
          About
        </a>
      </nav>
    </div>

    <div class="flex flex-1 items-center justify-between space-x-2 md:justify-end">
      <div class="w-full flex-1 md:w-auto md:flex-none">
        <SearchBar />
      </div>

      <Button variant="outline" size="sm" href="/add" class="hidden gap-2 sm:flex">
        <Plus class="h-4 w-4" />
        <span>Add Word</span>
      </Button>

      <AuthButton />
    </div>
  </div>
</header>
