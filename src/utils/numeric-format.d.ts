/**
 * Number input string parsing and clamping.
 */

/** Parse a raw string; `null` for `""`, `"-"`, or NaN. */
export function parse(raw: string, useLocaleNormalize?: boolean): number | null;

/** Parse with explicit group and decimal separators; `null` for empty or NaN. */
export function parseLocaleValue(
  raw: string,
  groupSeparator: string,
  decimalSeparator: string,
): number | null;

/** First step when empty: `stepStartValue`, else `min`, else 0. */
export function getDefaultValue(
  stepStartValue: number | undefined,
  min: number | undefined,
): number;

/** Clamp to `[min, max]`; undefined bounds are ignored. */
export function clamp(
  value: number,
  min: number | undefined,
  max: number | undefined,
): number;

/** Round to the decimal places in `step`. */
export function roundToStep(value: number, step: number): number;
