/**
 * Positions at least `gap` apart in the same order as given, moved as
 * little as possible and kept within `[lo, hi]`.
 */
export function spreadLabels(
  positions: ReadonlyArray<number>,
  gap: number,
  lo: number,
  hi: number,
): number[];
