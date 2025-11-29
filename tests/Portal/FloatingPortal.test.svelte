<script lang="ts">
  import { FloatingPortal } from "carbon-components-svelte";

  export let showPortal = true;
  export let reference: HTMLElement | null = null;
  export let placement:
    | "top"
    | "top-start"
    | "top-end"
    | "right"
    | "right-start"
    | "right-end"
    | "bottom"
    | "bottom-start"
    | "bottom-end"
    | "left"
    | "left-start"
    | "left-end" = "bottom";
  export let offset = 0;
  export let autoUpdate = true;
  export let portalContent = "Floating portal content";
</script>

<button bind:this={reference} type="button">Reference button</button>

{#if showPortal && reference}
  <FloatingPortal {reference} {placement} {offset} {autoUpdate}>
    {portalContent}
  </FloatingPortal>
{/if}

