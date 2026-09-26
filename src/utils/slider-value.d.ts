/**
 * Resolve the `aria-valuetext` for a numeric slider value.
 */
export function getValueText(
  numericValue: number,
  formatValue: ((value: number) => string) | undefined,
): string | undefined;

/**
 * Resolve a range label (min/max), preferring an explicit `label`, then
 * `formatValue`, then falling back to the raw numeric value.
 */
export function formatRangeLabel(
  label: string,
  numericValue: number,
  formatValue: ((value: number) => string) | undefined,
): string | number;

/**
 * Read the horizontal client coordinate from a mouse or touch event.
 * Returns `null` for a touch event with no active touch point.
 */
export function getClientX(event: MouseEvent | TouchEvent): number | null;

/**
 * Read the vertical client coordinate from a mouse or touch event.
 * Returns `null` for a touch event with no active touch point.
 */
export function getClientY(event: MouseEvent | TouchEvent): number | null;

/**
 * Compute the slider value for a horizontal client position within a
 * track, snapped to `step` and clamped to `[min, max]`.
 */
export function valueFromTrackPosition(options: {
  clientX: number;
  left: number;
  width: number;
  min: number;
  max: number;
  step: number;
}): number;
