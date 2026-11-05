<script>
  /**
   * @restProps {div}
   * @slot {{ direction: "bottom" | "top" | "left" | "right", align: "start" | "center" | "end", shift: number, anchorWidth: number, anchorHeight: number }}
   */

  /**
   * Required. Specify the anchor element to position the floating content relative to.
   * When using `bind:this`, this may be `null` initially until the element is mounted.
   * Any object with `getBoundingClientRect()` works, such as a caret or a
   * pointer (see `pointAnchor` and `caretAnchor`). Give it a `contextElement`
   * when it lives in a scrolling box.
   * @type {null | HTMLElement | { getBoundingClientRect: () => DOMRectReadOnly, contextElement?: Element | null }}
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
  export let zIndex = FLOATING_PORTAL_Z_INDEX;

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
   * Control when a resolved flip side is reused instead of recomputed on the
   * next position update:
   * - `"none"` (default): recompute the flip on every update.
   * - `"after-flip"`: once the content flips away from `direction` (the
   *   preferred side does not fit), reuse that side for the rest of the open
   *   session. Recomputes freely until a flip actually happens, so a floating
   *   element whose content resizes (e.g. a tooltip whose text changes to
   *   something narrower) does not snap back to the preferred side mid-session.
   * - `"always"`: lock whichever side the initial open settles on (flipped or
   *   not) for the rest of the open session, so later scroll/resize updates
   *   only reposition along that side instead of re-evaluating the flip.
   * @type {"none" | "after-flip" | "always"}
   */
  export let lockDirection = "none";

  /**
   * Set to `true` to take another alignment along the anchor's edge when the
   * box runs past the window: with `intrinsicWidth` above or below the anchor,
   * `start` becomes `end` and the other way round, and `center` takes the edge
   * with room. Set to `"any"` to let an edge also fall back to `center`.
   * The alignment it settled on is the slot's `align`.
   * @type {boolean | "any"}
   */
  export let flipAlign = false;

  /**
   * Set to `true` to open across the anchor when `direction` has no room on
   * either side: a `left` or `right` box opens `bottom`, or `top` when only
   * that fits, and a `top` or `bottom` box opens `right`, or `left`. The side
   * it settled on is the slot's `direction`.
   * @type {boolean}
   */
  export let flipAxis = false;

  /**
   * Room in pixels to keep between the floating content and the window's
   * edges when it flips or reports a `shift`.
   * @type {number}
   */
  export let padding = 0;

  /**
   * Set to a number of pixels to report how far the content would have to
   * slide along the anchor's edge to sit that far inside the window, as the
   * slot's `shift`. The portal itself stays on the anchor, so a caret can
   * keep pointing at it: apply `shift` to the content.
   * @type {number | false}
   */
  export let shift = false;

  /**
   * Set to `true` to read `intrinsicAlign` as `start` and `end` of the
   * anchor's inline axis, so they swap under `dir="rtl"` on a box above or
   * below the anchor. By default they are the left and the right.
   * @type {boolean}
   */
  export let logical = false;

  /**
   * Obtain a reference to the floating portal element.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * DOM node to mount the portal into. When unset, uses the anchor's nearest
   * `<dialog>`, `[popover]` or fullscreen element, else `document.body`.
   * @type {HTMLElement | null}
   */
  export let target = null;

  import { onMount, tick } from "svelte";
  import { FLOATING_PORTAL_Z_INDEX } from "../constants/layout.js";
  import { anchorElement, autoUpdate } from "../utils/auto-update.js";
  import { floatingPosition } from "../utils/floating-position.js";
  import { physicalAlign } from "../utils/inline-align.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import {
    fixedBlockOffset,
    hasFixedBlock,
    portalRoot,
  } from "../utils/portal-decision.js";
  import Portal from "./Portal.svelte";

  const layoutDirection = getLayoutDirection();

  let mounted = true;

  onMount(() => {
    return () => {
      mounted = false;
      stopUpdating();
    };
  });

  /** @type {{ top: number, left: number, width?: number, actualDirection: "bottom" | "top" | "left" | "right", actualAlign: "start" | "center" | "end", shiftX: number, exact: boolean, caretNudgePx?: number }} */
  let pos = {
    top: 0,
    left: 0,
    width: 0,
    actualDirection: direction,
    actualAlign: intrinsicAlign,
    shiftX: 0,
    exact: false,
    caretNudgePx: undefined,
  };
  // The anchor's size when the box was last placed, for styles that follow it.
  let anchorWidth = 0;
  let anchorHeight = 0;

  // Read when the portal opens: nothing reports a `dir` change. A `start` or
  // `end` is an inline side above and below the anchor.
  $: rtl =
    open &&
    logical &&
    resolveLayoutDirection(
      $layoutDirection,
      anchor ? anchorElement(anchor) : null,
    ) === "rtl";
  $: alignment =
    logical && (direction === "top" || direction === "bottom")
      ? physicalAlign(intrinsicAlign, rtl)
      : intrinsicAlign;

  // Default portal target: the anchor's nearest top layer (`<dialog>`,
  // `[popover]`) or fullscreen element. `target` wins. Read when opened:
  // fullscreen can start any time.
  $: effectiveTarget =
    target ?? (open && anchor ? portalRoot(anchorElement(anchor)) : null);

  // Inside dialog/popover, absolute is relative to the target, not the viewport.
  // Use fixed + zero scroll offsets; scroll offsets only apply on document.body.
  $: useFixedPosition =
    effectiveTarget != null &&
    typeof document !== "undefined" &&
    effectiveTarget !== document.body;

  // Whether a transformed or contained ancestor of the portal places `fixed`
  // from its own edge, not the window's. Read when an open session starts.
  let fixedBlock = false;

  // The side latched for the rest of an open session per `lockDirection`.
  // Reset each open session.
  /** @type {"bottom" | "top" | "left" | "right" | null} */
  let lockedDirection = null;

  /**
   * Reads layout, then returns the write: the engine runs every open
   * overlay's read before any write.
   * @returns {(() => void) | undefined}
   */
  function measure() {
    if (!mounted || !anchor || !ref) return;

    const anchorRect = anchor.getBoundingClientRect();
    const next = floatingPosition({
      anchorRect,
      floatingRect: ref.getBoundingClientRect(),
      viewport: {
        // The room a box has is the page's, inside its scrollbars.
        innerWidth: document.documentElement.clientWidth || window.innerWidth,
        innerHeight:
          document.documentElement.clientHeight || window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      },
      direction,
      lockedDirection: lockedDirection ?? undefined,
      useFixedPosition,
      intrinsicWidth,
      intrinsicAlign: alignment,
      gapTop,
      gapBottom,
      horizontalGapLeft,
      horizontalGapRight,
      verticalAlignOffsetLeft,
      verticalAlignOffsetRight,
      flipAlign,
      flipAxis,
      padding,
      shift,
    });
    if (useFixedPosition && fixedBlock) {
      const offset = fixedBlockOffset(ref, next.left, next.top);
      next.left -= offset.x;
      next.top -= offset.y;
    }

    return () => {
      pos = next;
      anchorWidth = anchorRect.width;
      anchorHeight = anchorRect.height;
      // Latch the side only once it actually flips away from the preferred
      // direction. Until then keep recomputing, so the initial layout passes
      // (which run before the content's final width is known for side
      // placements) can still flip. Once flipped, stay flipped for the session
      // so a content resize does not snap the box back.
      if (
        lockDirection === "after-flip" &&
        lockedDirection === null &&
        pos.actualDirection !== direction
      ) {
        lockedDirection = pos.actualDirection;
      }
    };
  }

  function updatePosition() {
    measure()?.();
  }

  // Lock whatever side the open-time layout passes settled on, flipped or
  // not, so a later scroll/resize/mutation update repositions along that
  // side instead of re-running the flip check mid-interaction. Called once
  // the settling passes finish (see the `open` effect below), not from
  // `measure()` itself. Locking there would latch onto the very
  // scroll/resize update that triggered the call, defeating the point.
  function lockAfterSettling() {
    if (lockDirection === "always" && lockedDirection === null) {
      lockedDirection = pos.actualDirection;
    }
  }

  // Everything that moves the anchor or the box places it again: scroll,
  // resize, a transition on an ancestor, the anchor's style, and either
  // box's size. One shared listener or observer serves every open portal.
  /** @type {null | (() => void) & { update?: () => void }} */
  let stopAutoUpdate = null;
  /** @type {null | { anchor: unknown, ref: unknown }} */
  let updating = null;

  function stopUpdating() {
    stopAutoUpdate?.();
    stopAutoUpdate = null;
    updating = null;
  }

  /**
   * @param {NonNullable<typeof anchor>} anchorNode
   * @param {HTMLElement} node
   */
  function startUpdating(anchorNode, node) {
    stopUpdating();
    updating = { anchor: anchorNode, ref: node };
    fixedBlock =
      useFixedPosition && effectiveTarget
        ? hasFixedBlock(effectiveTarget)
        : false;
    stopAutoUpdate = autoUpdate(anchorNode, node, measure, {
      immediate: false,
    });
  }

  // Re-place when the alignment changes while open (the side doesn't move).
  // Compared by value: `ref` is a `bind:this` target, re-invalidated on
  // every update, so it can't gate this.
  let placedAlign = alignment;
  $: if (alignment !== placedAlign) {
    placedAlign = alignment;
    if (open) stopAutoUpdate?.update?.();
  }

  $: actualDirection = pos.actualDirection;
  $: actualAlign = pos.actualAlign;

  $: useIntrinsicWidthVertical =
    intrinsicWidth &&
    (actualDirection === "top" || actualDirection === "bottom");

  // Placed by the point of the anchor its alignment names, the box slides
  // back by its own width.
  $: intrinsicTranslateX = useIntrinsicWidthVertical
    ? actualAlign === "center"
      ? "transform: translateX(-50%)"
      : actualAlign === "end"
        ? "transform: translateX(-100%)"
        : null
    : null;

  // Fitting the alignment or the slide reads the box's own width. A box placed
  // at the end of the page would be squeezed to the room left of its left
  // edge, and fit it: let it have the width its content asks for.
  $: needsOwnWidth =
    useIntrinsicWidthVertical && (flipAlign || flipAxis || shift !== false);

  $: portalStyle = [
    useFixedPosition ? "position: fixed" : "position: absolute",
    `top: ${pos.top}px`,
    `left: ${pos.left}px`,
    intrinsicTranslateX,
    !useIntrinsicWidthVertical && pos.width != null
      ? `width: ${pos.width}px`
      : null,
    needsOwnWidth ? "width: max-content" : null,
    `z-index: ${zIndex}`,
    pos.caretNudgePx == null
      ? null
      : `--ccs-tooltip-caret-nudge: ${pos.caretNudgePx}px`,
  ]
    .filter(Boolean)
    .join("; ");

  $: if (!open) {
    stopUpdating();
    // Recompute the side fresh on the next open.
    lockedDirection = null;
  }

  // `ref` is re-invalidated on every update, so start only for a new anchor
  // or a new box.
  $: if (
    open &&
    anchor &&
    ref &&
    (updating?.anchor !== anchor || updating?.ref !== ref)
  ) {
    startUpdating(anchor, ref);
    tick().then(() => {
      updatePosition();
      // Second pass after layout: side placements need width; intrinsic caret needs stable rect.
      const needsSecondLayoutPass =
        direction === "left" ||
        direction === "right" ||
        (intrinsicWidth && (direction === "top" || direction === "bottom"));
      if (needsSecondLayoutPass) {
        requestAnimationFrame(() => {
          updatePosition();
          lockAfterSettling();
        });
      } else {
        lockAfterSettling();
      }
    });
  }
</script>

{#if open}
  <Portal
    bind:ref
    target={effectiveTarget}
    {...$$restProps}
    data-floating-portal
    data-floating-direction={pos.actualDirection}
    data-floating-intrinsic-align={intrinsicWidth ? actualAlign : undefined}
    style={portalStyle}
  >
    <slot
      direction={actualDirection}
      align={actualAlign}
      shift={pos.shiftX}
      {anchorWidth}
      {anchorHeight}
    />
  </Portal>
{/if}
