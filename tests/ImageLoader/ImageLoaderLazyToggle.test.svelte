<svelte:options accessors />

<script lang="ts">
  import ImageLoader from "carbon-components-svelte/ImageLoader/ImageLoader.svelte";

  export let src = "";
  export let lazy = false;
  export let ratio: "16x9" | undefined = undefined;
</script>

<ImageLoader {src} {lazy} {ratio} alt="Logo">
  <svelte:fragment slot="loading">
    <span data-testid="loading-state"></span>
  </svelte:fragment>
  <svelte:fragment slot="error">
    <span data-testid="error-state"></span>
  </svelte:fragment>
</ImageLoader>
