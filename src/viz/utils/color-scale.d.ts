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

/** 1-based diverging ramp step that `divergingColor` picks for `t`. */
export function divergingStep(t: number): number;

/**
 * Text color, as a `var()` reference, that stays readable on a ramp step.
 * Which steps need dark text differs between light and dark themes, so the
 * choice lives in CSS: one `--cds-viz-seq-on-<step>` or
 * `--cds-viz-div-on-<step>` token per step.
 */
export function contrastTextColor(
  step: number,
  ramp?: "sequential" | "diverging",
): string;
