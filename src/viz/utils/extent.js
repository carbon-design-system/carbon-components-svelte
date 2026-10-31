// @ts-check
// Minimum and maximum of a series in one pass, skipping missing values.

/**
 * `[min, max]` of the finite entries in `values`. Dates count as epoch
 * milliseconds. `null` when nothing is finite.
 *
 * @param {ReadonlyArray<number | Date | null | undefined>} values
 * @returns {[number, number] | null}
 */
export function extent(values) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < values.length; i++) {
    const raw = values[i];
    if (raw === null || raw === undefined) continue;
    const value = +raw;
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return min <= max ? [min, max] : null;
}

/**
 * `extent` over `rows`, reading each value through `accessor`.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {(row: T, index: number) => number | Date | null | undefined} accessor
 * @returns {[number, number] | null}
 */
export function extentBy(rows, accessor) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < rows.length; i++) {
    const raw = accessor(rows[i], i);
    if (raw === null || raw === undefined) continue;
    const value = +raw;
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return min <= max ? [min, max] : null;
}
