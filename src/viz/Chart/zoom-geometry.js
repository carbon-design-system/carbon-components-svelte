// @ts-check
// Math for the zoom bar, kept out of the component so it can be tested
// without a pointer.

import { pathArea } from "../utils/path-area.js";

/**
 * Keep a window inside `full`, at least `minSpan` wide, and in order. Moving
 * one edge past the other pushes that other edge along rather than crossing.
 *
 * @param {number} start
 * @param {number} end
 * @param {readonly [number, number]} full
 * @param {number} minSpan
 * @param {"start" | "end" | "both"} [moving] Which edge the user is moving.
 * @returns {[number, number]}
 */
export function clampWindow(start, end, full, minSpan, moving = "both") {
  const span = full[1] - full[0];
  const least = Math.min(Math.max(minSpan, 0), span);
  let a = start;
  let b = end;
  if (moving === "both") {
    // Panning keeps the width and stops at either end.
    const width = Math.min(Math.max(b - a, least), span);
    a = Math.min(Math.max(a, full[0]), full[1] - width);
    return [a, a + width];
  }
  if (moving === "start") {
    a = Math.min(Math.max(a, full[0]), full[1] - least);
    b = Math.max(b, a + least);
  } else {
    b = Math.max(Math.min(b, full[1]), full[0] + least);
    a = Math.min(a, b - least);
  }
  return [Math.max(a, full[0]), Math.min(b, full[1])];
}

/**
 * Area path of the total y at each x over the visible series: the shape of
 * the whole dataset, drawn small. Thinned to about one point per pixel.
 *
 * @param {ReadonlyArray<import("./model.js").ChartGroup<any>>} groups
 * @param {readonly [number, number]} full The x range with no zoom applied.
 * @param {{ x0: number; x1: number; height: number }} box
 * @returns {string}
 */
export function overviewPath(groups, full, box) {
  /** @type {Map<number, number>} */
  const totals = new Map();
  for (const group of groups) {
    if (group.hidden) continue;
    for (let j = 0; j < group.xs.length; j++) {
      const value = group.ys[j];
      if (!Number.isFinite(value) || !Number.isFinite(group.xs[j])) continue;
      totals.set(
        group.xs[j],
        (totals.get(group.xs[j]) ?? 0) + Math.max(value, 0),
      );
    }
  }
  const xs = [...totals.keys()].sort((a, b) => a - b);
  const span = full[1] - full[0];
  if (xs.length < 2 || !(span > 0)) return "";

  let max = 0;
  let min = Number.POSITIVE_INFINITY;
  for (const total of totals.values()) {
    max = Math.max(max, total);
    min = Math.min(min, total);
  }
  if (!(max > 0)) return "";
  // The bar shows shape, not amounts, so it spends its height on the part of
  // the range the data moves in, with a quarter of that kept under the low.
  const floor = Math.max(0, min - (max - min) * 0.25);
  const range = max - floor || max;

  const width = box.x1 - box.x0;
  const every = Math.max(1, Math.ceil(xs.length / Math.max(width, 1)));
  /** @type {Array<{ x: number; y: number }>} */
  const points = [];
  for (let i = 0; i < xs.length; i += every) {
    const total = totals.get(xs[i]) ?? 0;
    points.push({
      x: box.x0 + ((xs[i] - full[0]) / span) * width,
      y: box.height - ((total - floor) / range) * (box.height - 2),
    });
  }
  return pathArea(points, box.height, { precision: 1 });
}
