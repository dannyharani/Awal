<script lang="ts">
  import Navbar from '$lib/components/navigation/Navbar.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';

  let { children } = $props();
</script>

<div class="bg-background relative flex min-h-screen flex-col">
  <Navbar />

  <main class="flex-1">
    {@render children()}
  </main>

  <Footer />
</div>
