// @ts-check

import { rafThrottle } from "./raf-throttle.js";
import { observeResize } from "./shared-observer.js";

/** Pixels of slack that still count as "at the edge", for fractional scroll offsets. */
const DEFAULT_TOLERANCE = 1;

/**
 * @typedef {Object} ScrollEdgeState
 * @property {boolean} isXScrollable Content is wider than the scroller.
 * @property {boolean} isYScrollable Content is taller than the scroller.
 * @property {boolean} atTop Scrolled to the top edge.
 * @property {boolean} atBottom Scrolled to the bottom edge.
 * @property {boolean} atStart Scrolled to the inline start edge: the left in LTR, the right in RTL.
 * @property {boolean} atEnd Scrolled to the inline end edge: the right in LTR, the left in RTL.
 */

/**
 * @typedef {Object} ScrollEdgesParams
 * @property {(state: ScrollEdgeState) => void} onChange Called after mount and whenever the state changes.
 * @property {number} [tolerance] Pixels of slack that still count as at an edge. Default: `1`.
 * @property {boolean} [enabled] Set to `false` to stop listening. Default: `true`.
 */

/**
 * Read the scroll edge state from the scroll metrics of an element.
 *
 * Browsers report a negative `scrollLeft` in RTL (`0` at the start, falling
 * toward the end), so the offset is taken as a distance from the start. An
 * axis that fits reports both of its edges as reached.
 *
 * @param {Pick<Element, "scrollLeft" | "scrollTop" | "scrollWidth" | "scrollHeight" | "clientWidth" | "clientHeight">} metrics
 * @param {number} [tolerance]
 * @returns {ScrollEdgeState}
 */
export function getScrollEdgeState(metrics, tolerance = DEFAULT_TOLERANCE) {
  const { scrollWidth, scrollHeight, clientWidth, clientHeight } = metrics;
  const fromStart = Math.abs(metrics.scrollLeft);
  const fromTop = Math.abs(metrics.scrollTop);
  return {
    isXScrollable: scrollWidth - clientWidth > tolerance,
    isYScrollable: scrollHeight - clientHeight > tolerance,
    atTop: fromTop <= tolerance,
    atBottom: fromTop + clientHeight >= scrollHeight - tolerance,
    atStart: fromStart <= tolerance,
    atEnd: fromStart + clientWidth >= scrollWidth - tolerance,
  };
}

/**
 * @param {ScrollEdgeState} a
 * @param {ScrollEdgeState} b
 */
function isSameScrollEdgeState(a, b) {
  return (
    a.isXScrollable === b.isXScrollable &&
    a.isYScrollable === b.isYScrollable &&
    a.atTop === b.atTop &&
    a.atBottom === b.atBottom &&
    a.atStart === b.atStart &&
    a.atEnd === b.atEnd
  );
}

/**
 * Svelte action: report whether a scroller overflows and which edges it
 * has reached, as `{ isXScrollable, isYScrollable, atTop, atBottom,
 * atStart, atEnd }`. `onChange` runs once after mount, then only when the
 * state differs from the last one reported.
 *
 * The scroller and its direct children share the app's `ResizeObserver`;
 * scrolling is passive and measured at most once per frame. The server
 * renders without it, so start from a state that shows no fades.
 *
 * @param {HTMLElement} node
 * @param {ScrollEdgesParams} params
 * @returns {{ update: (params: ScrollEdgesParams) => void, destroy: () => void }}
 * @example
 * ```svelte
 * <div use:scrollEdges={{ onChange: (s) => (state = s) }}>...</div>
 * ```
 */
export function scrollEdges(node, params) {
  let { onChange, tolerance = DEFAULT_TOLERANCE, enabled = true } = params;

  /** @type {ScrollEdgeState | null} */
  let last = null;
  /** @type {(() => void) | null} */
  let detach = null;

  function measure() {
    const next = getScrollEdgeState(node, tolerance);
    if (last && isSameScrollEdgeState(last, next)) return;
    last = next;
    onChange?.(next);
  }

  function attach() {
    const onScroll = rafThrottle(measure);
    node.addEventListener("scroll", onScroll, { passive: true });

    /** @type {Map<Element, () => void>} */
    const stops = new Map();
    stops.set(node, observeResize(node, measure));

    // Content that grows without resizing the scroller is only visible
    // through its children, so watch each direct child too.
    function syncChildren() {
      const children = new Set(node.children);
      for (const [element, stop] of stops) {
        if (element !== node && !children.has(element)) {
          stop();
          stops.delete(element);
        }
      }
      for (const child of children) {
        if (!stops.has(child)) stops.set(child, observeResize(child, measure));
      }
    }
    syncChildren();

    // `childList` only: no subtree, so no layout read per mutation.
    const mutations =
      typeof MutationObserver === "function"
        ? new MutationObserver(syncChildren)
        : null;
    mutations?.observe(node, { childList: true });

    detach = () => {
      node.removeEventListener("scroll", onScroll);
      onScroll.cancel();
      mutations?.disconnect();
      for (const stop of stops.values()) stop();
      stops.clear();
    };
  }

  function stop() {
    detach?.();
    detach = null;
    // Re-enabling reports the current state again.
    last = null;
  }

  if (enabled) attach();

  return {
    update(next) {
      onChange = next.onChange;
      const nextTolerance = next.tolerance ?? DEFAULT_TOLERANCE;
      const nextEnabled = next.enabled ?? true;
      const toleranceChanged = nextTolerance !== tolerance;
      tolerance = nextTolerance;

      if (nextEnabled !== enabled) {
        enabled = nextEnabled;
        // Attaching queues its own first measurement.
        if (enabled) attach();
        else stop();
      } else if (enabled && toleranceChanged) {
        measure();
      }
    },
    destroy: stop,
  };
}
