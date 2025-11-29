<script lang="ts">
  import { Portal } from "carbon-components-svelte";

  export let showPortal = true;
  export let portalContent = "Portal content";
  export let tag: keyof HTMLElementTagNameMap = "div";
</script>

{#if showPortal}
  <Portal {tag} {...$$restProps}>
    {portalContent}
  </Portal>
{/if}

