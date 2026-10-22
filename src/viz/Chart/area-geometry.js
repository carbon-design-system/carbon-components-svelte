// @ts-check
// Layer geometry for the `Area` mark, kept out of the component so a test can
// count how often it runs.

import { pathArea } from "../utils/path-area.js";
import { pathLine } from "../utils/path-line.js";
import { yScaleOf } from "./model.js";

/** @typedef {import("./area-geometry.d.ts").AreaLayer} AreaLayer */
/** @typedef {import("./area-geometry.d.ts").AreaOptions} AreaOptions */

/**
 * Per-x total of the visible series: how tall each stack is. A stacked area
 * has no meaning for a negative value, so those count as zero, as do missing
 * ones.
 *
 * @param {ReadonlyArray<import("./model.js").ChartGroup<any>>} groups
 * @returns {{ xs: number[], above: Map<number, number> }}
 */
function totals(groups) {
  /** @type {Map<number, number>} */
  const above = new Map();
  for (const group of groups) {
    if (group.hidden) continue;
    for (let i = 0; i < group.xs.length; i++) {
      const x = group.xs[i];
      const value = group.ys[i];
      if (!Number.isFinite(x)) continue;
      above.set(
        x,
        (above.get(x) ?? 0) + (Number.isFinite(value) && value > 0 ? value : 0),
      );
    }
  }
  return { xs: [...above.keys()].sort((a, b) => a - b), above };
}

/**
 * The y extent a stacked or stream mark needs the chart to keep in view.
 * `null` for modes that fit inside the data's own extent.
 *
 * @param {ReadonlyArray<import("./model.js").ChartGroup<any>>} groups
 * @param {import("./area-geometry.d.ts").AreaStack} stack
 * @returns {[number, number] | null}
 */
export function areaExtent(groups, stack) {
  if (stack !== "stacked" && stack !== "stream") return null;
  const { above } = totals(groups);
  let max = 0;
  for (const value of above.values()) max = Math.max(max, value);
  return stack === "stream" ? [-max / 2, max / 2] : [0, max];
}

/**
 * One filled layer per visible series, bottom to top, with the line along its
 * upper edge.
 *
 * - `"none"`: every layer rises from the zero line and they overlap. A
 *   missing value is a gap.
 * - `"stacked"`, `"normalized"`, `"stream"`: layers pile up. Stacking needs a
 *   value at every x, so a missing one counts as zero rather than breaking
 *   every layer above it.
 *
 * @param {ReadonlyArray<import("./model.js").ChartGroup<any>>} groups
 * @param {import("./model.js").ChartScales} scales
 * @param {AreaOptions} [options]
 * @returns {AreaLayer[]}
 */
export function buildAreas(groups, scales, options = {}) {
  const { stack = "none", curve = "linear" } = options;
  const visible = groups.filter((group) => !group.hidden);
  if (visible.length === 0) return [];
  const path = { curve, precision: 1 };

  if (stack === "none") {
    return visible.map((group) => {
      // Each layer rises from zero on the axis its series is plotted on.
      const scale = yScaleOf(scales, group);
      const zero = Math.min(
        scales.plot.y1,
        Math.max(scales.plot.y0, scale.map(0)),
      );
      /** @type {Map<number, number>} */
      const tops = new Map();
      const points = group.xs.map((x, i) => {
        const value = group.ys[i];
        if (!Number.isFinite(value)) return null;
        const point = {
          x: scales.x.map(x),
          y: scale.map(value),
        };
        tops.set(x, point.y);
        return point;
      });
      return {
        key: group.key,
        color: group.color,
        area: pathArea(points, zero, path),
        line: pathLine(points, path),
        tops,
      };
    });
  }

  const { xs, above } = totals(visible);
  /** @type {Map<number, number>} */
  const running = new Map();
  for (const x of xs) {
    running.set(x, stack === "stream" ? -(above.get(x) ?? 0) / 2 : 0);
  }

  return visible.map((group) => {
    /** @type {Map<number, number>} */
    const own = new Map();
    for (let i = 0; i < group.xs.length; i++) {
      const value = group.ys[i];
      own.set(group.xs[i], Number.isFinite(value) && value > 0 ? value : 0);
    }

    /** @type {Map<number, number>} */
    const tops = new Map();
    /** @type {Array<{ x: number, y: number }>} */
    const upper = [];
    /** @type {number[]} */
    const lower = [];
    for (const x of xs) {
      let value = own.get(x) ?? 0;
      if (stack === "normalized") {
        const total = above.get(x) ?? 0;
        value = total > 0 ? value / total : 0;
      }
      const from = running.get(x) ?? 0;
      running.set(x, from + value);
      const top = scales.y.map(from + value);
      upper.push({ x: scales.x.map(x), y: top });
      lower.push(scales.y.map(from));
      tops.set(x, top);
    }
    return {
      key: group.key,
      color: group.color,
      area: pathArea(upper, lower, path),
      line: pathLine(upper, path),
      tops,
    };
  });
}
