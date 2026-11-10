<script>
  import { page } from '$app/stores';

  import '../app.css';
  import { locales, localizeHref } from '$lib/paraglide/runtime';
  import favicon from '$lib/assets/favicon.svg';
  import { ModeWatcher } from 'mode-watcher';

  let { data, children } = $props();
</script>

<ModeWatcher />
{@render children()}
