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
  return snapToStep(min + (max - min) * ((clientX - left) / width), {
    min,
    max,
    step,
  });
}

/**
 * Count the decimal places in a number's shortest string form, including
 * exponent notation (`1e-7` has 7).
 *
 * @param {number} value
 * @returns {number}
 */
function decimalPlaces(value) {
  if (!Number.isFinite(value)) return 0;
  const [mantissa, exponent = "0"] = String(value).split("e");
  const fraction = mantissa.split(".")[1]?.length ?? 0;
  return Math.max(0, fraction - Number(exponent));
}

/**
 * Snap `value` to the nearest `min + n * step` and clamp it to `[min, max]`.
 * The result is rounded to the decimal precision of `step` and `min`, so
 * `step: 0.1` yields `0.3`, not `0.30000000000000004`. A non-positive
 * `step` only clamps.
 *
 * @param {number} value
 * @param {Object} options
 * @param {number} options.min
 * @param {number} options.max
 * @param {number} options.step
 * @returns {number}
 */
export function snapToStep(value, { min, max, step }) {
  let next = value;
  if (step > 0) {
    const precision = Math.max(decimalPlaces(step), decimalPlaces(min));
    next = Number(
      (min + Math.round((value - min) / step) * step).toFixed(precision),
    );
  }
  if (next <= min) return min;
  if (next >= max) return max;
  return next;
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
