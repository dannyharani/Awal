<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  import { Github, Heart, BookOpen, GraduationCap, Gamepad2, Info, Users } from '@lucide/svelte';
  import AmazighWord from '$lib/components/dictionary/AmazighWord.svelte';

  const currentYear = new Date().getFullYear();
</script>

<footer class="bg-muted/30 border-t py-12 text-sm">
  <div class="container mx-auto px-4">
    <div class="grid grid-cols-1 gap-8 md:grid-cols-4">
      <!-- Brand & Mission -->
      <div class="space-y-3 md:col-span-2">
        <a href="/" class="flex items-center space-x-1">
          <span class="text-xl font-bold tracking-tight">
            Awal <span class="text-primary">.</span>
          </span>
        </a>
        <p class="text-muted-foreground max-w-sm text-xs leading-relaxed">
          {m.footer_tagline()}
        </p>
        <div class="flex items-center gap-3 pt-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
          >
            <Github class="h-4 w-4" />
            <span>{m.footer_contribute_github()}</span>
          </a>
        </div>
      </div>

      <!-- Quick Navigation -->
      <div class="space-y-2">
        <h4 class="text-foreground text-xs font-bold tracking-wider uppercase">Platform</h4>
        <ul class="text-muted-foreground space-y-1.5 text-xs">
          <li>
            <a href="/" class="hover:text-foreground flex items-center gap-1.5 transition-colors">
              <BookOpen class="h-3.5 w-3.5" />
              {m.nav_dictionary()}
            </a>
          </li>
          <li>
            <a href="/courses" class="hover:text-foreground flex items-center gap-1.5 transition-colors">
              <GraduationCap class="h-3.5 w-3.5" />
              {m.nav_courses()}
            </a>
          </li>
          <li>
            <a href="/games" class="hover:text-foreground flex items-center gap-1.5 transition-colors">
              <Gamepad2 class="h-3.5 w-3.5" />
              {m.nav_games()}
            </a>
          </li>
          <li>
            <a href="/community" class="hover:text-foreground flex items-center gap-1.5 transition-colors">
              <Users class="h-3.5 w-3.5" />
              {m.nav_community()}
            </a>
          </li>
          <li>
            <a href="/about" class="hover:text-foreground flex items-center gap-1.5 transition-colors">
              <Info class="h-3.5 w-3.5" />
              {m.nav_about()}
            </a>
          </li>
        </ul>
      </div>

      <!-- Dialects & Cultural Pillars -->
      <div class="space-y-2">
        <h4 class="text-foreground text-xs font-bold tracking-wider uppercase">Pillars</h4>
        <ul class="text-muted-foreground space-y-1.5 text-xs">
          <li><AmazighWord word="Amawal" showTifinaghInline /> (Dictionary)</li>
          <li><AmazighWord word="Timsirin" showTifinaghInline /> (Academy)</li>
          <li><AmazighWord word="Uraren" showTifinaghInline /> (Daily Games)</li>
          <li><AmazighWord word="Amezday" showTifinaghInline /> (Community)</li>
        </ul>
      </div>
    </div>

    <div class="text-muted-foreground/80 mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-xs">
      <p>© {currentYear} Awal. {m.footer_rights()}</p>
      <div class="flex items-center gap-1">
        <span>Crafted with</span>
        <Heart class="h-3 w-3 fill-red-500 text-red-500" />
        <span>for the Tamaziɣt language & diaspora</span>
      </div>
    </div>
  </div>
</footer>
