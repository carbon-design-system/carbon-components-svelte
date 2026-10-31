// Technical indicators over a closing-price series. Each returns an array
// the length of its input, with `null` where the window is not yet full, so
// a chart draws nothing for the warm-up rather than a false value.

/**
 * Simple moving average.
 * @param {ReadonlyArray<number>} values
 * @param {number} period
 * @returns {Array<number | null>}
 */
export function sma(values, period) {
  /** @type {Array<number | null>} */
  const out = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/**
 * Exponential moving average, seeded with the simple average of the first
 * window.
 * @param {ReadonlyArray<number>} values
 * @param {number} period
 * @returns {Array<number | null>}
 */
export function ema(values, period) {
  /** @type {Array<number | null>} */
  const out = new Array(values.length).fill(null);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  let prev = 0;
  for (let i = 0; i < period; i++) prev += values[i];
  prev /= period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/**
 * Bollinger bands: the simple average and `k` standard deviations either
 * side of it.
 * @param {ReadonlyArray<number>} values
 * @param {number} [period]
 * @param {number} [k]
 * @returns {{ middle: Array<number | null>; upper: Array<number | null>; lower: Array<number | null> }}
 */
export function bollinger(values, period = 20, k = 2) {
  const middle = sma(values, period);
  /** @type {Array<number | null>} */
  const upper = new Array(values.length).fill(null);
  /** @type {Array<number | null>} */
  const lower = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    const mean = /** @type {number} */ (middle[i]);
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++)
      variance += (values[j] - mean) ** 2;
    const sd = Math.sqrt(variance / period);
    upper[i] = mean + k * sd;
    lower[i] = mean - k * sd;
  }
  return { middle, upper, lower };
}

/**
 * Relative strength index, with Wilder's smoothing, from 0 to 100.
 * @param {ReadonlyArray<number>} values
 * @param {number} [period]
 * @returns {Array<number | null>}
 */
export function rsi(values, period = 14) {
  /** @type {Array<number | null>} */
  const out = new Array(values.length).fill(null);
  if (values.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change > 0) gain += change;
    else loss -= change;
  }
  gain /= period;
  loss /= period;
  out[period] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    gain = (gain * (period - 1) + Math.max(change, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-change, 0)) / period;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

/**
 * Moving average convergence/divergence: the fast minus the slow EMA, its
 * signal EMA, and the difference between the two as a histogram.
 * @param {ReadonlyArray<number>} values
 * @param {number} [fast]
 * @param {number} [slow]
 * @param {number} [signal]
 * @returns {{ macd: Array<number | null>; signal: Array<number | null>; histogram: Array<number | null> }}
 */
export function macd(values, fast = 12, slow = 26, signal = 9) {
  const quick = ema(values, fast);
  const lazy = ema(values, slow);
  /** @type {Array<number | null>} */
  const line = values.map((_, i) => {
    const a = quick[i];
    const b = lazy[i];
    return a === null || b === null ? null : a - b;
  });
  // The signal starts where the line does.
  const start = line.findIndex((v) => v !== null);
  const tail = start === -1 ? [] : /** @type {number[]} */ (line.slice(start));
  const smoothed = ema(tail, signal);
  /** @type {Array<number | null>} */
  const sig = line.map((_, i) =>
    i < start ? null : (smoothed[i - start] ?? null),
  );
  const histogram = line.map((v, i) => {
    const s = sig[i];
    return v === null || s === null ? null : v - s;
  });
  return { macd: line, signal: sig, histogram };
}
