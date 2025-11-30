<script>
  import {
    computePosition,
    autoUpdate as floatingAutoUpdate,
    offset as offsetMiddleware,
  } from "@floating-ui/dom";
  import { onMount, tick } from "svelte";
  import Portal from "./Portal.svelte";

  /**
   * Reference element to position the portal relative to
   * @type {HTMLElement | null}
   */
  export let reference = null;

  /**
   * Placement of the floating portal relative to the reference element
   * @type {"top" | "top-start" | "top-end" | "right" | "right-start" | "right-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end"}
   */
  export let placement = "bottom";

  /**
   * Offset in pixels from the reference element
   * @type {number}
   */
  export let offset = 0;

  /**
   * Set to `true` to enable auto-update positioning on scroll/resize
   * @type {boolean}
   */
  export let autoUpdate = true;

  /** @type {null | HTMLElement} */
  let floatingElement = null;

  /** @type {null | ReturnType<typeof floatingAutoUpdate>} */
  let cleanup = null;

  async function updatePosition() {
    if (!reference || !floatingElement) return;

    await tick();

    computePosition(reference, floatingElement, {
      placement,
      middleware: [offsetMiddleware(offset)],
    }).then(({ x, y }) => {
      if (!floatingElement) return;
      Object.assign(floatingElement.style, {
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }

  $: if (reference && floatingElement) {
    updatePosition();

    // Re-setup auto-update if enabled
    if (autoUpdate) {
      cleanup?.();
      cleanup = floatingAutoUpdate(reference, floatingElement, updatePosition);
    }
  }

  onMount(() => {
    if (autoUpdate && reference && floatingElement) {
      cleanup = floatingAutoUpdate(reference, floatingElement, updatePosition);
    }

    return () => {
      cleanup?.();
    };
  });
</script>

<Portal>
  <div bind:this={floatingElement}>
    <slot />
  </div>
</Portal>
