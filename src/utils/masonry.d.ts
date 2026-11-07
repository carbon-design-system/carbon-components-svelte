/** Snap a length to the 1/64 px step browsers lay out in. */
export function snap(px: number): number;

/**
 * Count the tracks in a resolved `grid-template-columns`. Line names are not
 * tracks. One track when the grid has no template.
 */
export function countTracks(template: string): number;

/**
 * Put each item, in order, in the shortest column, the one nearest the inline
 * start on a tie. An item's top is the shortest column's height when it is
 * placed, and that never decreases, so the tops follow the order of the items.
 */
export function placeMasonry(
  heights: ArrayLike<number>,
  columns: number,
  gap: number,
): { column: number[]; top: number[]; height: number };
