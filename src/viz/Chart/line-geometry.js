// @ts-check
// Path geometry for the `Line` mark, kept out of the component so a test can
// count how often it runs.
import { lttb } from "../utils/downsample-lttb.js";
import { pathLine } from "../utils/path-line.js";

/**
 * SVG path `d` for one series. A long series is downsampled to `budget`
 * points first, over an index array so the chart's own rows stay untouched.
 * A non-finite y is a gap.
 *
 * @param {import("./model.js").ChartGroup<any>} group
 * @param {import("./model.js").ChartScales} scales
 * @param {{ curve?: import("../utils/path-line.js").Curve, budget?: number }} [options]
 * @returns {string}
 */
export function buildLinePath(
  group,
  scales,
  { curve = "linear", budget } = {},
) {
  const n = group.xs.length;
  /** @type {ReadonlyArray<number> | null} */
  let picked = null;
  if (budget !== undefined && n > budget) {
    const indexes = Array.from({ length: n }, (_, index) => index);
    picked = lttb(
      indexes,
      budget,
      (index) => group.xs[index],
      (index) => group.ys[index],
    );
  }

  const count = picked ? picked.length : n;
  /** @type {Array<{ x: number, y: number } | null>} */
  const points = new Array(count);
  for (let k = 0; k < count; k++) {
    const index = picked ? picked[k] : k;
    const value = group.ys[index];
    points[k] = Number.isFinite(value)
      ? { x: scales.x.map(group.xs[index]), y: scales.y.map(value) }
      : null;
  }
  return pathLine(points, { curve, precision: 1 });
}
