<svelte:options accessors />

<script lang="ts">
  import { Portal } from "carbon-components-svelte";

  export let showPortal = true;
  export let portalContent = "Portal content";
  export let tag: keyof HTMLElementTagNameMap = "div";
  export let ref: HTMLElement | null = null;
</script>

{#if showPortal}
  <Portal {tag} bind:ref {...$$restProps}>
    {portalContent}
  </Portal>
{/if}

