// @ts-check
// Shared value/label logic for Slider and RangeSlider.

import { roundToStep } from "./numeric-format.js";

/**
 * Resolve the `aria-valuetext` for a numeric slider value.
 *
 * @param {number} numericValue
 * @param {((value: number) => string) | undefined} formatValue
 * @returns {string | undefined}
 */
export function getValueText(numericValue, formatValue) {
  return formatValue ? formatValue(numericValue) : undefined;
}

/**
 * Resolve a range label (min/max), preferring an explicit `label`, then
 * `formatValue`, then falling back to the raw numeric value.
 *
 * @param {string} label
 * @param {number} numericValue
 * @param {((value: number) => string) | undefined} formatValue
 * @returns {string | number}
 */
export function formatRangeLabel(label, numericValue, formatValue) {
  if (label) return label;
  if (formatValue) return formatValue(numericValue);
  return label || numericValue;
}

/**
 * Read the horizontal client coordinate from a mouse or touch event.
 * Returns `null` for a touch event with no active touch point (for example
 * a `touchend` whose `touches` list is already empty).
 *
 * @param {MouseEvent | TouchEvent} event
 * @returns {number | null}
 */
export function getClientX(event) {
  if ("touches" in event) return event.touches[0]?.clientX ?? null;
  return event.clientX;
}

/**
 * Read the vertical client coordinate from a mouse or touch event.
 * Returns `null` for a touch event with no active touch point.
 *
 * @param {MouseEvent | TouchEvent} event
 * @returns {number | null}
 */
export function getClientY(event) {
  if ("touches" in event) return event.touches[0]?.clientY ?? null;
  return event.clientY;
}

/**
 * Snap `value` to the `step` grid counted from `min` (min 3, step 5:
 * 3, 8, 13), rounded to the decimals in `step` so 0.1 steps don't drift.
 *
 * @param {number} value
 * @param {number} min
 * @param {number} step
 * @returns {number}
 */
export function snapToStep(value, min, step) {
  return roundToStep(min + Math.round((value - min) / step) * step, step);
}

/**
 * Compute the slider value for a horizontal client position within a
 * track, snapped to `step` and clamped to `[min, max]`.
 *
 * @param {Object} options
 * @param {number} options.clientX
 * @param {number} options.left - track's `getBoundingClientRect().left`
 * @param {number} options.width - track's `getBoundingClientRect().width`
 * @param {number} options.min
 * @param {number} options.max
 * @param {number} options.step
 * @returns {number}
 */
export function valueFromTrackPosition({
  clientX,
  left,
  width,
  min,
  max,
  step,
}) {
  let nextValue = roundToStep(
    min + Math.round(((max - min) * ((clientX - left) / width)) / step) * step,
    step,
  );

  if (nextValue <= min) {
    nextValue = min;
  } else if (nextValue >= max) {
    nextValue = max;
  }

  return nextValue;
}

/**
 * Read the client coordinate along the slider axis from a mouse or touch
 * event. Returns `null` for a touch event with no active touch point.
 *
 * @param {MouseEvent | TouchEvent} event
 * @param {"horizontal" | "vertical"} orientation
 * @returns {number | null}
 */
export function getPointerPosition(event, orientation) {
  return orientation === "vertical" ? getClientY(event) : getClientX(event);
}

/**
 * Resolve a track rect into its start and signed length along the slider
 * axis. Values increase upward when vertical, so the start is the bottom
 * edge and the length is negative.
 *
 * @param {Pick<DOMRect, "left" | "width" | "bottom" | "height">} rect
 * @param {"horizontal" | "vertical"} orientation
 * @returns {{ start: number; length: number }}
 */
export function getTrackAxis(rect, orientation) {
  return orientation === "vertical"
    ? { start: rect.bottom, length: -rect.height }
    : { start: rect.left, length: rect.width };
}

/**
 * Compute the slider value for a pointer event on a track, snapped to
 * `step` and clamped to `[min, max]`. `offset` is subtracted from the
 * pointer position, for keeping a grabbed handle under the pointer.
 * Returns `null` for a touch event with no active touch point.
 *
 * @param {MouseEvent | TouchEvent} event
 * @param {Pick<DOMRect, "left" | "width" | "bottom" | "height">} rect
 * @param {Object} options
 * @param {"horizontal" | "vertical"} options.orientation
 * @param {number} options.min
 * @param {number} options.max
 * @param {number} options.step
 * @param {number} [options.offset]
 * @returns {number | null}
 */
export function valueFromPointer(
  event,
  rect,
  { orientation, min, max, step, offset = 0 },
) {
  const point = getPointerPosition(event, orientation);
  if (point == null) return null;
  const { start, length } = getTrackAxis(rect, orientation);
  // valueFromTrackPosition is axis-agnostic: a negative `width` (vertical)
  // flips the interpolation so the bottom edge is `min`.
  return valueFromTrackPosition({
    clientX: point - offset,
    left: start,
    width: length,
    min,
    max,
    step,
  });
}

/**
 * Characters in the integer part of `value`, counting a minus sign.
 *
 * @param {number} value
 * @returns {number}
 */
function integerChars(value) {
  return String(Math.trunc(Math.abs(value))).length + (value < 0 ? 1 : 0);
}

/**
 * Width for the slider's text input when its longest value has more than
 * three characters, which the fixed 4rem input clips. Counts the integer
 * digits of `min` and `max`, a minus sign, and the decimals `step` allows.
 * Returns `undefined` to keep the stylesheet's width.
 *
 * @param {number} min
 * @param {number} max
 * @param {number} step
 * @returns {string | undefined}
 */
export function getTextInputWidth(min, max, step) {
  const decimals = step.toString().split(".")[1]?.length || 0;
  const chars =
    Math.max(integerChars(min), integerChars(max)) +
    (decimals ? decimals + 1 : 0);
  if (chars <= 3) return undefined;
  // Half a character of slack covers the type style's letter spacing; the
  // 2rem is the input's horizontal padding.
  return `calc(${chars + 0.5}ch + 2rem)`;
}
