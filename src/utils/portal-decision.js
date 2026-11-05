// @ts-check
// Whether an overlay can stay where it renders, and where it goes when it
// can't: the box that would cut it off, the top layer it must join, and the
// edges it has to stay inside.

/**
 * @typedef {{ left: number, top: number, right: number, bottom: number }} Edges
 */

/**
 * The edges of the area `box` clips its content to: its padding box, inside
 * the borders and scrollbars.
 * @param {Element} box
 * @returns {Edges}
 */
export function clipEdges(box) {
  const outer = box.getBoundingClientRect();
  const left = outer.left + box.clientLeft;
  const top = outer.top + box.clientTop;
  return {
    left,
    top,
    right: left + box.clientWidth,
    bottom: top + box.clientHeight,
  };
}

/**
 * Whether `style` clips what overflows it, and on which axes. `overflow`
 * other than `visible` clips its axis. Paint containment (`contain: paint`,
 * `content` and `strict` imply it) and `content-visibility: auto` or
 * `hidden` clip to the padding box on both.
 * @param {CSSStyleDeclaration} style
 * @returns {{ x: boolean, y: boolean }}
 */
export function clipAxes(style) {
  const paints =
    Boolean(style.contain?.includes("paint")) ||
    Boolean(style.contain === "content" || style.contain === "strict") ||
    (style.contentVisibility ?? "visible") !== "visible";
  return {
    x: paints || style.overflowX !== "visible",
    y: paints || style.overflowY !== "visible",
  };
}

/**
 * The first box that cuts `el` off: an ancestor that clips on an axis where
 * `el` reaches past its edge (see `clipAxes`). Only boxes that position `el`
 * count: an absolutely positioned `el` escapes the boxes inside its
 * positioning parent, and a fixed one escapes them all. `null` when nothing
 * clips it, or when `el` has no layout (zero size).
 * @param {HTMLElement} el
 * @returns {HTMLElement | null}
 */
export function clippedBy(el) {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  const position = getComputedStyle(el).position;
  if (position === "fixed") return null;
  const anchor = position === "absolute" ? el.offsetParent : null;
  for (
    let box = el.parentElement;
    box && box !== document.body && box !== document.documentElement;
    box = box.parentElement
  ) {
    if (anchor && !box.contains(anchor)) continue;
    const axes = clipAxes(getComputedStyle(box));
    if (!axes.x && !axes.y) continue;
    const clip = clipEdges(box);
    // 1px of slack absorbs subpixel rounding at the edges.
    if (axes.x && (rect.left < clip.left - 1 || rect.right > clip.right + 1)) {
      return box;
    }
    if (axes.y && (rect.top < clip.top - 1 || rect.bottom > clip.bottom + 1)) {
      return box;
    }
  }
  return null;
}

/**
 * The nearest ancestor of `anchor` that an overlay has to render inside to
 * stay visible and on top: a `<dialog>` or `[popover]`, which sit in the top
 * layer and paint over anything portalled to `<body>`, or the fullscreen
 * element, where only its own subtree renders. The page's root and `<body>`
 * are not returned, as `<body>` renders in both. Without `:fullscreen`
 * support (jsdom) only a dialog or popover counts.
 * @param {Element | null | undefined} anchor
 * @returns {HTMLElement | null}
 */
export function portalRoot(anchor) {
  if (typeof document === "undefined" || !anchor) return null;
  /** @type {Element | null} */
  let root = null;
  try {
    root = anchor.closest("dialog,[popover],:fullscreen");
  } catch {
    root = anchor.closest("dialog,[popover]");
  }
  if (
    !(root instanceof HTMLElement) ||
    root === document.body ||
    root === document.documentElement
  ) {
    return null;
  }
  return root;
}

/**
 * The edges the nearest box that clips `node` leaves it on an axis, within
 * the window: where an in-place overlay has room, such as a table's scroll
 * container. Without such a box, the window.
 * @param {Element} node
 * @param {"x" | "y" | "both"} [axis]
 * @returns {Edges}
 */
