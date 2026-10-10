// @ts-check
// Rectangle geometry for the `ChartBins` mark, kept out of the component so a
// test can count how often it runs.

/**
 * One rectangle per bin with a positive count, spanning the bin's edges on
 * the x scale and rising from zero on the y scale. Neighbors share an edge,
 * less a one pixel gap, because a histogram's bars touch.
 *
 * @param {ReadonlyArray<import("./model.js").ChartGroup<any>>} groups
 * @param {import("./model.js").ChartScales} scales
 * @param {{ gap?: number }} [options]
 * @returns {import("./bin-geometry.d.ts").BinRect[]}
 */
export function buildBins(groups, scales, { gap = 1 } = {}) {
  const [valueStart, valueEnd] = scales.horizontal
    ? [scales.plot.x0, scales.plot.x1]
    : [scales.plot.y0, scales.plot.y1];
  const zero = Math.min(valueEnd, Math.max(valueStart, scales.y.map(0)));

  /** @type {import("./bin-geometry.d.ts").BinRect[]} */
  const rects = [];
  for (const group of groups) {
    if (group.hidden) continue;
    for (let j = 0; j < group.rows.length; j++) {
      const row = group.rows[j];
      const count = group.ys[j];
      if (!row || !(count > 0)) continue;
      const a = scales.x.map(row.x0);
      const b = scales.x.map(row.x1);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;

      const along = Math.min(a, b);
      const thickness = Math.max(1, Math.abs(b - a) - gap);
      const end = scales.y.map(count);
      const start = Math.min(zero, end);
      const length = Math.abs(end - zero);
      rects.push({
        key: `${group.key}:${j}`,
        series: group.key,
        index: j,
        at: group.xs[j],
        x: scales.horizontal ? start : along,
        y: scales.horizontal ? along : start,
        width: scales.horizontal ? length : thickness,
        height: scales.horizontal ? thickness : length,
        color: group.color,
      });
    }
  }
  return rects;
}
