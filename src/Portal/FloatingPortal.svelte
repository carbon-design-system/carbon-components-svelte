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
   * Set to `true` to use the content's intrinsic width instead of the anchor width.
   * Position along the anchor edge is controlled by `intrinsicAlign`.
   * When `false` (default), the portal width matches the anchor.
   * @type {boolean}
   */
  export let intrinsicWidth = false;

  /**
   * When `intrinsicWidth` is true, align the floating box to the anchor (Carbon-style):
   * - `top` / `bottom`: horizontal alignment (`start` = anchor left, `center`, `end` = anchor right).
   * - `left` / `right`: vertical alignment (`start` = anchor top, `center`, `end` = anchor bottom).
   * Ignored when `intrinsicWidth` is false.
   * @type {"start" | "center" | "end"}
   */
  export let intrinsicAlign = "center";

  /**
   * Set to `true` to keep a flipped side stable for the duration of an open
   * session. Once the content flips away from `direction` (because the preferred
   * side does not fit), that side is reused even if the content later resizes,
   * so a floating element whose content swaps (e.g. a tooltip whose text changes
   * to something narrower) does not snap back to the preferred side mid-session.
   * @type {boolean}
   */
  export let lockDirection = false;

  /**
   * Obtain a reference to the floating portal element.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * DOM node to mount the portal into. When unset, uses the anchor's nearest
   * `<dialog>` or `[popover]`, else `document.body`.
   * @type {HTMLElement | null}
   */
  export let target = null;

  import { onMount, tick } from "svelte";
  import { floatingPosition } from "../utils/floatingPosition.js";
  import { getScrollableAncestors } from "../utils/getScrollableAncestors.js";
  import { rafThrottle } from "../utils/rafThrottle.js";
  import Portal from "./Portal.svelte";

  let mounted = true;

  /** @type {Array<HTMLElement | Document>} */
  let scrollableAncestors = [];

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
      unobserveFloating();
      removeScrollListeners();
      scheduleUpdate.cancel();
    };
  });

  /** @type {{ top: number, left: number, width?: number, actualDirection: "bottom" | "top" | "left" | "right", caretNudgePx?: number }} */
  let pos = {
    top: 0,
    left: 0,
    width: 0,
    actualDirection: direction,
    caretNudgePx: undefined,
  };

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

  /** @type {ResizeObserver | null} */
  let floatingObserver = null;

  // Reposition when the floating content itself resizes (e.g. a tooltip whose
  // text swaps). Caret nudge for intrinsic `start`/`end` alignment depends on
  // the floating width, so a stale width leaves the caret off the anchor.
  function observeFloating() {
    if (!ref || floatingObserver || typeof ResizeObserver === "undefined") {
      return;
    }
    // Reposition synchronously (not rAF-throttled). ResizeObserver fires after
    // layout but before paint, so updating here applies the corrected position
    // in the same frame the content resized — no one-frame caret drift.
    floatingObserver = new ResizeObserver(() => updatePosition());
    floatingObserver.observe(ref);
  }

  function unobserveFloating() {
    if (floatingObserver) {
      floatingObserver.disconnect();
      floatingObserver = null;
    }
  }

  // Default portal target: nearest <dialog> or [popover] on the anchor. `target` wins.
  $: effectiveTarget = target ?? anchor?.closest("dialog,[popover]") ?? null;

  // Inside dialog/popover, absolute is relative to the target, not the viewport.
  // Use fixed + zero scroll offsets; scroll offsets only apply on document.body.
  $: useFixedPosition =
    effectiveTarget != null &&
    typeof document !== "undefined" &&
    effectiveTarget !== document.body;

  // The side chosen on open; reused on subsequent updates when `lockDirection`
  // is set so content resizes do not re-trigger a flip. Reset each open session.
  /** @type {"bottom" | "top" | "left" | "right" | null} */
  let lockedDirection = null;

  function updatePosition() {
    if (!mounted || !anchor || !ref) return;

    pos = floatingPosition({
      anchorRect: anchor.getBoundingClientRect(),
      floatingRect: ref.getBoundingClientRect(),
      viewport: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      },
      direction,
      lockedDirection: lockDirection
        ? (lockedDirection ?? undefined)
        : undefined,
      useFixedPosition,
      intrinsicWidth,
      intrinsicAlign,
      gapTop,
      gapBottom,
      horizontalGapLeft,
      horizontalGapRight,
      verticalAlignOffsetLeft,
      verticalAlignOffsetRight,
    });

    // Latch the side only once it actually flips away from the preferred
    // direction. Until then keep recomputing, so the initial layout passes
    // (which run before the content's final width is known for side placements)
    // can still flip. Once flipped, stay flipped for the session so a content
    // resize — e.g. a tooltip whose text swaps to something narrower — does not
    // snap the box back to the preferred side.
    if (
      lockDirection &&
      lockedDirection === null &&
      pos.actualDirection !== direction
    ) {
      lockedDirection = pos.actualDirection;
    }
  }

  const scheduleUpdate = rafThrottle(updatePosition);

  $: actualDirection = pos.actualDirection;

  $: useIntrinsicWidthVertical =
    intrinsicWidth &&
    (actualDirection === "top" || actualDirection === "bottom");

  $: intrinsicTranslateX = useIntrinsicWidthVertical
    ? intrinsicAlign === "center"
      ? "transform: translateX(-50%)"
      : intrinsicAlign === "end"
        ? "transform: translateX(-100%)"
        : null
    : null;

  $: portalStyle = [
    useFixedPosition ? "position: fixed" : "position: absolute",
    `top: ${pos.top}px`,
    `left: ${pos.left}px`,
    intrinsicTranslateX,
    !useIntrinsicWidthVertical && pos.width != null
      ? `width: ${pos.width}px`
      : null,
    `z-index: ${zIndex}`,
    pos.caretNudgePx == null
      ? null
      : `--ccs-tooltip-caret-nudge: ${pos.caretNudgePx}px`,
  ]
    .filter(Boolean)
    .join("; ");

  $: if (!open) {
    unobserveAnchor();
    unobserveFloating();
    removeScrollListeners();
    scrollableAncestors = [];
    scheduleUpdate.cancel();
    // Recompute the side fresh on the next open.
    lockedDirection = null;
  }

  $: if (open && anchor && ref) {
    unobserveAnchor();
    unobserveFloating();
    removeScrollListeners();
    scrollableAncestors = getScrollableAncestors(anchor);
    addScrollListeners();
    observeAnchor();
    observeFloating();
    tick().then(() => {
      updatePosition();
      // Second pass after layout: side placements need width; intrinsic caret needs stable rect.
      const needsSecondLayoutPass =
        direction === "left" ||
        direction === "right" ||
        (intrinsicWidth && (direction === "top" || direction === "bottom"));
      if (needsSecondLayoutPass) {
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
    target={effectiveTarget}
    {...$$restProps}
    data-floating-portal
    data-floating-direction={pos.actualDirection}
    data-floating-intrinsic-align={intrinsicWidth ? intrinsicAlign : undefined}
    style={portalStyle}
  >
    <slot direction={actualDirection} />
  </Portal>
{/if}
