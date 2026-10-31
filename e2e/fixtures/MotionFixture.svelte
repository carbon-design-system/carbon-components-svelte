<script lang="ts">
  import { fade, fly, slide } from "carbon-components-svelte/motion";

  let show = true;
</script>

<button type="button" on:click={() => (show = !show)}>Toggle</button>

{#if show}
  <div data-testid="fly" transition:fly={{ y: 16 }}>fly</div>
  <div data-testid="slide" transition:slide>slide</div>
  <div data-testid="fade" transition:fade>fade</div>
{/if}
