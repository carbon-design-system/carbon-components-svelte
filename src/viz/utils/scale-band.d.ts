/**
 * Ordinal scales: evenly divide a pixel range among discrete keys.
 */

export type BandScaleOptions<K> = {
  domain: ReadonlyArray<K>;
  range: readonly [number, number];
  /** Gap between bands, as a fraction of `step` in `[0, 1]`. @default 0 */
  paddingInner?: number;
  /** Gap before the first and after the last band, in steps. @default 0 */
  paddingOuter?: number;
  /** Where leftover space goes: `0` start, `0.5` both sides, `1` end. @default 0.5 */
  align?: number;
  /** Snap `step`, `bandwidth`, and the start to whole pixels. @default false */
  round?: boolean;
};

export type PointScaleOptions<K> = {
  domain: ReadonlyArray<K>;
  range: readonly [number, number];
  /** Gap before the first and after the last point, in steps. @default 0 */
  padding?: number;
  align?: number;
  round?: boolean;
};

export type BandScale<K> = {
  /** Unique keys in first-seen order. */
  domain: ReadonlyArray<K>;
  range: readonly [number, number];
  /** Distance between the starts of adjacent bands. */
  step: number;
  /** Width of one band. `0` for a point scale. */
  bandwidth: number;
  /** Start of the band for `key`, or `undefined` for an unknown key. */
  map(key: K): number | undefined;
  /** Key whose band contains `px`, clamped to the ends. */
  invert(px: number): K | undefined;
};

/**
 * Band scale for bars and cells. Lookups go through a prebuilt `Map`, so
 * `map` is O(1). On duplicate keys the first occurrence wins.
 */
export function scaleBand<K>(options: BandScaleOptions<K>): BandScale<K>;

/**
 * Point scale for line and scatter marks on a categorical axis: a band scale
 * with zero bandwidth. A single key sits at the middle of the range.
 */
export function scalePoint<K>(options: PointScaleOptions<K>): BandScale<K>;
