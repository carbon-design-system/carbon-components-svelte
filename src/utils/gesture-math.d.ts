export type GestureAxis = "x" | "y" | "both";
export interface Point {
  x: number;
  y: number;
}

/** Speed under which a fling has stopped, in CSS pixels per millisecond. */
export const INERTIA_MIN_SPEED: number;

/** The `touch-action` a set of gestures needs. */
export function computeTouchAction(needs: {
  doubleTap?: boolean;
  pinch?: boolean;
  pan?: GestureAxis | null;
  swipe?: GestureAxis | null;
}): string;

export function createVelocityTracker(windowMs?: number): {
  add: (x: number, y: number, time: number) => void;
  velocity: () => Point;
  reset: () => void;
};

/** Advance a fling by `dt` milliseconds of exponential decay. */
export function inertiaStep(
  velocity: Point,
  dt: number,
): { dx: number; dy: number; velocity: Point };

export function wheelFactor(
  deltaY: number,
  deltaMode: number,
  ctrlKey: boolean,
): number;

export function pinchGeometry(
  a: Point,
  b: Point,
): { distance: number; center: Point; angle: number };

export function angleDelta(to: number, from: number): number;

export function swipeDirection(release: {
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  axis: GestureAxis;
  minDistance: number;
  minVelocity: number;
}): "left" | "right" | "up" | "down" | null;
