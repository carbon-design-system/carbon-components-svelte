/**
 * Human-friendly axis ticks on 1, 2, and 5 multiples of a power of ten.
 */

/**
 * Distance between ticks for about `count` ticks across `[min, max]`.
 * `0` for an empty or non-finite span.
 */
export function tickStep(min: number, max: number, count?: number): number;

/**
 * About `count` ascending tick values inside `[min, max]`. Bounds may be
 * given in either order. A zero-width span yields that one value.
 */
export function ticks(min: number, max: number, count?: number): number[];

/**
 * Widen `[min, max]` outward to the nearest tick boundaries. Keeps the input
 * order, so a reversed domain stays reversed.
 */
export function niceDomain(
  min: number,
  max: number,
  count?: number,
): [number, number];
