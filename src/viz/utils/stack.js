// @ts-check
// Stack long-format rows into layers: long in, long out.

/** @typedef {import("./stack.d.ts").StackOffset} StackOffset */

/**
 * Compute `[y0, y1]` for each row by stacking series at the same `x`. Rows
 * come back in input order, each wrapping its original `datum`. Dates are
 * matched by time, not identity. A missing `(x, series)` cell simply adds
 * nothing to that column.
 *
 * - `"none"`: stack up from zero.
 * - `"diverging"`: positives stack up from zero, negatives stack down.
 * - `"normalize"`: each `x` sums to 1. Shares have no meaning for negative
 *   values, so they count as zero. An all-zero column stays at zero.
 * - `"stream"`: each column is centered on zero.
 *
 * @template T
 * @template K
 * @template S
 * @param {ReadonlyArray<T>} rows
 * @param {import("./stack.d.ts").StackOptions<T, K, S>} options
 * @returns {Array<import("./stack.d.ts").StackedRow<T, K, S>>}
 */
export function stack(rows, { x, y, series, offset = "none", order }) {
  const n = rows.length;
  /** @type {Array<import("./stack.d.ts").StackedRow<T, K, S>>} */
  const out = new Array(n);
  /** @type {Map<unknown, number[]>} */
  const columns = new Map();
  /** @type {Map<S, number>} */
  const rank = new Map();
  if (order) {
    for (let i = 0; i < order.length; i++) rank.set(order[i], i);
  }

  for (let i = 0; i < n; i++) {
    const row = rows[i];
    const xValue = x(row, i);
    const seriesValue = series(row, i);
    const value = Number(y(row, i));
    out[i] = {
      datum: row,
      series: seriesValue,
      x: xValue,
      value: Number.isFinite(value) ? value : 0,
      y0: 0,
      y1: 0,
    };
    if (!rank.has(seriesValue)) rank.set(seriesValue, rank.size);

    const key = xValue instanceof Date ? xValue.getTime() : xValue;
    const column = columns.get(key);
    if (column) column.push(i);
    else columns.set(key, [i]);
  }

  for (const column of columns.values()) {
    column.sort(
      (a, b) =>
        /** @type {number} */ (rank.get(out[a].series)) -
          /** @type {number} */ (rank.get(out[b].series)) || a - b,
    );

    let positive = 0;
    let negative = 0;
    for (const i of column) {
      const entry = out[i];
      if (offset === "normalize" && entry.value < 0) {
        entry.y0 = positive;
        entry.y1 = positive;
      } else if (offset === "diverging" && entry.value < 0) {
        entry.y0 = negative;
        negative += entry.value;
        entry.y1 = negative;
      } else {
        entry.y0 = positive;
        positive += entry.value;
        entry.y1 = positive;
      }
    }

    if (offset === "normalize" && positive !== 0) {
      for (const i of column) {
        out[i].y0 /= positive;
        out[i].y1 /= positive;
      }
    } else if (offset === "stream") {
      const shift = positive / 2;
      for (const i of column) {
        out[i].y0 -= shift;
        out[i].y1 -= shift;
      }
    }
  }
  return out;
}
