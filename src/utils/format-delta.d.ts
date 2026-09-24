/**
 * Signed change formatting, such as the delta `BigNumber` shows under
 * its value.
 */

export type FormatDeltaOptions = {
  locale?: string;
  /** Maximum fraction digits. */
  digits?: number;
  /** Use compact notation, such as `1.2K`. @default false */
  compact?: boolean;
  /**
   * `"literal"` appends `%` to the number as given (`12` is `+12%`).
   * `"ratio"` treats it as a fraction (`0.12` is `+12%`).
   */
  percent?: "literal" | "ratio";
  /**
   * Extra `Intl.NumberFormat` options. Ignored by `percent: "literal"`.
   */
  formatOptions?: Intl.NumberFormatOptions;
  /** Custom formatter. A `+` is still prepended to positive values. */
  format?: (value: number) => string;
};

/**
 * Format a change with an explicit sign on non-zero values: `+1.2K`,
 * `-5%`. `undefined` for a missing or `NaN` value.
 */
export function formatDelta(
  value: number | null | undefined,
  options?: FormatDeltaOptions,
): string | undefined;
