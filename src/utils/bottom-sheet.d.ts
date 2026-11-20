/** Where a `BottomSheet` rests: a named height, px, a percentage of the viewport, or `"content"`. */
export type SnapPoint =
  "peek" | "half" | "full" | "content" | number | `${number}%`;

export interface ResolvedSnap {
  point: SnapPoint;
  /** The visible height in px. */
  height: number;
}

/** Height of the `"peek"` snap point, in px. */
export const PEEK_HEIGHT: number;

/** The gap the tallest snap point leaves above the sheet, in px. */
export const TOP_GAP: number;

/** Release speed, in px per ms, at which a drag becomes a fling. */
export const FLING_VELOCITY: number;

/**
 * Turn each snap point into a height in px, sorted ascending, with
 * duplicates and unusable entries dropped.
 */
export function resolveSnapPoints(
  points: readonly SnapPoint[],
  measure: { available: number; contentHeight: number },
): ResolvedSnap[];

/** Stretch a distance past an end with growing resistance. */
export function rubberBand(distance: number, limit?: number): number;

/** The visible height of a sheet dragged `delta` px up from `start`. */
export function dragHeight(options: {
  start: number;
  delta: number;
  min: number;
  max: number;
  dismissible: boolean;
  reducedMotion?: boolean;
}): number;

/** Pick where a released drag settles. */
export function settle(options: {
  height: number;
  velocity: number;
  heights: readonly number[];
  dismissible: boolean;
}): { index: number; dismiss: false } | { index: -1; dismiss: true };

/** Release velocity over the last 100 ms of a drag. */
export function createVelocityTracker(): {
  add: (position: number, time: number) => void;
  velocity: (now?: number) => number;
  reset: () => void;
};

/** Decide who gets a touch inside the sheet's scrolling body. */
export function claimTouch(options: {
  dx: number;
  dy: number;
  scrollTop: number;
  atMax: boolean;
  slop?: number;
}): "undecided" | "sheet" | "content";
