// @ts-check
// Circle geometry for the `ChartPoints` mark, kept out of the component so a
// test can count how often it runs.

import { yScaleOf } from "./model.js";

/**
 * One circle per visible datum with a finite x and y. With a `size`
 * accessor, the circle's area follows the value between the two radii, since
 * a radius that followed it would overstate large values. Sizes share one
 * extent across every series, hidden ones included, so toggling a series
 * never resizes the rest. Larger circles come first, so smaller ones stay on
 * top of them and reachable.
 *
 * @param {ReadonlyArray<import("./model.js").ChartGroup<any>>} groups
 * @param {import("./model.js").ChartScales} scales
 * @param {import("./point-geometry.d.ts").PointOptions} [options]
 * @returns {import("./point-geometry.d.ts").PointCircle[]}
 */
export function buildPoints(groups, scales, options = {}) {
  const { radius = 4, size, sizeRange = [4, 24] } = options;

  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;
  if (size) {
    for (const group of groups) {
      for (let j = 0; j < group.rows.length; j++) {
        const value = Number(size(group.rows[j], j));
        if (!Number.isFinite(value) || value < 0) continue;
        if (value < low) low = value;
        if (value > high) high = value;
      }
    }
  }
  const [rMin, rMax] = sizeRange;
  const areaMin = rMin * rMin;
  const areaSpan = rMax * rMax - areaMin;

  /** @type {import("./point-geometry.d.ts").PointCircle[]} */
  const circles = [];
  for (const group of groups) {
    if (group.hidden) continue;
    for (let j = 0; j < group.xs.length; j++) {
      const along = scales.x.map(group.xs[j]);
      const across = yScaleOf(scales, group).map(group.ys[j]);
      if (!Number.isFinite(along) || !Number.isFinite(across)) continue;

      let r = radius;
      /** @type {number | null} */
      let sizeValue = null;
      if (size) {
        const value = Number(size(group.rows[j], j));
        if (!Number.isFinite(value) || value < 0) continue;
        sizeValue = value;
        const t = high > low ? (value - low) / (high - low) : 1;
        r = Math.sqrt(areaMin + areaSpan * t);
      }
      circles.push({
        key: `${group.key}:${j}`,
        series: group.key,
        index: j,
        cx: scales.horizontal ? across : along,
        cy: scales.horizontal ? along : across,
        r,
        size: sizeValue,
        color: group.color,
      });
    }
  }
  if (size) circles.sort((a, b) => b.r - a.r);
  return circles;
}

/**
 * Paint circles onto a canvas, one path per color, so a series costs two
 * operations however many points it has. Matches the SVG mark: a light
 * fill and a solid outline in the series color.
 *
 * @param {CanvasRenderingContext2D} context
 * @param {ReadonlyArray<import("./point-geometry.d.ts").PointCircle>} circles
 * @param {(color: string) => string} resolve
 */
export function paintPoints(context, circles, resolve) {
  /** @type {Map<string, import("./point-geometry.d.ts").PointCircle[]>} */
  const byColor = new Map();
  for (const circle of circles) {
    const list = byColor.get(circle.color);
    if (list) list.push(circle);
    else byColor.set(circle.color, [circle]);
  }
  const TAU = Math.PI * 2;
  for (const [color, list] of byColor) {
    const style = resolve(color);
    context.beginPath();
    for (const circle of list) {
      context.moveTo(circle.cx + circle.r, circle.cy);
      context.arc(circle.cx, circle.cy, circle.r, 0, TAU);
    }
    context.globalAlpha = 0.3;
    context.fillStyle = style;
    context.fill();
    context.globalAlpha = 1;
    context.strokeStyle = style;
    context.lineWidth = 1.5;
    context.stroke();
  }
}
