/**
 * Sort registered items by their DOM position. Children of a group register
 * in mount order, which differs from DOM order when they are conditionally
 * rendered. Sorting by `compareDocumentPosition` at registration time keeps
 * the registry tracking the rendered layout instead of mount order.
 */
export function sortByDomOrder<T extends { node?: HTMLElement | null }>(
  list: readonly T[],
): T[];

/**
 * Add `item` to a list that is already in DOM order. Children usually
 * register in DOM order, so the common case is a single comparison against
 * the last item and an append, instead of re-sorting the whole list for every
 * registration (quadratic when n children register in one pass). Only an item
 * that precedes the last one falls back to a full sort.
 */
export function insertByDomOrder<T extends { node?: HTMLElement | null }>(
  list: readonly T[],
  item: T,
): T[];
