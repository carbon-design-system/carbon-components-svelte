// @ts-check
// Shared value/label logic for Slider and RangeSlider.

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
  let nextValue =
    min + Math.round(((max - min) * ((clientX - left) / width)) / step) * step;

  if (nextValue <= min) {
    nextValue = min;
  } else if (nextValue >= max) {
    nextValue = max;
  }

  return nextValue;
}
