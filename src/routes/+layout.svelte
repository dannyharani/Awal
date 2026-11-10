<script lang="ts">
  import '../app.css';
  import { getTextDirection } from '$lib/paraglide/runtime';
  import { ModeWatcher } from 'mode-watcher';

  let { data, children } = $props();
  let dir = $derived(getTextDirection(data?.lang ?? 'en'));
</script>

<ModeWatcher />
<div {dir} class="min-h-screen overflow-x-clip">
  {@render children()}
</div>
