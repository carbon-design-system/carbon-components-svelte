// @ts-check
// Status thresholds shared by gauges, bullets, meters, and chart rules.

/** @typedef {import("./thresholds.d.ts").Threshold} Threshold */
/** @typedef {import("./thresholds.d.ts").ThresholdInput} ThresholdInput */
/** @typedef {import("./thresholds.d.ts").ThresholdCrossing} ThresholdCrossing */

/**
 * Normalize thresholds to an ascending array. Accepts the array form, or the
 * `{ warning, error }` object `Meter` takes.
 *
 * @param {ThresholdInput | null | undefined} thresholds
 * @returns {Threshold[]}
 */
export function normalizeThresholds(thresholds) {
  if (!thresholds) return [];
  /** @type {Threshold[]} */
  const out = [];
  if (Array.isArray(thresholds)) {
    for (const threshold of thresholds) {
      if (threshold && Number.isFinite(threshold.value)) out.push(threshold);
    }
  } else {
    const { warning, error } =
      /** @type {{ warning?: number, error?: number }} */ (thresholds);
    if (typeof warning === "number" && Number.isFinite(warning)) {
      out.push({ value: warning, kind: "warning" });
    }
    if (typeof error === "number" && Number.isFinite(error)) {
      out.push({ value: error, kind: "error" });
    }
  }
  return out.sort((a, b) => a.value - b.value);
}

/**
 * Status at `value`: the kind of the highest threshold it has reached
 * (`value >= threshold.value`), or `"default"` below them all.
 *
 * @param {number} value
 * @param {ReadonlyArray<Threshold>} thresholds Ascending by `value`.
 * @returns {Threshold["kind"] | "default"}
 */
export function statusAt(value, thresholds) {
  /** @type {Threshold["kind"] | "default"} */
  let status = "default";
  for (const threshold of thresholds) {
    if (value >= threshold.value) status = threshold.kind;
    else break;
  }
  return status;
}

/**
 * Thresholds crossed between two readings, in the order crossed. Reaching a
 * threshold counts as crossing above it (`prev < t <= next`), and leaving it
 * as crossing below (`next < t <= prev`).
 *
 * @param {number} prev
 * @param {number} next
 * @param {ReadonlyArray<Threshold>} thresholds Ascending by `value`.
 * @returns {ThresholdCrossing[]}
 */
export function crossings(prev, next, thresholds) {
  /** @type {ThresholdCrossing[]} */
  const out = [];
  if (!Number.isFinite(prev) || !Number.isFinite(next) || prev === next) {
    return out;
  }
  if (next > prev) {
    for (const threshold of thresholds) {
      if (prev < threshold.value && next >= threshold.value) {
        out.push({ threshold, direction: "above" });
      }
    }
  } else {
    for (let i = thresholds.length - 1; i >= 0; i--) {
      const threshold = thresholds[i];
      if (next < threshold.value && prev >= threshold.value) {
        out.push({ threshold, direction: "below" });
      }
    }
  }
  return out;
}
