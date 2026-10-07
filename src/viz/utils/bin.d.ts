/**
 * Histogram binning.
 */

export type Bin = {
  /** Lower edge, inclusive. */
  x0: number;
  /** Upper edge. Exclusive, except on the last bin. */
  x1: number;
  count: number;
};

export type BinOptions = {
  /** A target bin count, or a rule that derives one. @default "sturges" */
  bins?: number | "sturges" | "freedman-diaconis";
  /** Defaults to the extent of the finite values. */
  domain?: readonly [number, number];
  /** Snap bin edges to round numbers. The bin count may shift. @default true */
  nice?: boolean;
};

/**
 * Count finite `values` into equal-width bins. Every bin is half-open
 * `[x0, x1)` except the last, which also includes its upper edge. Values
 * outside an explicit `domain` are dropped. A single distinct value yields
 * one bin.
 */
export function bin(
  values: ReadonlyArray<number | null | undefined>,
  options?: BinOptions,
): Bin[];
