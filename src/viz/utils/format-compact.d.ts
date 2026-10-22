/**
 * Short number, percent, and duration labels for dense graphics. Every
 * formatter comes from the shared `Intl` cache: none is built per call.
 */

export type FormatOptions = {
  locale?: string;
  /** Maximum fraction digits. @default 1 */
  digits?: number;
};

export type DurationOptions = {
  locale?: string;
  /** How many of the most significant units to show. @default 2 */
  largest?: number;
  /** @default "narrow" */
  style?: "narrow" | "short" | "long";
};

/** A `format` prop: `Intl.NumberFormat` options or a custom function. */
export type NumberFormat =
  | Intl.NumberFormatOptions
  | ((value: number) => string);

/** Compact notation: `10K`, `1.2M`. */
export function formatCompact(value: number, options?: FormatOptions): string;

/**
 * Format a ratio as a percentage: `0.084` becomes `8.4%`. `signed` adds a
 * plus sign to positive values, for deltas.
 */
export function formatPercent(
  ratio: number,
  options?: FormatOptions & { signed?: boolean },
): string;

/**
 * Humanize a millisecond duration using its `largest` most significant
 * units: `4d`, `2h 15m`. Units are localized through `Intl.NumberFormat`.
 */
export function formatDuration(ms: number, options?: DurationOptions): string;

/**
 * Normalize a `format` prop to a function: `Intl.NumberFormat` options, a
 * custom function, or nothing (compact notation).
 */
export function resolveFormat(
  format: NumberFormat | undefined,
  locale?: string,
): (value: number) => string;
