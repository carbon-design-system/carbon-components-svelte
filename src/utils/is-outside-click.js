// @ts-check

/**
 * True when `event.target` is outside every element in `elements`.
 * Skips falsy entries. Pass `portalMenu && listRef` inline.
 * Returns false when `event.target` is not a Node.
 *
 * Listeners outside a shadow root see `event.target` as the shadow host,
 * not the clicked node. Also check `event.composedPath()` so a click
 * inside a shadow descendant is not treated as outside.
 *
 * @param {Event} event
 * @param {Element | null | undefined | false | Array<Element | null | undefined | false>} elements
 * @returns {boolean}
 */
export function isOutsideClick(event, elements) {
  const { target } = event;
  const path =
    typeof event.composedPath === "function" ? event.composedPath() : [];
  if (!(target instanceof Node) && !path.length) return false;
  const list = Array.isArray(elements) ? elements : [elements];
  return list.every((el) => {
    if (!el) return true;
    if (target instanceof Node && el.contains(target)) return false;
    return !path.some((node) => node instanceof Node && el.contains(node));
  });
}
