<script lang="ts">
  import { page } from '$app/state';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import AmazighKeyboardBar from '$lib/components/dictionary/AmazighKeyboardBar.svelte';
  import AudioPlayer from '$lib/components/dictionary/AudioPlayer.svelte';
  import { latinToTifinagh } from '$lib/utils/amazigh';
  import { Plus, Trash2, Search, WandSparkles, BookOpen } from '@lucide/svelte';
  import type { FlashcardItem } from '$lib/types';

  let { content = $bindable(), linkedHeadwordId = $bindable(null) } = $props();
  let { supabase } = $derived(page.data);

  // Initialize cards array if missing
  if (!Array.isArray(content.cards)) {
    content.cards = [
      {
        front_latin: '',
        front_tifinagh: '',
        back_text: '',
        notes: ''
      }
    ];
  }

  let searchQuery = $state('');
  let searchResults = $state<any[]>([]);
  let isSearching = $state(false);

  async function searchDictionary(term: string) {
    searchQuery = term;
    if (!term || term.trim().length < 2) {
      searchResults = [];
      return;
    }
    isSearching = true;
    const { data } = await supabase.rpc('search_dictionary', { term: term.trim() });
    searchResults = data ?? [];
    isSearching = false;
  }

  async function importDictionaryWord(result: any) {
    // Fetch full headword + top definition + audio from Supabase
    const { data: hw } = await supabase
      .from('headwords')
      .select(
        `
        id,
        script_latin,
        script_tifinagh,
        definitions ( definition_text, audio_url, attributes )
      `
      )
      .eq('id', result.id)
      .single();

    if (!hw) return;

    linkedHeadwordId = hw.id;
    const topDef = (hw.definitions as any[])?.[0];
    const attrs = topDef?.attributes || {};
    const notesParts: string[] = [];
    if (attrs.part_of_speech) notesParts.push(attrs.part_of_speech);
    if (attrs.construct_state) notesParts.push(`Construct: ${attrs.construct_state}`);
    if (attrs.plural) notesParts.push(`Plural: ${attrs.plural}`);

    const newCard: FlashcardItem = {
      front_latin: hw.script_latin || result.headword_text,
      front_tifinagh:
        hw.script_tifinagh || latinToTifinagh(hw.script_latin || result.headword_text),
      back_text: topDef?.definition_text || result.match_preview || '',
      audio_url: topDef?.audio_url || undefined,
      notes: notesParts.join(' • ')
    };

    // If the first card is empty, replace it; otherwise append
    if (
      content.cards.length === 1 &&
      !content.cards[0].front_latin &&
      !content.cards[0].back_text
    ) {
      content.cards = [newCard];
    } else {
      content.cards = [...content.cards, newCard];
    }

    searchQuery = '';
    searchResults = [];
  }

  function addBlankCard() {
    content.cards = [
      ...(content.cards || []),
      {
        front_latin: '',
        front_tifinagh: '',
        back_text: '',
        notes: ''
      }
    ];
  }

  function removeCard(idx: number) {
    content.cards = content.cards.filter((_: any, i: number) => i !== idx);
  }
</script>

<div class="space-y-6">
  <div class="grid gap-4 sm:grid-cols-2">
    <div class="space-y-1.5">
      <Label>Flashcard Deck Title</Label>
      <Input
        bind:value={content.deck_title}
        placeholder="e.g. Essential Greetings & Core Nouns"
      />
    </div>

    <!-- Dictionary Lookup Import -->
    <div class="space-y-1.5">
      <Label class="flex items-center gap-1.5">
        <BookOpen class="text-primary h-3.5 w-3.5" />
        Import Word from Asafu Dictionary
      </Label>
      <div class="relative">
        <Search class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
        <Input
          value={searchQuery}
          oninput={(e) => searchDictionary((e.target as HTMLInputElement).value)}
          placeholder="Search dictionary (e.g. aman, aɣrum)..."
          class="pl-8 text-xs"
        />
        {#if searchResults.length > 0}
          <div
            class="bg-popover absolute top-full z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-md border p-1 shadow-lg"
          >
            {#each searchResults as item}
              <button
                type="button"
                onclick={() => importDictionaryWord(item)}
                class="hover:bg-muted flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-xs"
              >
                <div>
                  <span class="font-bold">{item.headword_text}</span>
                  {#if item.script_tifinagh}
                    <span class="text-primary ml-1.5 font-serif">{item.script_tifinagh}</span>
                  {/if}
                  {#if item.match_preview}
                    <p class="text-muted-foreground line-clamp-1 text-[11px]">
                      {item.match_preview}
                    </p>
                  {/if}
                </div>
                <Badge variant="secondary" class="text-[10px]">+ Import</Badge>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <Label class="text-muted-foreground text-xs font-bold tracking-wider uppercase">
        Cards in Deck ({content.cards?.length ?? 0})
      </Label>
      <Button type="button" variant="outline" size="sm" onclick={addBlankCard} class="h-7 gap-1 text-xs">
        <Plus class="h-3.5 w-3.5" /> Add Card
      </Button>
    </div>

    {#each content.cards || [] as card, idx}
      <div class="bg-muted/20 relative space-y-3 rounded-xl border p-4">
        <div class="flex items-center justify-between">
          <Badge variant="outline" class="text-[10px]">Card #{idx + 1}</Badge>
          {#if (content.cards?.length ?? 0) > 1}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="text-muted-foreground hover:text-destructive h-6 w-6"
              onclick={() => removeCard(idx)}
            >
              <Trash2 class="h-3.5 w-3.5" />
            </Button>
          {/if}
        </div>

        <AmazighKeyboardBar
          onInsert={(ch) => {
            card.front_latin = (card.front_latin || '') + ch;
          }}
        />

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="space-y-1">
            <Label class="text-xs">Front (Amazigh Latin)</Label>
            <Input
              bind:value={card.front_latin}
              placeholder="e.g. Aɣrum"
              class="h-8 text-xs font-semibold"
            />
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <Label class="text-xs">Front (Tifinagh Script)</Label>
              <button
                type="button"
                onclick={() => {
                  card.front_tifinagh = latinToTifinagh(card.front_latin || '');
                }}
                class="text-primary flex items-center gap-1 text-[10px] font-medium hover:underline"
              >
                <WandSparkles class="h-3 w-3" /> Auto-fill
              </button>
            </div>
            <Input
              bind:value={card.front_tifinagh}
              placeholder="e.g. ⴰⵖⵔⵓⵎ"
              class="h-8 font-serif text-sm"
            />
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="space-y-1">
            <Label class="text-xs">Back (Meaning / Translation)</Label>
            <Input
              bind:value={card.back_text}
              placeholder="e.g. Bread"
              class="h-8 text-xs"
            />
          </div>

          <div class="space-y-1">
            <Label class="text-xs">Grammar / Usage Note (Optional)</Label>
            <Input
              bind:value={card.notes}
              placeholder="e.g. Construct state: uɣrum"
              class="h-8 text-xs"
            />
          </div>
        </div>

        {#if card.audio_url}
          <div class="pt-1">
            <AudioPlayer src={card.audio_url} />
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
