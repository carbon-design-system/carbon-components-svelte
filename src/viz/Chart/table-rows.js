// @ts-check
// Rows for a chart's data table: one row per x, one column per series.

/**
 * Pivot the visible series into rows keyed by x, in ascending x order. A
 * series with no value at an x leaves that cell `undefined`.
 *
 * @param {ReadonlyArray<import("./model.js").ChartGroup<any>>} groups
 * @returns {{ series: Array<string | number>, rows: Array<{ x: number, values: Array<number | undefined> }> }}
 */
export function buildTableRows(groups) {
  const visible = groups.filter((group) => !group.hidden);
  /** @type {Map<number, Array<number | undefined>>} */
  const byX = new Map();
  visible.forEach((group, column) => {
    for (let i = 0; i < group.xs.length; i++) {
      const x = group.xs[i];
      if (!Number.isFinite(x)) continue;
      let values = byX.get(x);
      if (!values) {
        values = new Array(visible.length).fill(undefined);
        byX.set(x, values);
      }
      values[column] = group.ys[i];
    }
  });
  return {
    series: visible.map((group) => group.key),
    rows: [...byX.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([x, values]) => ({ x, values })),
  };
}
