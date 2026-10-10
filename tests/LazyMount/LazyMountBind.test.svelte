<svelte:options accessors />

<script lang="ts">
  import LazyMount from "carbon-components-svelte/LazyMount/LazyMount.svelte";

  export let mounted = false;
</script>

<LazyMount bind:mounted data-testid="lazy">
  <p>Content</p>
</LazyMount>
