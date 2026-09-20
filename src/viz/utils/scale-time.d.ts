/**
 * Time scale: a linear scale over epoch milliseconds.
 */

export type TimeScaleOptions = {
  domain: readonly [Date | number, Date | number];
  range: readonly [number, number];
  clamp?: boolean;
  /** Widen the domain to calendar boundaries. A number is the tick count hint. */
  nice?: boolean | number;
  /** Align `nice` to UTC boundaries instead of local time. @default false */
  utc?: boolean;
};

export type TimeScale = {
  /** Resolved domain as epoch milliseconds. */
  domain: [number, number];
  range: readonly [number, number];
  clamp: boolean;
  utc: boolean;
  map(value: Date | number): number;
  /** Epoch milliseconds at `px`. */
  invert(px: number): number;
};

/**
 * Time scale. `map` accepts a `Date` or epoch milliseconds; `invert` returns
 * milliseconds. `nice` widens the domain to the calendar boundaries its
 * ticks would use.
 */
export function scaleTime(options: TimeScaleOptions): TimeScale;
