// @ts-check

/**
 * @param {{ node?: HTMLElement | null }} a
 * @param {{ node?: HTMLElement | null }} b
 * @returns {number}
 */
function compareDomOrder(a, b) {
  if (!a.node || !b.node) return 0;
  const position = a.node.compareDocumentPosition(b.node);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}

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
  return [...list].sort(compareDomOrder);
}

/**
 * Add `item` to a list that is already in DOM order. Children usually
 * register in DOM order, so the common case is a single comparison against
 * the last item and an append, instead of re-sorting the whole list for every
 * registration (quadratic when n children register in one pass). Only an item
 * that precedes the last one falls back to a full sort.
 *
 * @template {{ node?: HTMLElement | null }} T
 * @param {T[]} list
 * @param {T} item
 * @returns {T[]}
 */
export function insertByDomOrder(list, item) {
  const last = list[list.length - 1];
  if (last && compareDomOrder(last, item) > 0) {
    return sortByDomOrder([...list, item]);
  }
  return [...list, item];
}
