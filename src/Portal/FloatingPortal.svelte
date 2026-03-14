<script>
  /**
   * @slot {{ direction: "bottom" | "top" | "left" | "right" }}
   */

  /**
   * Required. Specify the anchor element to position the floating content relative to.
   * When using `bind:this`, this may be `null` initially until the element is mounted.
   * @type {null | HTMLElement}
   */
  export let anchor;

  /**
   * Set the preferred direction of the floating content.
   * The component will flip to the opposite direction
   * if there is not enough space.
   * @type {"bottom" | "top" | "left" | "right"}
   */
  export let direction = "bottom";

  /**
   * Set to `true` to open the floating content.
   * @type {boolean}
   */
  export let open = false;

  /**
   * Vertical gap in pixels when direction is top.
   * @type {number}
   */
  export let gapTop = 0;

  /**
   * Vertical gap in pixels when direction is bottom.
   * @type {number}
   */
  export let gapBottom = 0;

  /**
   * Horizontal gap in pixels when direction is left (space between anchor left and tooltip right).
   * @type {number}
   */
  export let horizontalGapLeft = 0;

  /**
   * Horizontal gap in pixels when direction is right (space between anchor right and tooltip left).
   * @type {number}
   */
  export let horizontalGapRight = 0;

  /**
   * Vertical offset in pixels when direction is left.
   * @type {number}
   */
  export let verticalAlignOffsetLeft = 0;

  /**
   * Vertical offset in pixels when direction is right.
   * @type {number}
   */
  export let verticalAlignOffsetRight = 0;

  /**
   * Specify the z-index of the floating portal.
   * By default, this value supersedes the z-index
   * of modals (9000) and list box menus (9100).
   */
  export let zIndex = 9200;

  /**
   * Set to `true` to use the content's intrinsic width and center it on the anchor.
   * When `false` (default), the portal width matches the anchor.
   * @type {boolean}
   */
  export let intrinsicWidth = false;

  /**
   * Obtain a reference to the floating portal element.
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { onMount, tick } from "svelte";
  import Portal from "./Portal.svelte";

  const SCROLLABLE_OVERFLOW_REGEX = /(auto|scroll)/;

  let mounted = true;

  /** @type {Array<HTMLElement | Document>} */
  let scrollableAncestors = [];

  /**
   * Walk up from the anchor element and collect every
   * scrollable ancestor so we can listen for their scroll events.
   * @param {HTMLElement} node
   * @returns {Array<HTMLElement | Document>}
   */
  function getScrollableAncestors(node) {
    /** @type {Array<HTMLElement | Document>} */
    const result = [];
    let current = node.parentElement;

    while (current) {
      const { overflow, overflowX, overflowY } = getComputedStyle(current);

      if (SCROLLABLE_OVERFLOW_REGEX.test(overflow + overflowY + overflowX)) {
        result.push(current);
      }

      current = current.parentElement;
    }

    return result;
  }

  function addScrollListeners() {
    for (const el of scrollableAncestors) {
      el.addEventListener("scroll", scheduleUpdate, { passive: true });
    }
  }

  function removeScrollListeners() {
    for (const el of scrollableAncestors) {
      el.removeEventListener("scroll", scheduleUpdate);
    }
  }

  onMount(() => {
    return () => {
      mounted = false;
      unobserveAnchor();
      removeScrollListeners();
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
  });

  /** @type {{ top: number, left: number, width?: number, actualDirection: "bottom" | "top" | "left" | "right" }} */
  let pos = {
    top: 0,
    left: 0,
    width: 0,
    actualDirection: direction,
  };

  /** @type {number | null} */
  let rafId = null;

  /** @type {MutationObserver | null} */
  let anchorObserver = null;

  function observeAnchor() {
    if (!anchor || anchorObserver) return;
    anchorObserver = new MutationObserver(scheduleUpdate);
    anchorObserver.observe(anchor, {
      attributes: true,
      attributeFilter: ["style", "class"],
      childList: false,
      subtree: false,
    });
  }

  function unobserveAnchor() {
    if (anchorObserver && anchor) {
      anchorObserver.disconnect();
      anchorObserver = null;
    }
  }

  function updatePosition() {
    if (!mounted || !anchor || !ref) return;

    const rect = anchor.getBoundingClientRect();
    const floatingRect = ref.getBoundingClientRect();

    const isVertical = direction === "top" || direction === "bottom";
    let actualDirection = direction;

    if (isVertical) {
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

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
    } else {
      const spaceRight = window.innerWidth - rect.right;
      const spaceLeft = rect.left;

      if (
        direction === "right" &&
        spaceRight < floatingRect.width + horizontalGapRight &&
        spaceLeft > spaceRight
      ) {
        actualDirection = "left";
      } else if (
        direction === "left" &&
        spaceLeft < floatingRect.width + horizontalGapLeft &&
        spaceRight > spaceLeft
      ) {
        actualDirection = "right";
      }
    }

    /** @type {number} */
    let top;
    /** @type {number} */
    let left;
    /** @type {number | undefined} */
    let width;

    if (actualDirection === "bottom") {
      top = rect.bottom + window.scrollY + gapBottom;
      left = rect.left + window.scrollX;
      width = rect.width;
    } else if (actualDirection === "top") {
      top = rect.top + window.scrollY - floatingRect.height - gapTop;
      left = rect.left + window.scrollX;
      width = rect.width;
    } else if (actualDirection === "right") {
      top =
        rect.top +
        window.scrollY +
        rect.height / 2 -
        floatingRect.height / 2 +
        verticalAlignOffsetRight;
      left = rect.right + window.scrollX + horizontalGapRight;
    } else {
      // left
      top =
        rect.top +
        window.scrollY +
        rect.height / 2 -
        floatingRect.height / 2 +
        verticalAlignOffsetLeft;
      left =
        rect.left + window.scrollX - floatingRect.width - horizontalGapLeft;
    }

    const useIntrinsicCenter =
      intrinsicWidth &&
      (actualDirection === "top" || actualDirection === "bottom");
    pos = {
      top,
      left: useIntrinsicCenter
        ? rect.left + window.scrollX + rect.width / 2
        : left,
      ...(width !== undefined && { width }),
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

  $: useIntrinsicCenter =
    intrinsicWidth &&
    (actualDirection === "top" || actualDirection === "bottom");
  $: portalStyle = [
    "position: absolute",
    `top: ${pos.top}px`,
    `left: ${pos.left}px`,
    useIntrinsicCenter ? "transform: translateX(-50%)" : null,
    !useIntrinsicCenter && pos.width != null ? `width: ${pos.width}px` : null,
    `z-index: ${zIndex}`,
  ]
    .filter(Boolean)
    .join("; ");

  $: if (!open) {
    unobserveAnchor();
    removeScrollListeners();
    scrollableAncestors = [];
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  $: if (open && anchor && ref) {
    unobserveAnchor();
    removeScrollListeners();
    scrollableAncestors = getScrollableAncestors(anchor);
    addScrollListeners();
    observeAnchor();
    tick().then(() => {
      updatePosition();
      // For left/right, portal size is not set until content lays out; run again after layout
      const isHorizontal = direction === "left" || direction === "right";
      if (isHorizontal) {
        requestAnimationFrame(updatePosition);
      }
    });
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
    style={portalStyle}
  >
    <slot direction={actualDirection} />
  </Portal>
{/if}
