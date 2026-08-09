/**
 * Order items so each group's items are contiguous, groups appear in
 * first-seen order, and `compare` sorts items within a group. Items without a
 * `group` value share one bucket and render without a header.
 *
 * Grouping is a render-time concern: the returned array is still a flat list of
 * the same item objects, so keyboard navigation, selection, and `selectedIds`
 * operate on it unchanged.
 *
 * @template {{ group?: string }} T
 * @param {ReadonlyArray<T>} items
 * @param {((a: T, b: T) => number)} [compare] - Sorts items within a group.
 * @returns {T[]}
 */
export function groupItems<
  T extends {
    group?: string;
  },
>(items: ReadonlyArray<T>, compare?: (a: T, b: T) => number): T[];
