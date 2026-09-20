// @ts-check

/**
 * Sort registered items by their DOM position. Children of a group register
 * in mount order, which differs from DOM order when they are conditionally
 * rendered. Sorting by `compareDocumentPosition` at registration time keeps
 * the registry tracking the rendered layout instead of mount order.
 *
 * @template {{ node?: HTMLElement | null }} T
 * @param {T[]} list
 * @returns {T[]}
 */
export function sortByDomOrder(list) {
  return [...list].sort((a, b) => {
    if (!a.node || !b.node) return 0;
    const position = a.node.compareDocumentPosition(b.node);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
}
