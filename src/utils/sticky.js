// @ts-check
import { toCssLength } from "./css-length.js";
import { observeIntersection } from "./shared-observer.js";
import { joinStack } from "./sticky-stack.js";

const SENTINEL_STYLE =
  "display:block;width:0;height:0;margin:0;padding:0;border:0;visibility:hidden;pointer-events:none";

const NON_FLOW_DISPLAY = /flex|grid|contents/;

/**
 * Whether a zero-height sibling leaves `parent`'s layout as it was. A flex
 * or grid parent would give it a gap or a cell.
 *
 * @param {HTMLElement | null} parent
 */
function isFlowParent(parent) {
  return !!parent && !NON_FLOW_DISPLAY.test(getComputedStyle(parent).display);
}

/**
 * Svelte action: report whether a `position: sticky` element is stuck,
 * pinned at its offset while content scrolls under it.
 *
 * A zero-height sentinel marks where the element sits in the flow, shifted
 * by the offset, and leaves the visible area once the element sticks. In a
 * block parent it's a sibling, which stays put while the element sticks; a
 * flex or grid parent would give a sibling a gap or a cell, so there it's a
 * child that moves with the element, which reads as stuck from 1px before
 * the element would stick. Every sentinel and element on the page shares
 * one `IntersectionObserver`. Does nothing on the server or without
 * `IntersectionObserver`.
 *
 * Top-edge elements also join the stack of their scroll container (see
 * `joinStack`): with `offset: "stack"`, the element sticks below the UI
 * Shell `Header` and the sticky elements before it, and the container
 * publishes the total as `--ccs-sticky-offset`.
 *
 * @param {HTMLElement} node
 * @param {import("./sticky.js").StickyOptions} [options]
 * @returns {{ update: (options?: import("./sticky.js").StickyOptions) => void, destroy: () => void }}
 */
export function sticky(node, options = {}) {
  let enabled = options.enabled ?? true;
  let edge = options.edge ?? "top";
  let offset = options.offset;
  let onChange = options.onChange;

  /** @type {HTMLDivElement | null} */
  let sentinel = null;
  let inFlow = false;
  let nodeVisible = false;
  let sentinelVisible = true;
  let stuck = false;
  /** @type {Array<() => void>} */
  let stops = [];
  /** @type {null | ReturnType<typeof joinStack>} */
  let stack = null;
  /**
   * The `top` the stack last set, so it's cleared only while it's ours.
   * @type {string | undefined}
   */
  let stackTop;

  function report() {
    const next = nodeVisible && !sentinelVisible;
    if (next === stuck) return;
    stuck = next;
    onChange?.(stuck);
  }

  function place() {
    if (!sentinel) return;
    const computed = getComputedStyle(node)[edge];
    const length =
      offset === undefined || offset === "stack"
        ? computed === "auto"
          ? "0px"
          : computed
        : toCssLength(offset);
    // A sibling marks the element's place in the flow: past the edge by
    // the offset once the element has moved to stick. A child moves with
    // the element, so it sits 1px past the edge while the element sticks.
    if (inFlow) {
      sentinel.style.top = edge === "top" ? `calc(-1 * (${length}))` : length;
    } else {
      sentinel.style.top =
        edge === "top"
          ? `calc(-1px - (${length}))`
          : `calc(100% + 1px + (${length}))`;
    }
  }

  /** @param {number} top */
  function handleStackTop(top) {
    stackTop = `${top}px`;
    node.style.top = stackTop;
    place();
  }

  function clearStackTop() {
    if (stackTop !== undefined && node.style.top === stackTop) {
      node.style.removeProperty("top");
    }
    stackTop = undefined;
  }

  function attach() {
    if (!enabled || typeof document === "undefined") return;
    if (edge === "top") {
      stack = joinStack(node, offset === "stack", handleStackTop);
    }
    sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.setAttribute("data-ccs-sticky-sentinel", "");
    sentinel.style.cssText = SENTINEL_STYLE;
    inFlow = isFlowParent(node.parentElement);
    if (inFlow) {
      sentinel.style.position = "relative";
      if (edge === "top") node.before(sentinel);
      else node.after(sentinel);
    } else {
      sentinel.style.position = "absolute";
      sentinel.style.insetInlineStart = "0";
      // First, so the children keep their `:last-child` and counts from the end.
      node.prepend(sentinel);
    }
    place();
    nodeVisible = false;
    sentinelVisible = true;
    stops = [
      observeIntersection(node, (entry) => {
        nodeVisible = entry.isIntersecting;
        report();
      }),
      observeIntersection(sentinel, (entry) => {
        sentinelVisible = entry.isIntersecting;
        report();
      }),
    ];
  }

  /** @param {boolean} notify */
  function detach(notify) {
    for (const stop of stops) stop();
    stops = [];
    stack?.leave();
    stack = null;
    clearStackTop();
    sentinel?.remove();
    sentinel = null;
    nodeVisible = false;
    if (notify) report();
  }

  attach();

  return {
    update(next = {}) {
      const nextEnabled = next.enabled ?? true;
      const nextEdge = next.edge ?? "top";
      onChange = next.onChange;
      offset = next.offset;
      if (offset !== "stack") clearStackTop();
      stack?.update(offset === "stack");
      if (nextEnabled !== enabled || nextEdge !== edge) {
        detach(true);
        enabled = nextEnabled;
        edge = nextEdge;
        attach();
        return;
      }
      // Read the offset once the update that changed it has rendered.
      if (sentinel) Promise.resolve().then(place);
    },
    destroy() {
      detach(false);
    },
  };
}
