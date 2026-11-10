<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import {
    BookOpen,
    GraduationCap,
    Gamepad2,
    Globe,
    Languages,
    Heart,
    ShieldCheck,
    Users,
    Sparkles,
    ArrowRight
  } from '@lucide/svelte';

  const PILLARS = [
    {
      title: 'Crowdsourced Dictionary (Amawal)',
      icon: BookOpen,
      desc: 'A comprehensive, multi-dialect linguistic repository with peer-reviewed definitions, authentic human pronunciations, consonantal roots, and construct state (Addad Amaruz).'
    },
    {
      title: 'Interactive Courses (Timsirin)',
      icon: GraduationCap,
      desc: 'Bite-sized, structured curricula authored by educators with live dictionary-linked flashcards, video lessons, and interactive quiz checks.'
    },
    {
      title: 'Daily Word Games (Uraren)',
      icon: Gamepad2,
      desc: 'Engaging daily brain games—like Tawalt (Amazigh Wordle) and Anagam (Word Wheel)—making script recognition and vocabulary recall an enjoyable daily habit.'
    },
    {
      title: 'Pan-Amazigh Bridge (Amezday)',
      icon: Globe,
      desc: 'Uniting all regional dialects—Kabyle, Central Atlas, Tashelhit, Riffian, Tuareg, Mozabite, Chaoui, and beyond—as complementary branches of one ancestral tree.'
    }
  ];

  const FAQS = [
    {
      q: 'What does "Awal" mean?',
      a: 'In Tamaziɣt across every regional dialect, "Awal" (ⴰⵡⴰⵍ) means "Word", "Speech", "Voice", and "Language". In Amazigh cultural philosophy, "Awal" also signifies one\'s word of honor and the living oral heritage passed down across generations ("Awal d awal"). Our goal is to give the Amazigh word a permanent, thriving home in the digital age.'
    },
    {
      q: 'Which scripts does Awal support?',
      a: 'Awal fully supports both Neo-Tifinagh (ⵜⵉⴼⵉⵏⴰⵖ, standardized by IRCAM) and Tamaziɣt Latin (including special phonological characters like ɣ, ɛ, č, ǧ, ḍ, ṭ, ẓ, ḥ, ṣ, ṛ). Headwords also feature Arabic script transcriptions to maximize accessibility.'
    },
    {
      q: 'How does Awal handle dialect variations?',
      a: 'Rather than forcing artificial homogenization, Awal embraces dialect diversity. Every definition specifies its region or dialect, and our cross-dialect relation system connects cognates, phonetic variants, and synonyms across regions.'
    },
    {
      q: 'Who can contribute definitions or courses?',
      a: 'Any signed-in user can contribute new words, dialect meanings, example sentences, and pronunciation recordings. Approved educators and instructors can author full structured courses in the Educator Studio.'
    },
    {
      q: 'Is Awal free to use?',
      a: 'Yes! Awal is free and open to everyone dedicated to learning, preserving, and celebrating the Amazigh language and culture.'
    }
  ];
</script>

