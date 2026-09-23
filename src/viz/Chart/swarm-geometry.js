// @ts-check
// Swarm geometry for the `ChartSwarm` mark, kept out of the component so
// a test can count how often it runs.

import { beeswarm } from "../utils/beeswarm.js";

/**
 * One dot per value in each entry whose category is on the x scale,
 * spread across the category's slot only as far as needed so none
 * overlap. A swarm wider than its slot is squeezed to fit.
 *
 * @param {ReadonlyArray<import("./swarm-geometry.d.ts").SwarmInput>} swarms
 * @param {import("./model.js").ChartScales} scales
 * @param {{ radius?: number; padding?: number }} [options]
 * @returns {import("./swarm-geometry.d.ts").SwarmShape[]}
 */
export function buildSwarms(swarms, scales, options = {}) {
  const { radius = 3, padding = 0.2 } = options;
  const step = scales.step;
  if (!step) return [];
  const half = Math.max((step * (1 - padding)) / 2, radius);

  /** @type {import("./swarm-geometry.d.ts").SwarmShape[]} */
  const shapes = [];
  for (const swarm of swarms) {
    const slot = scales.categories.indexOf(String(swarm.x));
    if (slot < 0) continue;
    const center = scales.x.map(slot);
    const alongs = swarm.values.map((value) =>
      typeof value === "number" && Number.isFinite(value)
        ? scales.y.map(value)
        : Number.NaN,
    );
    const offsets = beeswarm(alongs, radius);
    let widest = 0;
    for (const offset of offsets) {
      if (Number.isFinite(offset)) widest = Math.max(widest, Math.abs(offset));
    }
    const squeeze = widest + radius > half ? (half - radius) / widest : 1;
    /** @type {import("./swarm-geometry.d.ts").SwarmDot[]} */
    const dots = [];
    alongs.forEach((along, i) => {
      if (!Number.isFinite(along)) return;
      dots.push({
        index: i,
        value: /** @type {number} */ (swarm.values[i]),
        along,
        across: center + offsets[i] * squeeze,
      });
    });
    shapes.push({ key: String(swarm.x), slot, center, radius, dots });
  }
  return shapes;
}
