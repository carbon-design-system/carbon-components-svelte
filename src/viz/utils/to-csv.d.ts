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
  /** Keep to this x range, the zoom window. @default null */
  range?: readonly [number, number] | null;
  /** The field separator: a comma, or a tab for TSV. @default "," */
  delimiter?: string;
};

/**
 * The rows a chart shows, in long format: one per x and series, with x as
 * the file would write it. Hidden series, the ghosts of a prior period, and
 * anything outside `range` are left out.
 */
export function groupsToRows(
  groups: ReadonlyArray<ChartGroup<unknown>>,
  options?: CsvOptions,
): Array<{ x: string | number; series: string | number; y: number | null }>;

/**
 * CSV text with one row per x and series. Values are unformatted so the file
 * round-trips: dates are ISO 8601, numbers are plain, and a missing value is
 * an empty field. Hidden series and the ghosts of a prior period are left
 * out, and `range` keeps to the zoom window, so the file holds what the
 * chart shows. A label that starts like a spreadsheet formula is quoted.
 */
export function groupsToCsv(
  groups: ReadonlyArray<ChartGroup<unknown>>,
  options?: CsvOptions,
): string;
