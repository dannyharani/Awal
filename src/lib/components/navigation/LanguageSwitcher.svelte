<script lang="ts">
  import { page } from '$app/state';
  import { locales, getLocale, setLocale } from '$lib/paraglide/runtime';
  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Languages, Check } from '@lucide/svelte';

  const LOCALE_LABELS: Record<string, { native: string; badge: string }> = {
    en: { native: 'English', badge: 'EN' },
    fr: { native: 'Français', badge: 'FR' },
    es: { native: 'Español', badge: 'ES' },
    kab: { native: 'Taqbaylit', badge: 'KAB' },
    zgh: { native: 'ⵜⴰⵎⴰⵣⵉⵖⵜ', badge: 'ZGH' },
    ar: { native: 'العربية', badge: 'AR' }
  };

  let activeLocale = $derived(page.data.lang || getLocale() || 'en');

  async function switchLanguage(lang: (typeof locales)[number]) {
    if (lang === activeLocale) return;

    // Persist to user profile if logged in
    const { user, supabase } = page.data;
    if (user && supabase) {
      await supabase.from('profiles').update({ preferred_locale: lang }).eq('id', user.id);
    }

    // Set cookie explicitly and trigger Paraglide reload
    document.cookie = `PARAGLIDE_LOCALE=${lang}; path=/; max-age=34560000; SameSite=Lax`;
    setLocale(lang, { reload: true });
    window.location.reload();
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button
        variant="ghost"
        size="sm"
        class="h-8 gap-1.5 px-2.5 text-xs font-semibold"
        title="Switch interface language"
        {...props}
      >
        <Languages class="h-4 w-4" />
        <span class="uppercase">{LOCALE_LABELS[activeLocale]?.badge ?? activeLocale}</span>
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" class="w-44">
    <DropdownMenu.Label class="text-muted-foreground text-[11px] uppercase">
      Language / Tutlayt
    </DropdownMenu.Label>
    <DropdownMenu.Separator />
    {#each locales as lang}
      {@const info = LOCALE_LABELS[lang] ?? { native: lang, badge: lang.toUpperCase() }}
      <DropdownMenu.Item
        onclick={() => switchLanguage(lang)}
        class="flex cursor-pointer items-center justify-between text-xs"
      >
        <div class="flex items-center gap-2">
          <span class="bg-muted text-muted-foreground w-8 rounded px-1 py-0.5 text-center font-mono text-[10px] font-bold">
            {info.badge}
          </span>
          <span class="font-medium">{info.native}</span>
        </div>
        {#if activeLocale === lang}
          <Check class="text-primary h-3.5 w-3.5" />
        {/if}
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
