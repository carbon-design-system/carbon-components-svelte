/**
 * CSV export of a chart's series, in the same long format the chart reads.
 */
import type { ChartGroup, ChartXKind } from "../Chart/model.js";

export type CsvOptions = {
  /** How `xs` should be read. @default "linear" */
  kind?: ChartXKind;
  /** Labels for a categorical x, indexed by `xs`. */
  categories?: ReadonlyArray<string>;
  /** Column names. @default ["x", "series", "y"] */
  header?: readonly [string, string, string];
};

/**
 * CSV text with one row per x and series. Values are unformatted so the file
 * round-trips: dates are ISO 8601, numbers are plain, and a missing value is
 * an empty field. Hidden series are left out, as in the chart.
 */
export function groupsToCsv(
  groups: ReadonlyArray<ChartGroup<unknown>>,
  options?: CsvOptions,
): string;
