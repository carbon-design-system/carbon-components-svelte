// @ts-check
// Path geometry for the `Line` mark, kept out of the component so a test can
// count how often it runs.
import { lttb } from "../utils/downsample-lttb.js";
import { pathLine } from "../utils/path-line.js";

import { yScaleOf } from "./model.js";

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
    if (!Number.isFinite(value)) {
      points[k] = null;
      continue;
    }
    const along = scales.x.map(group.xs[index]);
    const across = yScaleOf(scales, group).map(value);
    points[k] = scales.horizontal
      ? { x: across, y: along }
      : { x: along, y: across };
  }
  // The monotone curve assumes pixel x only increases, which a horizontal
  // chart breaks.
  return pathLine(points, {
    curve: scales.horizontal ? "linear" : curve,
    precision: 1,
  });
}

/**
 * The series on either side of `at`, for a line that turns projected there.
 * The datum at `at` belongs to both halves, so the two paths meet, and a
 * series that never reaches `at` is all before it. Rows are sliced, never
 * copied one by one, and a half with fewer than two points is `null`.
 *
 * @template T
 * @param {import("./model.js").ChartGroup<T>} group
 * @param {number} at
 * @returns {{ before: import("./model.js").ChartGroup<T> | null, after: import("./model.js").ChartGroup<T> | null }}
 */
export function splitAt(group, at) {
  const n = group.xs.length;
  // First index at or past `at`, assuming ascending x as the chart keeps it.
  let cut = 0;
  while (cut < n && group.xs[cut] < at) cut++;
  const touches = cut < n && group.xs[cut] === at;
  const beforeEnd = touches ? cut + 1 : cut;
  const before = beforeEnd >= 2 ? slice(group, 0, beforeEnd) : null;
  const after = n - cut >= 2 ? slice(group, cut, n) : null;
  return { before, after };
}

/**
 * @template T
 * @param {import("./model.js").ChartGroup<T>} group
 * @param {number} from
 * @param {number} to
 * @returns {import("./model.js").ChartGroup<T>}
 */
function slice(group, from, to) {
  return {
    ...group,
    rows: group.rows.slice(from, to),
    xs: group.xs.slice(from, to),
    ys: group.ys.slice(from, to),
  };
}
