<script lang="ts">
  import { superForm } from 'sveltekit-superforms';
  import { CircleAlert } from '@lucide/svelte';

  // UI Components
  import * as Card from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';
  import * as Alert from '$lib/components/ui/alert';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Button } from '$lib/components/ui/button';

  let { data } = $props();

  // Initialize Superform
  const { form, errors, constraints, message, enhance } = superForm(data.form, {
    // Optional: client-side validation using the same schema
    // validators: zod(createCourseSchema),
  });

  // Derived helpers for Shadcn Select labels
  let difficultyLabel = $derived(
    $form.difficulty_level
      ? $form.difficulty_level.charAt(0).toUpperCase() + $form.difficulty_level.slice(1)
      : 'Select difficulty...'
  );

  let dialectLabel = $derived(
    data.dialects.find((d: { id: number; name: string }) => d.id === $form.target_dialect_id)?.name ?? 'Select a dialect...'
  );
</script>

<div class="max-w-2xl mx-auto py-10 px-4">
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
      <Card.Description>Start by defining the basic metadata for your course.</Card.Description>
    </Card.Header>

    <Card.Content>
      <form method="POST" use:enhance id="course-form" class="space-y-6">
        <div class="space-y-2">
          <Label for="title">Course Title <span class="text-destructive">*</span></Label>
          <Input
            type="text"
            name="title"
            bind:value={$form.title}
            aria-invalid={$errors.title ? 'true' : undefined}
            {...$constraints.title}
            placeholder="e.g. Levantine Arabic 101"
          />
          {#if $errors.title}<p class="text-sm font-medium text-destructive">{$errors.title}</p>{/if}
        </div>

        <div class="space-y-2">
          <Label for="description">Description</Label>
          <Textarea
            name="description"
            bind:value={$form.description}
            aria-invalid={$errors.description ? 'true' : undefined}
            class="min-h-[120px] resize-y"
            placeholder="What will students learn?"
          />
          {#if $errors.description}<p class="text-sm font-medium text-destructive">{$errors.description}</p>{/if}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <p class="text-sm font-medium text-destructive">{$errors.difficulty_level}</p>
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
              <p class="text-sm font-medium text-destructive">{$errors.target_dialect_id}</p>
            {/if}
            {#if data.dialects.length === 0}
              <p class="text-[0.8rem] text-muted-foreground">No dialects found.</p>
            {/if}
          </div>
        </div>
      </form>
    </Card.Content>

    <Card.Footer class="flex justify-end gap-4 border-t bg-muted/50 px-6 py-4">
      <Button variant="ghost" href="/courses">Cancel</Button>
      <Button type="submit" form="course-form">Create Draft & Continue</Button>
    </Card.Footer>
  </Card.Root>
</div>
