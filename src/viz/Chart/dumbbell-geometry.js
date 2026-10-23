// @ts-check
// Pair geometry for the `ChartDumbbells` mark, kept out of the component so
// a test can count how often it runs.

import { yScaleOf } from "./model.js";

/**
 * One dumbbell per slot: a dot at the `from` series' value, a dot at the
 * `to` series' value, and a bar between them. Without names, the first two
 * visible series are the pair. A slot missing either value draws nothing.
 * `along` values run along the x scale and `across` values along the y
 * scale, so the component can draw either orientation from the same numbers.
 *
 * @param {ReadonlyArray<import("./model.js").ChartGroup<any>>} groups
 * @param {import("./model.js").ChartScales} scales
 * @param {import("./dumbbell-geometry.d.ts").DumbbellOptions} [options]
 * @returns {import("./dumbbell-geometry.d.ts").Dumbbell[]}
 */
export function buildDumbbells(groups, scales, options = {}) {
  const visible = groups.filter((group) => !group.hidden);
  const from =
    options.from === undefined
      ? visible[0]
      : visible.find((group) => group.key === options.from);
  const to =
    options.to === undefined
      ? visible.find((group) => group !== from)
      : visible.find((group) => group.key === options.to);
  if (!from || !to) return [];

  /** @type {Map<number, number>} */
  const toIndex = new Map();
  for (let j = 0; j < to.xs.length; j++) toIndex.set(to.xs[j], j);
  const fromScale = yScaleOf(scales, from);
  const toScale = yScaleOf(scales, to);

  /** @type {import("./dumbbell-geometry.d.ts").Dumbbell[]} */
  const out = [];
  for (let j = 0; j < from.xs.length; j++) {
    const slot = from.xs[j];
    const k = toIndex.get(slot);
    if (k === undefined) continue;
    const a = from.ys[j];
    const b = to.ys[k];
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    const along = scales.x.map(slot);
    const start = fromScale.map(a);
    const end = toScale.map(b);
    if (![along, start, end].every(Number.isFinite)) continue;
    out.push({
      key: `${slot}`,
      slot,
      index: j,
      toIndex: k,
      along,
      start,
      end,
      from: a,
      to: b,
      change: b - a,
      fromColor: from.color,
      toColor: to.color,
    });
  }
  return out;
}
