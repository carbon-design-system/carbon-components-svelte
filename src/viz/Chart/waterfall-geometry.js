// @ts-check
// Floating bar geometry for the `ChartWaterfall` mark, kept out of the
// component so a test can count how often it runs.

/**
 * Walk the first visible series as a running total. Each bar floats from
 * the total before it to the total after it. A slot named in `totals` is a
 * subtotal: its bar rises from zero to the running total, and its own value
 * is ignored. A connector joins each bar's end to the next bar's start.
 *
 * @param {ReadonlyArray<import("./model.js").ChartGroup<any>>} groups
 * @param {import("./model.js").ChartScales} scales
 * @param {import("./waterfall-geometry.d.ts").WaterfallOptions} [options]
 * @returns {import("./waterfall-geometry.d.ts").Waterfall}
 */
export function buildWaterfall(groups, scales, options = {}) {
  const { totals = [], padding = 0.3, maxBarWidth = 64 } = options;
  const group = groups.find((entry) => !entry.hidden);
  const step = scales.step;
  if (!group || !step) return { bars: [], connectors: [], extent: null };

  const width = Math.max(1, Math.min(maxBarWidth, step * (1 - padding)));
  const [valueStart, valueEnd] = scales.horizontal
    ? [scales.plot.x0, scales.plot.x1]
    : [scales.plot.y0, scales.plot.y1];
  const subtotal = new Set(totals.map(String));

  /** @type {import("./waterfall-geometry.d.ts").WaterfallBar[]} */
  const bars = [];
  /** @type {import("./waterfall-geometry.d.ts").WaterfallConnector[]} */
  const connectors = [];
  let running = 0;
  let low = 0;
  let high = 0;
  for (let j = 0; j < group.xs.length; j++) {
    const slot = group.xs[j];
    if (!Number.isFinite(slot)) continue;
    const isTotal = subtotal.has(scales.categories[slot] ?? "");
    const value = group.ys[j];
    if (!isTotal && !Number.isFinite(value)) continue;

    const from = isTotal ? 0 : running;
    const to = isTotal ? running : running + value;
    if (!isTotal) running = to;
    low = Math.min(low, from, to);
    high = Math.max(high, from, to);

    const center = scales.x.map(slot);
    const a = Math.min(valueEnd, Math.max(valueStart, scales.y.map(from)));
    const b = Math.min(valueEnd, Math.max(valueStart, scales.y.map(to)));
    const start = Math.min(a, b);
    const length = Math.max(1, Math.abs(b - a));
    const along = center - width / 2;
    bars.push({
      key: `${group.key}:${j}`,
      series: group.key,
      index: j,
      slot,
      kind: isTotal ? "total" : value < 0 ? "decrease" : "increase",
      from,
      to,
      value: isTotal ? to : value,
      x: scales.horizontal ? start : along,
      y: scales.horizontal ? along : start,
      width: scales.horizontal ? length : width,
      height: scales.horizontal ? width : length,
    });

    const previous = bars[bars.length - 2];
    if (previous) {
      // From the end of the last bar to the start of this one, at the level
      // the total sat at between them, which a subtotal bar rises up to.
      const level = scales.y.map(isTotal ? to : from);
      const fromEdge = scales.horizontal
        ? previous.y + previous.height
        : previous.x + previous.width;
      const toEdge = scales.horizontal ? bars[bars.length - 1].y : along;
      connectors.push(
        scales.horizontal
          ? { key: `c:${j}`, x1: level, y1: fromEdge, x2: level, y2: toEdge }
          : { key: `c:${j}`, x1: fromEdge, y1: level, x2: toEdge, y2: level },
      );
    }
  }
  return { bars, connectors, extent: bars.length > 0 ? [low, high] : null };
}
