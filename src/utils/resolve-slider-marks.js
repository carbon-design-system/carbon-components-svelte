// @ts-check
// Resolve Slider / RangeSlider `marks` into a list of tick positions.

import { getTrackAxis, snapToStep, valueFromPointer } from "./slider-value.js";

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
 * Find the mark within `distance` pixels of the pointer on a track, for
 * soft snapping. `offset` is subtracted from the pointer position, as in
 * `valueFromPointer`. Returns `undefined` when no mark is that close.
 *
 * @param {MouseEvent | TouchEvent} event
 * @param {Pick<DOMRect, "left" | "width" | "bottom" | "height">} rect
 * @param {Object} options
 * @param {"horizontal" | "vertical"} options.orientation
 * @param {number} options.min
 * @param {number} options.max
 * @param {ReadonlyArray<SliderMark>} options.marks
 * @param {number} options.distance
 * @param {number} [options.offset]
 * @returns {SliderMark | undefined}
 */
export function markNearPointer(
  event,
  rect,
  { orientation, min, max, marks, distance, offset = 0 },
) {
  if (!(distance > 0) || !marks.length || max <= min) return undefined;
  const pointerValue = valueFromPointer(event, rect, {
    orientation,
    min,
    max,
    step: 0,
    offset,
  });
  if (pointerValue == null) return undefined;
  const mark = /** @type {SliderMark} */ (nearestMark(pointerValue, marks));
  const { length } = getTrackAxis(rect, orientation);
  const pixels = Math.abs(((pointerValue - mark.value) / (max - min)) * length);
  return pixels <= distance ? mark : undefined;
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
