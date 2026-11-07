// @ts-check
// Where `position: fixed` measures from, for a box placed in `el`.

/** Properties that, set, make an element the containing block of fixed boxes. */
const CONTAINING_PROPERTIES = [
  "transform",
  "translate",
  "rotate",
  "scale",
  "perspective",
  "filter",
  "backdropFilter",
];

const CONTAINING_CONTAIN = /layout|paint|strict|content/;
const CONTAINING_WILL_CHANGE = /transform|perspective|filter/;
const CONTAINER_SIZE = /size/;

/**
 * Whether `style` makes its element the containing block of `fixed`
 * descendants, which then sit relative to it and not the window.
 *
 * @param {CSSStyleDeclaration} style
 * @returns {boolean}
 */
function containsFixed(style) {
  return (
    CONTAINING_PROPERTIES.some((name) => {
      const value = style[/** @type {"transform"} */ (name)];
      return Boolean(value) && value !== "none";
    }) ||
    CONTAINING_CONTAIN.test(style.contain ?? "") ||
    CONTAINING_WILL_CHANGE.test(style.willChange ?? "") ||
    CONTAINER_SIZE.test(style.containerType ?? "")
  );
}

/**
 * Whether `el` is in the top layer, which lays out against the window and not
 * its ancestors.
 *
 * @param {Element} el
 * @returns {boolean}
 */
function inTopLayer(el) {
  try {
    return el.matches(":modal, :popover-open, :fullscreen");
  } catch {
    return false;
  }
}

/**
 * How far the origin of `position: fixed` boxes in `el` sits from the
 * window's. A transform, filter or containment on `el` or an ancestor makes it
 * the origin, so a box given window coordinates lands that far off. Zero when
 * nothing does.
 *
 * @param {Element} el
 * @returns {{ x: number, y: number }}
 */
export function fixedBlockOffset(el) {
  /** @type {Element | null} */
  let node = el;
  while (node && node !== document.documentElement) {
    if (containsFixed(getComputedStyle(node))) {
      const box = node.getBoundingClientRect();
      // Fixed boxes sit in the padding box and scroll with its content.
      return {
        x: box.left + node.clientLeft - node.scrollLeft,
        y: box.top + node.clientTop - node.scrollTop,
      };
    }
    if (inTopLayer(node)) break;
    node = node.parentElement;
  }
  return { x: 0, y: 0 };
}
