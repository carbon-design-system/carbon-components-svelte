/**
 * Resolve the `aria-valuetext` for a numeric slider value. A value sitting
 * on a labeled mark announces the mark's label, after the formatted value
 * when `formatValue` is set and yields different text.
 */
export function getValueText(
  numericValue: number,
  formatValue: ((value: number) => string) | undefined,
  markLabels?: ReadonlyMap<number, string>,
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
 * Snap `value` to the nearest `min + n * step` and clamp it to `[min, max]`.
 * The result is rounded to the decimal precision of `step` and `min`, so
 * `step: 0.1` yields `0.3`, not `0.30000000000000004`. A non-positive
 * `step` only clamps.
 */
export function snapToStep(
  value: number,
  options: { min: number; max: number; step: number },
): number;

/**
 * Shift `[lower, upper]` by `delta` without changing its width, stopping
 * against `min` or `max`. Results are rounded to the decimal precision of
 * `step`, `min`, and the bounds, so the addition leaks no float noise.
 */
export function shiftRange(
  lower: number,
  upper: number,
  delta: number,
  options: { min: number; max: number; step: number },
): { lower: number; upper: number };

/**
 * Resolve the range painted by dragging from `anchor` to `point`, in either
 * direction. A range narrower than `minGap` grows in the drag direction,
 * then back from `max` or `min` when it runs out of room.
 */
export function brushRange(
  anchor: number,
  point: number,
  options: { min: number; max: number; minGap: number },
): { lower: number; upper: number };

type TrackRect = Pick<
  DOMRect,
  "left" | "right" | "width" | "bottom" | "height"
>;

/**
 * Read the client coordinate along the slider axis from a mouse or touch
 * event. Returns `null` for a touch event with no active touch point.
 */
export function getPointerPosition(
  event: MouseEvent | TouchEvent,
  orientation: "horizontal" | "vertical",
): number | null;

/**
 * Whether values increase leftward along a track: a horizontal track in
 * RTL, as `resolveLayoutDirection` reads it: the track's nearest `dir`,
 * then the nearest `LayoutDirection`, then the computed direction. Before
 * mount, without a `LayoutDirection`, the track counts as LTR, so nothing
 * reads the document on the server.
 */
export function isTrackRtl(
  orientation: "horizontal" | "vertical",
  contextDirection: "ltr" | "rtl" | undefined,
  track: Element | null,
): boolean;

/**
 * The sign a horizontal track's styles mirror its parts by, for the
 * track's `--ccs-slider-sign`: `-1` in RTL. `--ccs-inline-sign` from the
 * nearest `dir` attribute decides, so markup rendered on the server sits
 * right for any `dir` before the script runs. Without a `dir` attribute,
 * such as for a `direction` set in CSS, `rtl` as the script read it does.
 */
export function trackSign(rtl: boolean): string;

/**
 * CSS `left` for the point `percent` of the way along a horizontal track
 * from its inline start. Where `--ccs-slider-sign` is `-1`, the point
 * mirrors across the middle of the track.
 */
export function trackLeft(percent: number): string;

/**
 * A transform that mirrors a box as wide as the track, with its transform
 * origin on the left, across the middle of the track where
 * `--ccs-slider-sign` is `-1`. Put it before the box's own transform.
 */
export const TRACK_MIRROR: string;

/**
 * Resolve a track rect into its start and signed length along the slider
 * axis. Values increase upward when vertical, so the start is the bottom
 * edge and the length is negative. In RTL, values increase leftward, so
 * the start is the right edge.
 */
export function getTrackAxis(
  rect: TrackRect,
  orientation: "horizontal" | "vertical",
  rtl?: boolean,
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
    /** Values increase leftward. */
    rtl?: boolean;
  },
): number | null;

/**
 * Width for the slider's text input when its longest value has more than
 * three characters. Returns `undefined` to keep the stylesheet's width.
 */
export function getTextInputWidth(
  min: number,
  max: number,
  step: number,
): string | undefined;
