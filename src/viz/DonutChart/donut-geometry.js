// @ts-check
// Slice geometry for `DonutChart`, kept out of the component so a test can
// count how often it runs.

import { pathArc, pieAngles } from "../utils/path-arc.js";
import { getShares } from "../utils/shares.js";
import { categoricalColors, vizColor } from "../utils/tokens.js";

/**
 * Sum `rows` by category, fold the tail, and lay the result out as slices,
 * clockwise from 12 o'clock. Categories keep first-seen order unless `sort`
 * is set, which puts the largest first so the fold takes the smallest.
 *
 * @template T
 * @param {ReadonlyArray<T>} rows
 * @param {import("./donut-geometry.d.ts").DonutOptions<T>} options
 * @returns {import("./donut-geometry.d.ts").Donut<T>}
 */
export function buildDonut(rows, options) {
  const {
    value,
    category,
    maxSlices,
    otherLabel,
    sort = true,
    diameter,
    innerRadius = 0.6,
    palette = 1,
    colors = {},
  } = options;

  /** @type {Map<string, { id: string; label: string; value: number; rows: T[] }>} */
  const byCategory = new Map();
  for (let i = 0; i < rows.length; i++) {
    const id = String(category(rows[i], i));
    const amount = Number(value(rows[i], i));
    let entry = byCategory.get(id);
    if (!entry) {
      entry = { id, label: id, value: 0, rows: [] };
      byCategory.set(id, entry);
    }
    entry.rows.push(rows[i]);
    if (Number.isFinite(amount) && amount > 0) entry.value += amount;
  }
  const items = [...byCategory.values()];
  if (sort) items.sort((a, b) => b.value - a.value);

  const shares = getShares(items, { maxSegments: maxSlices, otherLabel });
  const outerRadius = diameter / 2;
  const inner = Math.min(Math.max(innerRadius, 0), 0.95) * outerRadius;
  const drawn = shares.segments.filter((segment) => segment.value > 0).length;
  const padAngle = drawn > 1 ? 1.5 / outerRadius : 0;
  const angles = pieAngles(
    shares.segments.map((segment) => segment.value),
    { padAngle },
  );
  const assigned = categoricalColors(
    shares.segments.filter((segment) => segment.items === null).length,
    palette,
  );

  return {
    total: shares.total,
    slices: shares.segments.map((segment, i) => {
      const folded = segment.items !== null;
      const id = String(segment.item.id);
      return {
        id,
        label: segment.item.label,
        value: segment.value,
        share: segment.share,
        other: folded,
        rows: folded
          ? /** @type {typeof items} */ (segment.items ?? []).flatMap(
              (item) => item.rows,
            )
          : (byCategory.get(id)?.rows ?? []),
        color: folded
          ? "var(--cds-viz-neutral)"
          : colors[id] === undefined
            ? assigned[i]
            : (vizColor(colors[id]) ?? assigned[i]),
        d:
          segment.value > 0
            ? pathArc({
                cx: outerRadius,
                cy: outerRadius,
                innerRadius: inner,
                outerRadius,
                startAngle: angles[i].startAngle,
                endAngle: angles[i].endAngle,
                padAngle,
              })
            : "",
      };
    }),
  };
}
