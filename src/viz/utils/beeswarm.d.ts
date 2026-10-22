/**
 * An offset across the axis per position along it, in pixels, so dots of
 * the given radius never overlap. A non-finite position gets `NaN`.
 */
export function beeswarm(
  positions: ReadonlyArray<number>,
  radius: number,
): number[];
