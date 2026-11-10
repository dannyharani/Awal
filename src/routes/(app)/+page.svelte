<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { ArrowRight, Sparkles, Clock } from '@lucide/svelte';
  import { Badge } from '$lib/components/ui/badge';

  let { data } = $props();
  const { wordOfTheDay, recentWords, stats } = $derived(data);
</script>

<div class="container mx-auto space-y-12 py-10">
  <section class="mx-auto max-w-2xl space-y-6 text-center">
    <h1 class="text-4xl font-extrabold tracking-tight lg:text-5xl">
      The Open <span class="text-primary">Amazigh</span> Dictionary
    </h1>
    <p class="text-muted-foreground text-xl">
      A community-driven project to document, preserve, and standardize the Amazigh language.
    </p>

    <div class="flex items-center justify-center gap-4 pt-4">
      <div class="bg-muted/30 flex flex-col items-center rounded-lg border p-3">
        <span class="text-2xl font-bold">{stats.total_words}</span>
        <span class="text-muted-foreground text-xs tracking-wider uppercase">Words</span>
      </div>
      <div class="bg-muted/30 flex flex-col items-center rounded-lg border p-3">
        <span class="text-2xl font-bold">{stats.total_definitions}</span>
        <span class="text-muted-foreground text-xs tracking-wider uppercase">Definitions</span>
      </div>
    </div>

    <div class="flex justify-center gap-4 pt-4">
      <Button size="lg" href="/add">Contribute a Word</Button>
      <Button variant="outline" size="lg" href="/about">Learn More</Button>
    </div>
  </section>

  {#if wordOfTheDay}
    <section>
      <div class="mb-4 flex items-center gap-2">
        <Sparkles class="h-5 w-5 text-yellow-500" />
        <h2 class="text-2xl font-bold">Word of the Day</h2>
      </div>

      <Card.Root class="from-primary/5 to-background border-primary/20 bg-gradient-to-br">
        <Card.Content
          class="flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center"
        >
          <div class="space-y-2">
            <h3 class="text-primary text-4xl font-bold">{wordOfTheDay.script_latin}</h3>
            {#if wordOfTheDay.script_tifinagh}
              <p class="font-tifinagh text-muted-foreground text-2xl">
                {wordOfTheDay.script_tifinagh}
              </p>
            {/if}
          </div>
          <Button href="/word/{wordOfTheDay.slug}" class="group">
            View Definition
            <ArrowRight class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Card.Content>
      </Card.Root>
    </section>
  {/if}

  <section>
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Clock class="text-muted-foreground h-5 w-5" />
        <h2 class="text-2xl font-bold">Recently Added</h2>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each recentWords as word}
        <a href="/word/{word.slug}" class="group block">
          <Card.Root class="hover:border-primary/50 h-full transition-all hover:shadow-md">
            <Card.Header>
              <Card.Title class="flex items-center justify-between">
                <span class="group-hover:text-primary transition-colors">{word.script_latin}</span>
                {#if word.script_tifinagh}
                  <Badge variant="secondary" class="font-tifinagh text-xs font-normal">
                    {word.script_tifinagh}
                  </Badge>
                {/if}
              </Card.Title>
              <Card.Description class="pt-2 text-xs">
                Added {new Date(word.created_at).toLocaleDateString()}
              </Card.Description>
            </Card.Header>
          </Card.Root>
        </a>
      {/each}
    </div>
  </section>
</div>
