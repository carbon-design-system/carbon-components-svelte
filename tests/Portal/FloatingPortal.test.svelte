<svelte:options accessors />

<script lang="ts">
  import FloatingPortal from "carbon-components-svelte/Portal/FloatingPortal.svelte";
  import type { ComponentProps } from "svelte";

  export let open = false;
  export let direction: ComponentProps<FloatingPortal>["direction"] = "bottom";
  export let zIndex = 9200;
  export let intrinsicWidth = false;
  export let anchor: ComponentProps<FloatingPortal>["anchor"] = null;
  export let ref: ComponentProps<FloatingPortal>["ref"] = null;
  export let scrollableContainer = false;
  export let gapTop = 0;
  export let gapBottom = 0;
  export let horizontalGapLeft = 0;
  export let horizontalGapRight = 0;
  export let verticalAlignOffsetLeft = 0;
  export let verticalAlignOffsetRight = 0;
  export let intrinsicAlign: ComponentProps<FloatingPortal>["intrinsicAlign"] =
    "center";
  export let target: ComponentProps<FloatingPortal>["target"] = null;
  export let lockDirection: ComponentProps<FloatingPortal>["lockDirection"] =
    "none";
  export let flipAlign: ComponentProps<FloatingPortal>["flipAlign"] = false;
  export let padding = 0;
  export let shift: ComponentProps<FloatingPortal>["shift"] = false;
  export let logical = false;
  // An anchor that is a point, not an element.
  export let virtual: { x: number; y: number } | null = null;
  export let dialogAncestor = false;
  export let popoverAncestor = false;

  function resolveAnchor(
    element: ComponentProps<FloatingPortal>["anchor"],
    point: { x: number; y: number } | null,
  ): ComponentProps<FloatingPortal>["anchor"] {
    if (!point) return element;
    return {
      getBoundingClientRect: () => new DOMRect(point.x, point.y, 0, 0),
      contextElement: element instanceof HTMLElement ? element : null,
    };
  }

  // Svelte 3's element typings predate the `popover` attribute.
  const popoverAttrs: Record<string, string> = { popover: "manual" };
</script>

{#if scrollableContainer}
  <div data-testid="scroll-container" style="overflow: auto; height: 200px;">
    <div data-testid="anchor" bind:this={anchor}>Anchor element</div>
  </div>
{:else if dialogAncestor}
  <dialog data-testid="dialog-ancestor" open>
    <div data-testid="anchor" bind:this={anchor}>Anchor element</div>
  </dialog>
{:else if popoverAncestor}
  <div data-testid="popover-ancestor" {...popoverAttrs}>
    <div data-testid="anchor" bind:this={anchor}>Anchor element</div>
  </div>
{:else}
  <div data-testid="anchor" bind:this={anchor}>Anchor element</div>
{/if}

<FloatingPortal
  anchor={resolveAnchor(anchor, virtual)}
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
  {lockDirection}
  {flipAlign}
  {padding}
  {shift}
  {logical}
  bind:ref
  let:align
  let:shift={slide}
>
  Floating content
  <span data-testid="slot" data-align={align} data-shift={slide}></span>
</FloatingPortal>
