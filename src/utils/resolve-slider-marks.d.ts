/**
 * Resolve Slider / RangeSlider `marks` into a list of tick positions.
 */

export type SliderMark = { value: number; label?: string };

/**
 * Resolve `marks` into tick entries within `[min, max]`.
 * `true` generates a tick at every `step` from `min` through `max`.
 * An array is filtered to values in range. Falsy values yield no marks.
 */
export function resolveSliderMarks(
  marks: boolean | ReadonlyArray<SliderMark> | null | undefined,
  min: number,
  max: number,
  step: number,
): SliderMark[];

/** Map each labeled mark's value to its label, for `aria-valuetext` lookups. */
export function getMarkLabels(
  marks: ReadonlyArray<SliderMark>,
): Map<number, string>;

/**
 * Move `count` marks away from `value`, walking marks in value order
 * regardless of the order they were passed in. An off-mark `value` starts
 * from its nearest mark. Stops at the first and last mark. Returns `value`
 * when `marks` is empty.
 */
export function stepMarks(
  value: number,
  marks: ReadonlyArray<SliderMark>,
  count: number,
): number;

/**
 * Find the mark whose `value` is closest to `value`. Ties resolve to the
 * earlier (lower-index) mark. Returns `undefined` when `marks` is empty.
 */
export function nearestMark(
  value: number,
  marks: ReadonlyArray<SliderMark>,
): SliderMark | undefined;
