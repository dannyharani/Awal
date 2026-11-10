<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { CircleAlert } from '@lucide/svelte';
  import { locales } from '$lib/paraglide/runtime';
  import { COURSE_CATEGORIES } from '$lib/utils/amazigh';

  // UI Components
  import * as Card from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';
  import * as Alert from '$lib/components/ui/alert';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Button } from '$lib/components/ui/button';

  let { data } = $props();

  // svelte-ignore state_referenced_locally
  const { form, errors, constraints, message, enhance } = superForm(data.form, {});

  const LANG_NAMES: Record<string, string> = {
    en: 'English (EN)',
    fr: 'Français (FR)',
    es: 'Español (ES)',
    kab: 'Taqbaylit (KAB)',
    zgh: 'ⵜⴰⵎⴰⵣⵉⵖⵜ (ZGH)',
    ar: 'العربية (AR)'
  };

  let difficultyLabel = $derived(
    $form.difficulty_level
      ? $form.difficulty_level.charAt(0).toUpperCase() + $form.difficulty_level.slice(1)
      : 'Select difficulty...'
  );

  let dialectLabel = $derived(
    data.dialects.find((d: { id: number; name: string }) => d.id === $form.target_dialect_id)
      ?.name ?? 'Select a dialect...'
  );
</script>

<div class="mx-auto max-w-2xl px-4 py-10">
  {#if $message}
    <Alert.Root variant="destructive" class="mb-6">
      <CircleAlert class="h-4 w-4" />
      <Alert.Title>Error</Alert.Title>
      <Alert.Description>{$message}</Alert.Description>
    </Alert.Root>
  {/if}

  <Card.Root class="pb-0">
    <Card.Header>
      <Card.Title class="text-3xl font-bold">Create New Course</Card.Title>
      <Card.Description>
        Define the title, target dialect, and instruction language for your course.
      </Card.Description>
    </Card.Header>

    <Card.Content>
      <form method="POST" use:enhance id="course-form" class="space-y-6">
        <div class="space-y-2">
          <Label for="title">Course Title <span class="text-destructive">*</span></Label>
          <Input
            id="title"
            type="text"
            name="title"
            bind:value={$form.title}
            aria-invalid={$errors.title ? 'true' : undefined}
            {...$constraints.title}
            placeholder="e.g. Kabyle Foundations 101"
          />
          {#if $errors.title}<p class="text-destructive text-sm font-medium">{$errors.title}</p>{/if}
        </div>

        <div class="space-y-2">
          <Label for="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            bind:value={$form.description}
            aria-invalid={$errors.description ? 'true' : undefined}
            class="min-h-[120px] resize-y"
            placeholder="What will students learn in this course?"
          />
          {#if $errors.description}
            <p class="text-destructive text-sm font-medium">{$errors.description}</p>
          {/if}
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div class="space-y-2">
            <Label>Difficulty</Label>
            <input type="hidden" name="difficulty_level" bind:value={$form.difficulty_level} />

            <Select.Root type="single" bind:value={$form.difficulty_level}>
              <Select.Trigger class="w-full">
                {difficultyLabel}
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="beginner">Beginner</Select.Item>
                <Select.Item value="intermediate">Intermediate</Select.Item>
                <Select.Item value="advanced">Advanced</Select.Item>
              </Select.Content>
            </Select.Root>
            {#if $errors.difficulty_level}
              <p class="text-destructive text-sm font-medium">{$errors.difficulty_level}</p>
            {/if}
          </div>

          <div class="space-y-2">
            <Label>Target Dialect <span class="text-destructive">*</span></Label>
            <input type="hidden" name="target_dialect_id" bind:value={$form.target_dialect_id} />

            <Select.Root
              type="single"
              value={$form.target_dialect_id?.toString()}
              onValueChange={(v) => ($form.target_dialect_id = parseInt(v))}
            >
              <Select.Trigger class="w-full" disabled={data.dialects.length === 0}>
                {dialectLabel}
              </Select.Trigger>
              <Select.Content>
                {#each data.dialects as dialect (dialect.id)}
                  <Select.Item value={dialect.id.toString()}>{dialect.name}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>

            {#if $errors.target_dialect_id}
              <p class="text-destructive text-sm font-medium">{$errors.target_dialect_id}</p>
            {/if}
          </div>

          <div class="space-y-2">
            <Label>Instruction Language</Label>
            <select
              name="instruction_language"
              bind:value={$form.instruction_language}
              class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
            >
              {#each locales as loc}
                <option value={loc}>{LANG_NAMES[loc] ?? loc.toUpperCase()}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="category">Course Subject / Category</Label>
            <select
              id="category"
              name="category"
              bind:value={$form.category}
              class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
            >
              {#each COURSE_CATEGORIES as cat}
                <option value={cat.value}>{cat.label}</option>
              {/each}
            </select>
          </div>

          <div class="space-y-2">
            <Label for="tags">Topic Tags (comma-separated)</Label>
            <Input
              id="tags"
              name="tags"
              bind:value={$form.tags}
              placeholder="e.g. greetings, tifinagh, food, verbs"
              class="h-9 text-xs"
            />
          </div>
        </div>
      </form>
    </Card.Content>

    <Card.Footer class="bg-muted/50 flex justify-end gap-4 border-t px-6 py-4">
      <Button variant="ghost" href="/admin/courses">Cancel</Button>
      <Button type="submit" form="course-form">Create Draft & Continue</Button>
    </Card.Footer>
  </Card.Root>
</div>
