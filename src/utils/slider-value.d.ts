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

type TrackRect = Pick<DOMRect, "left" | "width" | "bottom" | "height">;

/**
 * Read the client coordinate along the slider axis from a mouse or touch
 * event. Returns `null` for a touch event with no active touch point.
 */
export function getPointerPosition(
  event: MouseEvent | TouchEvent,
  orientation: "horizontal" | "vertical",
): number | null;

/**
 * Resolve a track rect into its start and signed length along the slider
 * axis. Values increase upward when vertical, so the start is the bottom
 * edge and the length is negative.
 */
export function getTrackAxis(
  rect: TrackRect,
  orientation: "horizontal" | "vertical",
): { start: number; length: number };

/**
 * Compute the slider value for a pointer event on a track, snapped to
 * `step` and clamped to `[min, max]`. `offset` is subtracted from the
 * pointer position, for keeping a grabbed handle under the pointer.
 * Returns `null` for a touch event with no active touch point.
 */
export function valueFromPointer(
  event: MouseEvent | TouchEvent,
  rect: TrackRect,
  options: {
    orientation: "horizontal" | "vertical";
    min: number;
    max: number;
    step: number;
    offset?: number;
  },
): number | null;
