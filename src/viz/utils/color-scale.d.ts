/**
 * Map a normalized value onto a step of a sequential or diverging ramp.
 */
import type { VizDivergingPalette, VizSequentialHue } from "./tokens.js";

/**
 * Sequential color for `t` in `[0, 1]`, low to high, as a `var()` reference.
 * `"transparent"` for a non-finite `t`. Step 01 matches the background, so
 * pass `minStep: 2` when a zero value should still be visible.
 */
export function sequentialColor(
  t: number,
  hue?: VizSequentialHue,
  options?: { minStep?: number },
): string;

/**
 * Sequential ramp step (1-based) that `sequentialColor` picks for `t`, for
 * choosing a readable label color with `contrastTextColor`.
 */
export function sequentialStep(
  t: number,
  options?: { minStep?: number },
): number;

/**
 * Diverging color for `t` in `[-1, 1]` as a `var()` reference. `0` is the
 * neutral midpoint, `-1` the low extreme, `1` the high extreme.
 * `"transparent"` for a non-finite `t`.
 */
export function divergingColor(
  t: number,
  palette?: VizDivergingPalette,
): string;

/**
 * Text color, as a `var()` reference, that stays readable on a sequential
 * ramp step. The low half of
 * a ramp sits near the background, where body text already contrasts. The
 * high half needs the inverse. Dark themes reverse the ramp, so the same
 * rule holds there.
 */
export function contrastTextColor(step: number, steps?: number): string;
