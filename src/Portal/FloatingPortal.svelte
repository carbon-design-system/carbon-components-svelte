<script>
  /**
   * Specify the anchor element to position the floating content relative to.
   * @type {null | HTMLElement}
   */
  export let anchor = null;

  /**
   * Set the preferred direction of the floating content.
   * The component will flip to the opposite direction
   * if there is not enough space.
   * @type {"top" | "bottom"}
   */
  export let direction = "bottom";

  /**
   * Set to `true` to open the floating content.
   * @type {boolean}
   */
  export let open = false;

  /**
   * Specify the z-index of the floating portal.
   * By default, this value supersedes the z-index
   * of modals (9000) and list box menus (9100).
   */
  export let zIndex = 9200;

  /**
   * Obtain a reference to the floating portal element.
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { onMount, tick } from "svelte";
  import Portal from "./Portal.svelte";

  let mounted = true;

  onMount(() => {
    return () => {
      mounted = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
  });

  /** @type {{ top: number, left: number, width: number, actualDirection: "top" | "bottom" }} */
  let pos = {
    top: 0,
    left: 0,
    width: 0,
    actualDirection: direction,
  };

  /** @type {number | null} */
  let rafId = null;

  function updatePosition() {
    if (!mounted || !anchor || !ref) return;

    const rect = anchor.getBoundingClientRect();
    const floatingRect = ref.getBoundingClientRect();

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let actualDirection = direction;

    if (
      direction === "bottom" &&
      spaceBelow < floatingRect.height &&
      spaceAbove > spaceBelow
    ) {
      actualDirection = "top";
    } else if (
      direction === "top" &&
      spaceAbove < floatingRect.height &&
      spaceBelow > spaceAbove
    ) {
      actualDirection = "bottom";
    }

    /** @type {number} */
    let top;

    if (actualDirection === "bottom") {
      top = rect.bottom + window.scrollY;
    } else {
      top = rect.top + window.scrollY - floatingRect.height;
    }

    pos = {
      top,
      left: rect.left + window.scrollX,
      width: rect.width,
      actualDirection,
    };
  }

  function scheduleUpdate() {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      updatePosition();
    });
  }

  // The actual rendered direction after auto-flipping.
  $: actualDirection = pos.actualDirection;

  $: if (!open && rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  $: if (open && anchor && ref) {
    tick().then(updatePosition);
  }
</script>

<svelte:window
  on:scroll|passive={open ? scheduleUpdate : undefined}
  on:resize|passive={open ? scheduleUpdate : undefined}
/>

{#if open}
  <Portal
    bind:ref
    {...$$restProps}
    data-floating-portal
    data-floating-direction={pos.actualDirection}
    style="position: absolute; top: {pos.top}px; left: {pos.left}px; width: {pos.width}px; z-index: {zIndex};"
  >
    <slot direction={actualDirection} />
  </Portal>
{/if}
