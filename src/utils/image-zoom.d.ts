export type Size = { width: number; height: number };
export type Point = { x: number; y: number };
/**
 * The image's scale (CSS pixels per image pixel, so 1 is 100%) and the offset
 * of its top-left corner from the frame's, in CSS pixels.
 */
export type View = { scale: number; x: number; y: number };

/**
 * The scale at which the whole image fits the frame, capped (at 1 by
 * default) so a small image is not enlarged.
 */
export function fitScale(frame: Size, natural: Size, cap?: number): number;

/**
 * Keep one axis of the image inside the frame. An image smaller than the
 * frame on this axis is centered.
 */
export function clampAxis(
  offset: number,
  content: number,
  frame: number,
): number;

export function clampView(view: View, natural: Size, frame: Size): View;

export function centeredView(scale: number, natural: Size, frame: Size): View;

/** Change the scale so the image point under `anchor` stays under it. */
export function zoomAt(
  view: View,
  scale: number,
  anchor: Point,
  natural: Size,
  frame: Size,
  bounds: { min: number; max: number },
): View;

/** Move the image by a distance, held inside the frame. */
export function panBy(
  view: View,
  dx: number,
  dy: number,
  natural: Size,
  frame: Size,
): View;

export function isZoomed(scale: number, fit: number): boolean;

/** The scale one zoom step away. */
export function stepScale(
  scale: number,
  direction: 1 | -1,
  step: number,
  bounds: { min: number; max: number },
): number;

/**
 * Where a double-click or double-tap goes: back to fit from a zoomed view,
 * else to the image's actual size (100%), or twice the fit scale when the
 * image is already about that size.
 */
export function toggleScale(scale: number, fit: number, max: number): number;

/**
 * The factor a wheel event scales by. A trackpad pinch arrives as a wheel
 * event with `ctrlKey` and small deltas, so it is more sensitive.
 */
export function wheelFactor(
  deltaY: number,
  deltaMode: number,
  ctrlKey: boolean,
): number;

export function pinchGeometry(
  a: Point,
  b: Point,
): { distance: number; midpoint: Point };

/** Whether a tap follows another closely enough to be a double tap. */
export function isDoubleTap(
  previous: { x: number; y: number; time: number } | null,
  tap: { x: number; y: number; time: number },
  limits?: { delay?: number; distance?: number },
): boolean;

/** Track recent pointer positions to find a drag's release velocity (px/ms). */
export function createVelocityTracker(windowMs?: number): {
  add(x: number, y: number, time: number): void;
  velocity(): Point;
  reset(): void;
};

/** Speed under which inertia stops, in CSS pixels per millisecond. */
export const INERTIA_MIN_SPEED: number;

/** Advance a release by `dt` milliseconds with exponential decay. */
export function inertiaStep(
  velocity: Point,
  dt: number,
): { dx: number; dy: number; velocity: Point };
