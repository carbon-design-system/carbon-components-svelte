<svelte:options accessors />

<script lang="ts">
  import ImageLoader from "carbon-components-svelte/ImageLoader/ImageLoader.svelte";

  export let src = "";
  export let lazy = false;
</script>

<ImageLoader {src} {lazy} alt="Logo">
  <svelte:fragment slot="loading">
    <span data-testid="loading-state"></span>
  </svelte:fragment>
</ImageLoader>
