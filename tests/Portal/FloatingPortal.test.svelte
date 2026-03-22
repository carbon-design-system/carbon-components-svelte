<svelte:options accessors />

<script lang="ts">
  import { FloatingPortal } from "carbon-components-svelte";

  export let open = false;
  export let direction: "top" | "bottom" | "left" | "right" = "bottom";
  export let zIndex = 9200;
  export let intrinsicWidth = false;
  export let anchor: HTMLElement | null = null;
  export let ref: HTMLElement | null = null;
  export let content = "Floating content";
  export let scrollableContainer = false;
  export let containerRef: HTMLElement | null = null;
  export let gapTop = 0;
  export let gapBottom = 0;
  export let horizontalGapLeft = 0;
  export let horizontalGapRight = 0;
  export let verticalAlignOffsetLeft = 0;
  export let verticalAlignOffsetRight = 0;
  export let intrinsicAlign: "start" | "center" | "end" = "center";
</script>

{#if scrollableContainer}
  <div
    data-testid="scroll-container"
    bind:this={containerRef}
    style="overflow: auto; height: 200px;"
  >
    <div data-testid="anchor" bind:this={anchor}>Anchor element</div>
  </div>
{:else}
  <div data-testid="anchor" bind:this={anchor}>Anchor element</div>
{/if}

<FloatingPortal
  {anchor}
  {direction}
  {open}
  {zIndex}
  {intrinsicWidth}
  {gapTop}
  {gapBottom}
  {horizontalGapLeft}
  {horizontalGapRight}
  {verticalAlignOffsetLeft}
  {verticalAlignOffsetRight}
  {intrinsicAlign}
  bind:ref
>
  {content}
</FloatingPortal>
