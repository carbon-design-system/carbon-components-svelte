// @ts-check
// Resolve Slider / RangeSlider `marks` into a list of tick positions.

import { snapToStep } from "./slider-value.js";

/**
 * @typedef {{ value: number; label?: string }} SliderMark
 */

/**
 * Resolve `marks` into tick entries within `[min, max]`.
 * `true` generates a tick at every `step` from `min` through `max`.
 * An array is filtered to values in range. Falsy values yield no marks.
 *
 * @param {boolean | ReadonlyArray<SliderMark> | null | undefined} marks
 * @param {number} min
 * @param {number} max
 * @param {number} step
 * @returns {SliderMark[]}
 */
export function resolveSliderMarks(marks, min, max, step) {
  if (!marks) return [];

  if (Array.isArray(marks)) {
    return marks.filter(
      (mark) =>
        typeof mark?.value === "number" &&
        !Number.isNaN(mark.value) &&
        mark.value >= min &&
        mark.value <= max,
    );
  }

  if (marks !== true || !(step > 0) || max < min) return [];

  const range = max - min;
  const steps = Math.round(range / step);
  /** @type {SliderMark[]} */
  const resolved = [];
  for (let i = 0; i <= steps; i++) {
    const value =
      i === steps ? max : snapToStep(min + i * step, { min, max, step });
    resolved.push({ value });
  }
  return resolved;
}

/**
 * Map each labeled mark's value to its label, for `aria-valuetext` lookups.
 *
 * @param {ReadonlyArray<SliderMark>} marks
 * @returns {Map<number, string>}
 */
export function getMarkLabels(marks) {
  /** @type {Map<number, string>} */
  const labels = new Map();
  for (const mark of marks) {
    if (mark.label) labels.set(mark.value, mark.label);
  }
  return labels;
}

/**
 * Move `count` marks away from `value`, walking marks in value order
 * regardless of the order they were passed in. An off-mark `value` starts
 * from its nearest mark. Stops at the first and last mark. Returns `value`
 * when `marks` is empty.
 *
 * @param {number} value
 * @param {ReadonlyArray<SliderMark>} marks
 * @param {number} count - negative moves toward lower values
 * @returns {number}
 */
export function stepMarks(value, marks, count) {
  if (!marks.length) return value;
  const stops = [...marks].sort((a, b) => a.value - b.value);
  const currentIndex = stops.findIndex((mark) => mark.value === value);
  const fromIndex =
    currentIndex === -1
      ? stops.indexOf(/** @type {SliderMark} */ (nearestMark(value, stops)))
      : currentIndex;
  const nextIndex = Math.min(stops.length - 1, Math.max(0, fromIndex + count));
  return stops[nextIndex].value;
}

/**
 * Find the mark whose `value` is closest to `value`. Ties resolve to the
 * earlier (lower-index) mark. Returns `undefined` when `marks` is empty.
 *
 * @param {number} value
 * @param {ReadonlyArray<SliderMark>} marks
 * @returns {SliderMark | undefined}
 */
export function nearestMark(value, marks) {
  if (!marks.length) return undefined;
  return marks.reduce((closest, mark) =>
    Math.abs(mark.value - value) < Math.abs(closest.value - value)
      ? mark
      : closest,
  );
}
