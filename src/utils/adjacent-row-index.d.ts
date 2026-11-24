/** An item's box, as `getBoundingClientRect` returns it. */
export type RowRect = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/**
 * Index of the item in the visual row below (`step` 1) or above (`step` -1)
 * whose horizontal center is nearest to the item at `index`. Returns
 * `index` when there is no row in that direction.
 */
export function adjacentRowIndex(
  count: number,
  index: number,
  step: 1 | -1,
  getRect: (index: number) => RowRect,
  skip?: (index: number) => boolean,
): number;
