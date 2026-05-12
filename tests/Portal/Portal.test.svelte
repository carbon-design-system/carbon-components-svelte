<svelte:options accessors />

<script lang="ts">
  import { Portal } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let showPortal = true;
  export let portalContent = "Portal content";
  export let tag: ComponentProps<Portal>["tag"] = "div";
  export let ref: ComponentProps<Portal>["ref"] = null;
  export let target: ComponentProps<Portal>["target"] = null;
</script>

{#if showPortal}
  <Portal {tag} {target} bind:ref {...$$restProps}> {portalContent} </Portal>
{/if}
