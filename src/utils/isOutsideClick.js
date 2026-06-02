// @ts-check

/**
 * True when `event.target` is outside every element in `elements`.
 * Skips falsy entries. Pass `portalMenu && listRef` inline.
 * Returns false when `event.target` is not a Node.
 *
 * @param {Event} event
 * @param {Element | null | undefined | false | Array<Element | null | undefined | false>} elements
 * @returns {boolean}
 */
export function isOutsideClick(event, elements) {
  const { target } = event;
  if (!(target instanceof Node)) return false;
  const list = Array.isArray(elements) ? elements : [elements];
  return list.every((el) => {
    if (!el) return true;
    return !el.contains(target);
  });
}
