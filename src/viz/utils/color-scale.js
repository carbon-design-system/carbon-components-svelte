// @ts-check
// Map a normalized value onto a step of a sequential or diverging ramp.
import { VIZ_DIVERGING_STEPS, VIZ_SEQUENTIAL_STEPS } from "./tokens.js";

/** @param {number} n */
function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * 1-based ramp step for `t` in `[0, 1]`, clamped.
 *
 * @param {number} t
 * @param {number} steps
 * @returns {number}
 */
function stepAt(t, steps) {
  const clamped = Math.min(1, Math.max(0, t));
  return Math.min(steps, Math.floor(clamped * steps) + 1);
}

/**
 * Sequential color for `t` in `[0, 1]`, low to high, as a `var()` reference.
 * `"transparent"` for a non-finite `t`. Step 01 matches the background, so
 * pass `minStep: 2` when a zero value should still be visible.
 *
 * @param {number} t
 * @param {import("./tokens.d.ts").VizSequentialHue} [hue]
 * @param {{ minStep?: number }} [options]
 * @returns {string}
 */
export function sequentialColor(t, hue = "blue", { minStep = 1 } = {}) {
  if (!Number.isFinite(t)) return "transparent";
  const first = Math.min(
    VIZ_SEQUENTIAL_STEPS,
    Math.max(1, Math.floor(minStep)),
  );
  const step = first - 1 + stepAt(t, VIZ_SEQUENTIAL_STEPS - first + 1);
  return `var(--cds-viz-seq-${hue}-${pad(step)})`;
}

/**
 * Sequential ramp step (1-based) that `sequentialColor` picks for `t`, for
 * choosing a readable label color with `contrastTextColor`.
 *
 * @param {number} t
 * @param {{ minStep?: number }} [options]
 * @returns {number}
 */
export function sequentialStep(t, { minStep = 1 } = {}) {
  const first = Math.min(
    VIZ_SEQUENTIAL_STEPS,
    Math.max(1, Math.floor(minStep)),
  );
  return (
    first -
    1 +
    stepAt(Number.isFinite(t) ? t : 0, VIZ_SEQUENTIAL_STEPS - first + 1)
  );
}

/**
 * Diverging color for `t` in `[-1, 1]` as a `var()` reference. `0` is the
 * neutral midpoint, `-1` the low extreme, `1` the high extreme.
 * `"transparent"` for a non-finite `t`.
 *
 * @param {number} t
 * @param {import("./tokens.d.ts").VizDivergingPalette} [palette]
 * @returns {string}
 */
export function divergingColor(t, palette = "red-cyan") {
  if (!Number.isFinite(t)) return "transparent";
  const mid = (VIZ_DIVERGING_STEPS + 1) / 2;
  const clamped = Math.min(1, Math.max(-1, t));
  const step = mid + Math.round(clamped * (mid - 1));
  return `var(--cds-viz-div-${palette}-${pad(step)})`;
}

/**
 * Text color, as a `var()` reference, that stays readable on a sequential
 * ramp step. The low half of
 * a ramp sits near the background, where body text already contrasts. The
 * high half needs the inverse. Dark themes reverse the ramp, so the same
 * rule holds there.
 *
 * @param {number} step 1-based ramp step.
 * @param {number} [steps]
 * @returns {string}
 */
export function contrastTextColor(step, steps = VIZ_SEQUENTIAL_STEPS) {
  return step > Math.ceil(steps / 2)
    ? "var(--cds-viz-inverse-01)"
    : "var(--cds-viz-text-01)";
}
