// @ts-check
// Candle geometry for the `ChartCandles` mark, kept out of the component
// so a test can count how often it runs.

/**
 * One candle per entry whose category is on the x scale: a wick from the
 * low to the high and a body from the open to the close. Positions run
 * along the chart's scales, so the component draws either orientation
 * from the same numbers.
 *
 * @param {ReadonlyArray<import("./candle-geometry.d.ts").CandleInput>} candles
 * @param {import("./model.js").ChartScales} scales
 * @param {{ padding?: number; maxBodyWidth?: number }} [options]
 * @returns {import("./candle-geometry.d.ts").CandleShape[]}
 */
export function buildCandles(candles, scales, options = {}) {
  const { padding = 0.3, maxBodyWidth = 24 } = options;
  const step = scales.step;
  if (!step) return [];
  const width = Math.max(2, Math.min(maxBodyWidth, step * (1 - padding)));

  /** @type {import("./candle-geometry.d.ts").CandleShape[]} */
  const shapes = [];
  for (const candle of candles) {
    const slot = scales.categories.indexOf(String(candle.x));
    if (slot < 0) continue;
    const center = scales.x.map(slot);
    const open = scales.y.map(candle.open);
    const close = scales.y.map(candle.close);
    const low = scales.y.map(candle.low);
    const high = scales.y.map(candle.high);
    if (![center, open, close, low, high].every(Number.isFinite)) continue;
    shapes.push({
      key: String(candle.x),
      slot,
      center,
      width,
      bodyStart: Math.min(open, close),
      // A flat candle still shows a hairline body.
      bodyLength: Math.max(Math.abs(close - open), 1),
      wickLow: low,
      wickHigh: high,
      up: candle.close > candle.open,
      down: candle.close < candle.open,
      change: candle.close - candle.open,
    });
  }
  return shapes;
}
