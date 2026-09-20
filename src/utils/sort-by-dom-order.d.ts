/**
 * Sort registered items by their DOM position. Children of a group register
 * in mount order, which differs from DOM order when they are conditionally
 * rendered. Sorting by `compareDocumentPosition` at registration time keeps
 * the registry tracking the rendered layout instead of mount order.
 */
export function sortByDomOrder<T extends { node?: HTMLElement | null }>(
  list: readonly T[],
): T[];
