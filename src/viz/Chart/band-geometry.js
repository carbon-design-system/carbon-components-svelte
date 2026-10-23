// @ts-check
// Geometry for the `Band` mark: the area between a lower and an upper value
// per datum, kept out of the component so a test can count how often it runs.

import { pathArea } from "../utils/path-area.js";
import { yScaleOf } from "./model.js";

/**
 * @template T
 * @param {ReadonlyArray<import("./model.js").ChartGroup<T>>} groups
 * @param {(row: T, index: number) => unknown} lower
 * @param {(row: T, index: number) => unknown} upper
 * @returns {[number, number] | null}
 */
export function bandExtent(groups, lower, upper) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const group of groups) {
    if (group.hidden) continue;
    for (let i = 0; i < group.rows.length; i++) {
      const lo = Number(lower(group.rows[i], i) ?? Number.NaN);
      const hi = Number(upper(group.rows[i], i) ?? Number.NaN);
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) continue;
      if (lo < min) min = lo;
      if (hi > max) max = hi;
    }
  }
  return min <= max ? [min, max] : null;
}

/**
 * One filled path per visible series. A datum missing either bound is a
 * gap. On a horizontal chart the band runs down the plot, drawn as a
 * straight-edged polygon since the curves assume a rising x.
 *
 * @template T
 * @param {ReadonlyArray<import("./model.js").ChartGroup<T>>} groups
 * @param {import("./model.js").ChartScales} scales
 * @param {{ lower: (row: T, index: number) => unknown; upper: (row: T, index: number) => unknown; curve?: import("../utils/path-line.js").Curve }} options
 * @returns {Array<{ key: import("./model.js").ChartSeriesKey; color: string; d: string }>}
 */
export function buildBands(groups, scales, { lower, upper, curve = "linear" }) {
  const out = [];
  for (const group of groups) {
    if (group.hidden) continue;
    const scale = yScaleOf(scales, group);
    /** @type {Array<{ x: number; y: number } | null>} */
    const tops = new Array(group.rows.length);
    /** @type {Array<number | null>} */
    const bottoms = new Array(group.rows.length);
    for (let i = 0; i < group.rows.length; i++) {
      const lo = Number(lower(group.rows[i], i) ?? Number.NaN);
      const hi = Number(upper(group.rows[i], i) ?? Number.NaN);
      const x = group.xs[i];
      if (!Number.isFinite(lo) || !Number.isFinite(hi) || !Number.isFinite(x)) {
        tops[i] = null;
        bottoms[i] = null;
        continue;
      }
      tops[i] = { x: scales.x.map(x), y: scale.map(hi) };
      bottoms[i] = scale.map(lo);
    }
    out.push({
      key: group.key,
      color: group.color,
      d: scales.horizontal
        ? sidePolygon(tops, bottoms)
        : pathArea(tops, bottoms, { curve, precision: 1 }),
    });
  }
  return out;
}

/**
 * The band with its axes swapped: `x` of a point is the along-plot pixel
 * and `y` the across one.
 *
 * @param {ReadonlyArray<{ x: number; y: number } | null>} tops
 * @param {ReadonlyArray<number | null>} bottoms
 */
function sidePolygon(tops, bottoms) {
  /** @type {string[]} */
  const parts = [];
  let start = 0;
  while (start < tops.length) {
    if (tops[start] === null) {
      start++;
      continue;
    }
    let end = start;
    while (end < tops.length && tops[end] !== null) end++;
    if (end - start >= 2) {
      const forward = [];
      const back = [];
      for (let i = start; i < end; i++) {
        const top = /** @type {{ x: number; y: number }} */ (tops[i]);
        forward.push(`${top.y.toFixed(1)},${top.x.toFixed(1)}`);
        back.push(
          `${(/** @type {number} */ (bottoms[i])).toFixed(1)},${top.x.toFixed(1)}`,
        );
      }
      parts.push(`M${forward.join("L")}L${back.reverse().join("L")}Z`);
    }
    start = end;
  }
  return parts.join("");
}
