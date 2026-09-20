// @ts-check
// Rectangle geometry for the `Bars` mark, kept out of the component so a
// test can count how often it runs.

/** @typedef {import("./bar-geometry.d.ts").BarRect} BarRect */
/** @typedef {import("./bar-geometry.d.ts").BarOptions} BarOptions */

/**
 * One rectangle per visible datum. Bars grow from the zero line, clamped to
 * the plot, so a negative value hangs below it.
 *
 * - `"grouped"`: series sit side by side inside the slot.
 * - `"stacked"`: series pile up, positives above zero and negatives below.
 * - `"normalized"`: each slot's positive values are scaled to sum to 1.
 *
 * @param {ReadonlyArray<import("./model.js").ChartGroup<any>>} groups
 * @param {import("./model.js").ChartScales} scales
 * @param {BarOptions} [options]
 * @returns {BarRect[]}
 */
export function buildBars(groups, scales, options = {}) {
  const {
    mode = "grouped",
    padding = 0.2,
    groupPadding = 0.1,
    maxBarWidth = 48,
  } = options;
  const step = scales.step;
  const visible = groups.filter((group) => !group.hidden);
  if (!step || visible.length === 0) return [];

  const slot = step * (1 - padding);
  const stacked = mode !== "grouped";
  const lanes = stacked ? 1 : visible.length;
  const lane = slot / lanes;
  const width = Math.max(
    1,
    Math.min(maxBarWidth, lane * (stacked ? 1 : 1 - groupPadding)),
  );
  const zero = Math.min(
    scales.plot.y1,
    Math.max(scales.plot.y0, scales.y.map(0)),
  );

  /** @type {Map<number, number>} */
  const totals = new Map();
  if (mode === "normalized") {
    for (const group of visible) {
      for (let j = 0; j < group.xs.length; j++) {
        const value = group.ys[j];
        if (!(value > 0)) continue;
        totals.set(group.xs[j], (totals.get(group.xs[j]) ?? 0) + value);
      }
    }
  }

  /** @type {Map<number, number>} */
  const above = new Map();
  /** @type {Map<number, number>} */
  const below = new Map();
  /** @type {BarRect[]} */
  const rects = [];

  visible.forEach((group, laneIndex) => {
    for (let j = 0; j < group.xs.length; j++) {
      const index = group.xs[j];
      let value = group.ys[j];
      if (!Number.isFinite(index) || !Number.isFinite(value)) continue;

      let from = 0;
      if (mode === "normalized") {
        const total = totals.get(index) ?? 0;
        value = value > 0 && total > 0 ? value / total : 0;
      }
      if (stacked) {
        const pile = value < 0 ? below : above;
        from = pile.get(index) ?? 0;
        pile.set(index, from + value);
      }

      const y0 = stacked ? scales.y.map(from) : zero;
      const y1 = scales.y.map(from + value);
      const center = scales.x.map(index);
      const left = stacked
        ? center - width / 2
        : center - slot / 2 + lane * laneIndex + (lane - width) / 2;

      rects.push({
        key: `${group.key}:${j}`,
        series: group.key,
        index: j,
        slot: index,
        x: left,
        y: Math.min(y0, y1),
        width,
        height: Math.abs(y1 - y0),
        color: group.color,
        value: group.ys[j],
      });
    }
  });
  return rects;
}

/**
 * The largest positive and negative pile across slots, which a stacked mark
 * asks the chart to keep inside the y domain.
 *
 * @param {ReadonlyArray<import("./model.js").ChartGroup<any>>} groups
 * @returns {[number, number]}
 */
export function stackedExtent(groups) {
  /** @type {Map<number, number>} */
  const above = new Map();
  /** @type {Map<number, number>} */
  const below = new Map();
  for (const group of groups) {
    if (group.hidden) continue;
    for (let j = 0; j < group.xs.length; j++) {
      const value = group.ys[j];
      if (!Number.isFinite(value)) continue;
      const pile = value < 0 ? below : above;
      pile.set(group.xs[j], (pile.get(group.xs[j]) ?? 0) + value);
    }
  }
  let min = 0;
  let max = 0;
  for (const value of below.values()) min = Math.min(min, value);
  for (const value of above.values()) max = Math.max(max, value);
  return [min, max];
}