<div class="container mx-auto max-w-5xl space-y-16 px-4 py-12">
  <!-- Hero Section -->
  <section class="mx-auto max-w-3xl space-y-6 text-center">
    <div class="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
      <Sparkles class="h-3.5 w-3.5" />
      <span>Preserving Heritage Through Modern Technology</span>
    </div>

    <div class="space-y-3">
      <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
        About <span class="text-primary font-bold">Awal</span>
        <span class="text-muted-foreground ml-2 font-serif text-3xl sm:text-4xl">ⴰⵡⴰⵍ</span>
      </h1>
      <p class="text-muted-foreground text-xl leading-relaxed">
        An all-in-one digital platform dedicated to the documentation, education, and revitalization of the Amazigh language across all scripts and regional dialects.
      </p>
    </div>
  </section>

  <!-- Mission & Vision -->
  <section class="grid gap-8 md:grid-cols-2 items-center">
    <div class="space-y-4">
      <Badge variant="outline" class="text-xs font-bold uppercase tracking-wider">
        Our Purpose
      </Badge>
      <h2 class="text-3xl font-extrabold tracking-tight">
        Preserving an ancient language for future generations
      </h2>
      <p class="text-muted-foreground text-base leading-relaxed">
        Tamaziɣt is one of humanity's oldest surviving language families, spoken for millennia across North Africa (Tamazɣa) from the Atlantic coast and Canary Islands to the Siwa oasis in Egypt.
      </p>
      <p class="text-muted-foreground text-base leading-relaxed">
        Historically preserved through vibrant oral storytelling, poetry, and ancestral script, Tamaziɣt now enters a new era. Awal was founded to provide the modern digital infrastructure required to document regional vocabulary, offer structured online courses, and gamify daily learning for the global community.
      </p>
    </div>

    <div class="bg-gradient-to-br from-primary/15 via-primary/5 to-card rounded-2xl border p-8 space-y-4 shadow-sm">
      <div class="flex items-center gap-2 text-primary font-bold text-lg">
        <Heart class="h-5 w-5" />
        Community Values
      </div>
      <ul class="space-y-3 text-sm text-muted-foreground">
        <li class="flex items-start gap-2.5">
          <ShieldCheck class="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span><strong>Linguistic Rigor:</strong> Accurate grammatical forms (construct states, consonantal roots, verb stems) documented alongside colloquial usage.</span>
        </li>
        <li class="flex items-start gap-2.5">
          <Globe class="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span><strong>Pan-Dialect Respect:</strong> Equal recognition of Kabyle, Central Atlas, Tashelhit, Riffian, Mozabite, Tuareg, Chaoui, and other varieties.</span>
        </li>
        <li class="flex items-start gap-2.5">
          <Languages class="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span><strong>Multi-Script Inclusivity:</strong> Seamless interoperability between Neo-Tifinagh, Tamaziɣt Latin, and Arabic transliteration.</span>
        </li>
        <li class="flex items-start gap-2.5">
          <Users class="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span><strong>Community-Driven:</strong> Built for and by educators, native speakers, students, and enthusiasts worldwide.</span>
        </li>
      </ul>
    </div>
  </section>

  <!-- Core Pillars -->
  <section class="space-y-8">
    <div class="text-center space-y-2 max-w-2xl mx-auto">
      <Badge variant="outline" class="text-xs uppercase">Platform Architecture</Badge>
      <h2 class="text-3xl font-extrabold tracking-tight">The Pillars of Awal</h2>
      <p class="text-muted-foreground text-sm">
        Everything you need to discover, teach, and master Tamaziɣt in one unified ecosystem.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {#each PILLARS as p}
        <Card.Root class="hover:border-primary/50 transition-all">
          <Card.Header class="space-y-3">
            <div class="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
              <p.icon class="h-6 w-6" />
            </div>
            <Card.Title class="text-xl">{p.title}</Card.Title>
            <Card.Description class="text-sm leading-relaxed">
              {p.desc}
            </Card.Description>
          </Card.Header>
        </Card.Root>
      {/each}
    </div>
  </section>

  <!-- Frequently Asked Questions -->
  <section class="space-y-8">
    <div class="text-center space-y-2 max-w-2xl mx-auto">
      <Badge variant="outline" class="text-xs uppercase">Got Questions?</Badge>
      <h2 class="text-3xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
    </div>

    <div class="grid gap-4 max-w-3xl mx-auto">
      {#each FAQS as faq}
        <div class="bg-card rounded-xl border p-6 space-y-2 shadow-sm">
          <h3 class="text-lg font-bold">{faq.q}</h3>
          <p class="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
        </div>
      {/each}
    </div>
  </section>

  <!-- Get Involved CTA -->
  <Card.Root class="border-primary/30 bg-gradient-to-r from-primary/10 via-background to-primary/10">
    <Card.Content class="flex flex-col items-center justify-between gap-6 p-8 text-center sm:flex-row sm:text-left">
      <div class="space-y-2 max-w-xl">
        <h3 class="text-2xl font-extrabold">Ready to Join the Awal Community?</h3>
        <p class="text-muted-foreground text-sm">
          Whether you want to learn your ancestral language, document a regional word, or create interactive courses as an educator, you are warmly welcome.
        </p>
      </div>

      <div class="flex flex-wrap gap-3 shrink-0">
        <Button size="lg" href="/add" class="gap-1.5">
          <BookOpen class="h-4 w-4" />
          Contribute Word
        </Button>
        <Button variant="outline" size="lg" href="/courses" class="gap-1.5">
          Explore Courses
          <ArrowRight class="h-4 w-4" />
        </Button>
      </div>
    </Card.Content>
  </Card.Root>
</div>