export function clippingBoundary(node, axis = "both") {
  const edges = {
    left: 0,
    top: 0,
    right: document.documentElement.clientWidth,
    bottom: document.documentElement.clientHeight,
  };
  for (let el = node.parentElement; el; el = el.parentElement) {
    const style = getComputedStyle(el);
    const x = style.overflowX !== "visible";
    const y = style.overflowY !== "visible";
    if ((axis !== "y" && x) || (axis !== "x" && y)) {
      const clip = clipEdges(el);
      if (axis !== "y" && x) {
        edges.left = Math.max(edges.left, clip.left);
        edges.right = Math.min(edges.right, clip.right);
      }
      if (axis !== "x" && y) {
        edges.top = Math.max(edges.top, clip.top);
        edges.bottom = Math.min(edges.bottom, clip.bottom);
      }
      break;
    }
  }
  return edges;
}

const FIXED_BLOCK_WILL_CHANGE = /transform|perspective|filter/;
const FIXED_BLOCK_CONTAIN = /layout|paint|strict|content/;
const FIXED_BLOCK_CONTAINER = /size|inline-size/;

/**
 * Whether an offset parent can be the containing block of a `position: fixed`
 * box. A transform, a filter, perspective, `will-change` of one of them, or
 * layout or paint containment makes it one, so `left` and `top` start from
 * its edge, not the window's.
 * @param {Element} el
 * @returns {boolean}
 */
function makesFixedBlock(el) {
  const style = getComputedStyle(el);
  return (
    (style.transform && style.transform !== "none") ||
    (style.perspective && style.perspective !== "none") ||
    (style.filter && style.filter !== "none") ||
    FIXED_BLOCK_WILL_CHANGE.test(style.willChange) ||
    FIXED_BLOCK_CONTAIN.test(style.contain) ||
    FIXED_BLOCK_CONTAINER.test(style.containerType ?? "")
  );
}

const TOP_LAYER = [":modal", ":popover-open", ":fullscreen"];

/**
 * Whether `el` is a modal dialog, an open popover or the fullscreen element, which the
 * browser places in the top layer. A browser that doesn't know the selectors has
 * neither.
 * @param {Element} el
 * @returns {boolean}
 */
function inTopLayer(el) {
  return TOP_LAYER.some((selector) => {
    try {
      return el.matches(selector);
    } catch {
      return false;
    }
  });
}

/**
 * Whether a `position: fixed` box under `el` is placed from `el`'s own edge
 * instead of the window's: some ancestor is a containing block for fixed
 * descendants (a transform, a filter, containment). A box in the top layer
 * is not: it is placed from the window.
 * @param {Element} el
 * @returns {boolean}
 */
export function hasFixedBlock(el) {
  /** @type {Element | null} */
  let node = el;
  while (node) {
    if (inTopLayer(node)) return false;
    if (makesFixedBlock(node)) return true;
    node = node.parentElement;
  }
  return false;
}

/**
 * Correct a position computed in window coordinates for a box that is placed
 * from a containing block that isn't the window (a transformed or zoomed
 * ancestor): put the box at `x` and `y`, measure where it landed, and return
 * the difference to subtract. Reads layout, so call it only when
 * `hasFixedBlock` says the offset exists.
 * @param {HTMLElement} el A `position: fixed` box.
 * @param {number} x
 * @param {number} y
 * @returns {{ x: number, y: number }}
 */
export function fixedBlockOffset(el, x, y) {
  const left = el.style.left;
  const top = el.style.top;
  const transform = el.style.transform;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.transform = "none";
  const rect = el.getBoundingClientRect();
  el.style.left = left;
  el.style.top = top;
  el.style.transform = transform;
  return { x: rect.left - x, y: rect.top - y };
}
