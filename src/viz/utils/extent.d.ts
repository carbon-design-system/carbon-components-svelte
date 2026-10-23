/**
 * Minimum and maximum of a series in one pass, skipping missing values.
 */

/**
 * `[min, max]` of the finite entries in `values`. Dates count as epoch
 * milliseconds. `null` when nothing is finite.
 */
export function extent(
  values: ReadonlyArray<number | Date | null | undefined>,
): [number, number] | null;

/** `extent` over `rows`, reading each value through `accessor`. */
export function extentBy<T>(
  rows: ReadonlyArray<T>,
  accessor: (row: T, index: number) => number | Date | null | undefined,
): [number, number] | null;
