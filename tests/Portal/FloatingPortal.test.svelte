<svelte:options accessors />

<script lang="ts">
  import { FloatingPortal } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let direction: ComponentProps<FloatingPortal>["direction"] = "bottom";
  export let zIndex = 9200;
  export let intrinsicWidth = false;
  export let anchor: ComponentProps<FloatingPortal>["anchor"] = null;
  export let ref: ComponentProps<FloatingPortal>["ref"] = null;
  export let content = "Floating content";
  export let scrollableContainer = false;
  export let containerRef: HTMLElement | null = null;
  export let gapTop = 0;
  export let gapBottom = 0;
  export let horizontalGapLeft = 0;
  export let horizontalGapRight = 0;
  export let verticalAlignOffsetLeft = 0;
  export let verticalAlignOffsetRight = 0;
  export let intrinsicAlign: ComponentProps<FloatingPortal>["intrinsicAlign"] =
    "center";
  export let target: ComponentProps<FloatingPortal>["target"] = null;
  export let dialogAncestor = false;
  export let dialogRef: HTMLDialogElement | null = null;
  export let popoverAncestor = false;
  export let popoverRef: HTMLElement | null = null;
</script>

{#if scrollableContainer}
  <div
    data-testid="scroll-container"
    bind:this={containerRef}
    style="overflow: auto; height: 200px;"
  >
    <div data-testid="anchor" bind:this={anchor}>Anchor element</div>
  </div>
{:else if dialogAncestor}
  <dialog data-testid="dialog-ancestor" bind:this={dialogRef} open>
    <div data-testid="anchor" bind:this={anchor}>Anchor element</div>
  </dialog>
{:else if popoverAncestor}
  <div data-testid="popover-ancestor" popover="manual" bind:this={popoverRef}>
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
  {target}
  bind:ref
>
  {content}
</FloatingPortal>
