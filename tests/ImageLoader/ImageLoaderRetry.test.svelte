<script lang="ts">
  import ImageLoader from "carbon-components-svelte/ImageLoader/ImageLoader.svelte";

  export let src = "a.jpg";
  export let onload: (() => void) | undefined = undefined;
</script>

<ImageLoader {src} alt="Logo" on:load={() => onload?.()}>
  <svelte:fragment slot="loading">
    <span data-testid="loading-state"></span>
  </svelte:fragment>
  <svelte:fragment slot="error" let:retry>
    <button type="button" data-testid="retry" on:click={retry}>Retry</button>
  </svelte:fragment>
</ImageLoader>
