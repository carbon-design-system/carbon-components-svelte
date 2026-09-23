// @ts-check
// Violin geometry for the `ChartViolins` mark, kept out of the component
// so a test can count how often it runs.

import { kernelDensity } from "../utils/density.js";

/**
 * One violin per entry whose category is on the x scale: the density of
 * its values mirrored about the category's center, every violin scaled
 * to the same peak width, with the quartiles and median marked.
 *
 * @param {ReadonlyArray<import("./violin-geometry.d.ts").ViolinInput>} violins
 * @param {import("./model.js").ChartScales} scales
 * @param {{ padding?: number; maxWidth?: number; bandwidth?: number; points?: number }} [options]
 * @returns {import("./violin-geometry.d.ts").ViolinShape[]}
 */
export function buildViolins(violins, scales, options = {}) {
  const { padding = 0.2, maxWidth = 96, bandwidth, points = 48 } = options;
  const step = scales.step;
  if (!step) return [];
  const width = Math.max(8, Math.min(maxWidth, step * (1 - padding)));
  const half = width / 2;
  const flipped = scales.horizontal;

  /** @type {import("./violin-geometry.d.ts").ViolinShape[]} */
  const shapes = [];
  for (const violin of violins) {
    const slot = scales.categories.indexOf(String(violin.x));
    if (slot < 0) continue;
    const center = scales.x.map(slot);
    const density = kernelDensity(violin.values, { bandwidth, points });
    if (density.count === 0 || density.peak === 0) continue;
    const q1 = scales.y.map(violin.q1);
    const median = scales.y.map(violin.median);
    const q3 = scales.y.map(violin.q3);
    if (![center, q1, median, q3].every(Number.isFinite)) continue;

    // The outline runs up one side and back down the other. `along` is the
    // value axis position, `across` the half width at that value.
    const side = density.points.map((point) => ({
      along: scales.y.map(point.x),
      across: (point.y / density.peak) * half,
    }));
    const at = (/** @type {number} */ along, /** @type {number} */ across) =>
      flipped
        ? `${r(along)},${r(center + across)}`
        : `${r(center + across)},${r(along)}`;
    let d = `M${at(side[0].along, side[0].across)}`;
    for (let i = 1; i < side.length; i++)
      d += `L${at(side[i].along, side[i].across)}`;
    for (let i = side.length - 1; i >= 0; i--)
      d += `L${at(side[i].along, -side[i].across)}`;
    d += "Z";

    const start = scales.y.map(density.points[0].x);
    const end = scales.y.map(density.points[density.points.length - 1].x);
    shapes.push({
      key: String(violin.x),
      slot,
      center,
      width,
      d,
      q1,
      median,
      q3,
      start,
      end,
      count: density.count,
      bandwidth: density.bandwidth,
    });
  }
  return shapes;
}

/** @param {number} value */
function r(value) {
  return Math.round(value * 100) / 100;
}
