<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import AmazighWord from '$lib/components/dictionary/AmazighWord.svelte';
  import RotatingStatsBar from '$lib/components/layout/RotatingStatsBar.svelte';
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
    ArrowRight,
    MapPin
  } from '@lucide/svelte';

  let { data } = $props();
  const { platformStats, dialects } = $derived(data);

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
  <section class="mx-auto max-w-4xl space-y-6 text-center">
    <div class="border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold">
      <Sparkles class="h-3.5 w-3.5" />
      <span>Preserving Heritage Through Modern Technology</span>
    </div>

    <div class="space-y-4">
      <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
        About <AmazighWord word="Awal" class="text-primary font-bold" showTifinaghInline />
      </h1>
      <p class="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
        An all-in-one digital platform dedicated to the documentation, education, and revitalization of
        <AmazighWord word="Tamaziɣt" showTifinaghInline /> across all scripts and regional dialects of
        <AmazighWord word="Tamazɣa" showTifinaghInline />.
      </p>
    </div>

    <!-- Live Rotating Platform Metrics -->
    <div class="pt-4">
      <RotatingStatsBar stats={platformStats} />
    </div>
  </section>

  <!-- Mission & Vision -->
  <section class="grid items-center gap-8 md:grid-cols-2">
    <div class="space-y-4">
      <Badge variant="outline" class="text-xs font-bold tracking-wider uppercase">
        Our Purpose
      </Badge>
      <h2 class="text-3xl font-extrabold tracking-tight">
        Preserving an ancient language for future generations
      </h2>
      <p class="text-muted-foreground text-base leading-relaxed">
        <AmazighWord word="Tamaziɣt" /> is one of humanity's oldest surviving language families, spoken for millennia across North Africa (<AmazighWord word="Tamazɣa" />) from the Atlantic coast and Canary Islands to the Siwa oasis in Egypt.
      </p>
      <p class="text-muted-foreground text-base leading-relaxed">
        Historically preserved through vibrant oral storytelling, <AmazighWord word="Tasekla" /> (poetry and literature), and the ancestral <AmazighWord word="Tifinagh" /> script, Tamaziɣt now enters a new era. <AmazighWord word="Awal" /> was founded to provide the modern digital infrastructure required to document regional vocabulary, offer structured online courses, and gamify daily learning for the global <AmazighWord word="Amezday" /> (community).
      </p>
    </div>

    <div class="from-primary/15 via-primary/5 to-card space-y-4 rounded-2xl border bg-gradient-to-br p-8 shadow-sm">
      <div class="text-primary flex items-center gap-2 text-lg font-bold">
        <Heart class="h-5 w-5" />
        Community Values
      </div>
      <ul class="text-muted-foreground space-y-3 text-sm">
        <li class="flex items-start gap-2.5">
          <ShieldCheck class="text-primary mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Linguistic Rigor:</strong> Accurate grammatical forms (<AmazighWord word="addad-amaruz">Addad Amaruz</AmazighWord> construct states, consonantal roots, verb stems) documented alongside everyday <AmazighWord word="Asiwel" />.
          </span>
        </li>
        <li class="flex items-start gap-2.5">
          <Globe class="text-primary mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Pan-Dialect Respect:</strong> Equal recognition of Kabyle, Central Atlas, Tashelhit, Riffian, Mozabite, Tuareg, Chaoui, and other varieties.
          </span>
        </li>
        <li class="flex items-start gap-2.5">
          <Languages class="text-primary mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Multi-Script Inclusivity:</strong> Seamless interoperability between <AmazighWord word="Tifinagh" />, Tamaziɣt Latin (<AmazighWord word="Agemmay" />), and Arabic transliteration.
          </span>
        </li>
        <li class="flex items-start gap-2.5">
          <Users class="text-primary mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Community-Driven:</strong> Built for and by educators, native speakers, students, and enthusiasts in our open <AmazighWord word="Amezday" />.
          </span>
        </li>
      </ul>
    </div>
  </section>

  <!-- Core Pillars with Interactive Amazigh Popups -->
  <section class="space-y-8">
    <div class="mx-auto max-w-2xl space-y-2 text-center">
      <Badge variant="outline" class="text-xs uppercase">Platform Architecture</Badge>
      <h2 class="text-3xl font-extrabold tracking-tight">
        The Four Pillars of <AmazighWord word="Awal" />
      </h2>
      <p class="text-muted-foreground text-sm">
        Everything you need to discover, teach, and master Tamaziɣt in one unified ecosystem. Hover or tap any Amazigh pillar name to inspect its lexical root.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <Card.Root class="hover:border-primary/50 transition-all">
        <Card.Header class="space-y-3">
          <div class="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
            <BookOpen class="h-6 w-6" />
          </div>
          <Card.Title class="text-xl">
            Crowdsourced Dictionary (<AmazighWord word="Amawal" showTifinaghInline />)
          </Card.Title>
          <Card.Description class="text-sm leading-relaxed">
            A comprehensive, multi-dialect linguistic repository with peer-reviewed definitions, authentic human pronunciations, consonantal roots, and construct state (<AmazighWord word="addad-amaruz">Addad Amaruz</AmazighWord>).
          </Card.Description>
        </Card.Header>
      </Card.Root>

      <Card.Root class="hover:border-primary/50 transition-all">
        <Card.Header class="space-y-3">
          <div class="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
            <GraduationCap class="h-6 w-6" />
          </div>
          <Card.Title class="text-xl">
            Interactive Courses (<AmazighWord word="Timsirin" showTifinaghInline />)
          </Card.Title>
          <Card.Description class="text-sm leading-relaxed">
            Bite-sized, structured curricula covering <AmazighWord word="Asiwel" /> (conversation), <AmazighWord word="Tajerrumt" /> (grammar), and <AmazighWord word="Agemmay" /> (script literacy) with live dictionary-linked flashcards.
          </Card.Description>
        </Card.Header>
      </Card.Root>

      <Card.Root class="hover:border-primary/50 transition-all">
        <Card.Header class="space-y-3">
          <div class="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
            <Gamepad2 class="h-6 w-6" />
          </div>
          <Card.Title class="text-xl">
            Daily Word Games (<AmazighWord word="Uraren" showTifinaghInline />)
          </Card.Title>
          <Card.Description class="text-sm leading-relaxed">
            Engaging daily brain games—like <AmazighWord word="Tawalt" />, <AmazighWord word="Anagam" />, and <AmazighWord word="Assaɣen" />—making script recognition and vocabulary recall an enjoyable daily habit.
          </Card.Description>
        </Card.Header>
      </Card.Root>

      <Card.Root class="hover:border-primary/50 transition-all">
        <Card.Header class="space-y-3">
          <div class="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
            <Globe class="h-6 w-6" />
          </div>
          <Card.Title class="text-xl">
            Pan-Amazigh Bridge (<AmazighWord word="Amezday" showTifinaghInline />)
          </Card.Title>
          <Card.Description class="text-sm leading-relaxed">
            Uniting all regional dialects across <AmazighWord word="Tamazɣa" />—Kabyle, Central Atlas, Tashelhit, Riffian, Tuareg, Mozabite, Chaoui, and beyond—as complementary branches of one ancestral tree.
          </Card.Description>
        </Card.Header>
      </Card.Root>
    </div>
  </section>

  <!-- Regional Dialect Showcase -->
  {#if dialects && dialects.length > 0}
    <section id="dialects" class="space-y-6">
      <div class="mx-auto max-w-2xl space-y-2 text-center">
        <Badge variant="outline" class="text-xs uppercase">Regional Diversity</Badge>
        <h2 class="text-3xl font-extrabold tracking-tight">
          Dialects Documented on Awal
        </h2>
        <p class="text-muted-foreground text-sm">
          Click any regional variety below to explore its documented vocabulary in the dictionary.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each dialects as dialect (dialect.id)}
          {@const defCount = dialect.definitions?.[0]?.count ?? 0}
          <a
            href="/?dialect={dialect.id}#browse"
            class="bg-card hover:border-primary/50 group flex flex-col justify-between rounded-xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="space-y-2">
              <div class="flex items-center justify-between gap-2">
                <h3 class="group-hover:text-primary text-lg font-bold transition-colors">
                  {dialect.name}
                </h3>
                <Badge variant="secondary" class="text-xs">
                  {defCount} {defCount === 1 ? 'entry' : 'entries'}
                </Badge>
              </div>
              {#if dialect.region_description}
                <p class="text-muted-foreground flex items-start gap-1.5 text-xs leading-relaxed">
                  <MapPin class="text-primary mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{dialect.region_description}</span>
                </p>
              {/if}
            </div>

            <div class="text-primary mt-4 flex items-center justify-between border-t pt-3 text-xs font-semibold">
              <span>Browse {dialect.name} words</span>
              <ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Frequently Asked Questions -->
  <section class="space-y-8">
    <div class="mx-auto max-w-2xl space-y-2 text-center">
      <Badge variant="outline" class="text-xs uppercase">Got Questions?</Badge>
      <h2 class="text-3xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
    </div>

    <div class="mx-auto grid max-w-3xl gap-4">
      {#each FAQS as faq}
        <div class="bg-card space-y-2 rounded-xl border p-6 shadow-sm">
          <h3 class="text-lg font-bold">{faq.q}</h3>
          <p class="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
        </div>
      {/each}
    </div>
  </section>

  <!-- Get Involved CTA -->
  <Card.Root class="border-primary/30 from-primary/10 via-background to-primary/10 bg-gradient-to-r">
    <Card.Content class="flex flex-col items-center justify-between gap-6 p-8 text-center sm:flex-row sm:text-left">
      <div class="max-w-xl space-y-2">
        <h3 class="text-2xl font-extrabold">
          Ready to Join the <AmazighWord word="Awal" /> <AmazighWord word="Amezday" />?
        </h3>
        <p class="text-muted-foreground text-sm">
          Whether you want to learn your ancestral language, document a regional word, or create interactive courses as an educator, you are warmly welcome.
        </p>
      </div>

      <div class="flex shrink-0 flex-wrap gap-3">
        <Button size="lg" href="/add" class="gap-1.5">
          <BookOpen class="h-4 w-4" />
          Contribute Word
        </Button>
        <Button variant="outline" size="lg" href="/community" class="gap-1.5">
          <Users class="h-4 w-4" />
          Meet the Community
        </Button>
        <Button variant="ghost" size="lg" href="/courses" class="gap-1.5">
          Explore Courses
          <ArrowRight class="h-4 w-4" />
        </Button>
      </div>
    </Card.Content>
  </Card.Root>
</div>
