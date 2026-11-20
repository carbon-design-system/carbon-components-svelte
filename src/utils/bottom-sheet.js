// @ts-check

/**
 * @typedef {"peek" | "half" | "full" | "content" | number | `${number}%`} SnapPoint
 * @typedef {{ point: SnapPoint, height: number }} ResolvedSnap
 */

/** Height of the `"peek"` snap point, in px. */
export const PEEK_HEIGHT = 120;

/** The gap the tallest snap point leaves above the sheet, in px. */
export const TOP_GAP = 48;

/** The shortest a snap point gets, in px. */
const MIN_HEIGHT = 64;

/** Release speed, in px per ms, at which a drag becomes a fling. */
export const FLING_VELOCITY = 0.5;

/** How far ahead, in ms, a fling is projected to pick a snap point. */
const PROJECTION_MS = 160;

/** The most a rubber-banded drag stretches past an end, in px. */
const RUBBER_BAND_LIMIT = 56;

/** Two heights closer than this are one snap point. */
const SAME_HEIGHT = 1;

/**
 * Turn each snap point into a height in px, sorted ascending, with
 * duplicates and unusable entries dropped. Heights are limited to the
 * viewport minus `TOP_GAP`, so `"full"` is the tallest the sheet gets.
 *
 * @param {readonly SnapPoint[]} points
 * @param {object} measure
 * @param {number} measure.available - The visible viewport height in px.
 * @param {number} measure.contentHeight - The natural height of the sheet's content in px.
 * @returns {ResolvedSnap[]}
 */
export function resolveSnapPoints(points, { available, contentHeight }) {
  const maxHeight = Math.max(MIN_HEIGHT, available - TOP_GAP);
  /** @type {ResolvedSnap[]} */
  const resolved = [];
  for (const point of points) {
    const raw = snapHeight(point, available, maxHeight, contentHeight);
    if (raw === undefined || !Number.isFinite(raw)) continue;
    const height = Math.round(Math.min(maxHeight, Math.max(MIN_HEIGHT, raw)));
    if (!resolved.some((r) => Math.abs(r.height - height) < SAME_HEIGHT)) {
      resolved.push({ point, height });
    }
  }
  return resolved.sort((a, b) => a.height - b.height);
}

/**
 * @param {SnapPoint} point
 * @param {number} available
 * @param {number} maxHeight
 * @param {number} contentHeight
 * @returns {number | undefined}
 */
function snapHeight(point, available, maxHeight, contentHeight) {
  if (typeof point === "number") return point;
  if (point === "peek") return PEEK_HEIGHT;
  if (point === "half") return available / 2;
  if (point === "full") return maxHeight;
  if (point === "content") return contentHeight;
  if (typeof point === "string" && point.endsWith("%")) {
    const percent = Number.parseFloat(point);
    return Number.isNaN(percent) ? undefined : (available * percent) / 100;
  }
  return undefined;
}

/**
 * Stretch a distance past an end with growing resistance: it starts at 1:1
 * and never passes `limit`.
 * @param {number} distance
 * @param {number} [limit]
 * @returns {number}
 */
export function rubberBand(distance, limit = RUBBER_BAND_LIMIT) {
  if (distance <= 0) return 0;
  return (distance * limit) / (distance + limit);
}

/**
 * The visible height of a sheet dragged `delta` px up from `start`.
 * Past the tallest snap point the sheet stretches with resistance. Below
 * the shortest it stretches too, unless the sheet is dismissible, when it
 * follows the pointer down to nothing.
 *
 * @param {object} options
 * @param {number} options.start - The visible height when the drag began.
 * @param {number} options.delta - Pointer travel in px; positive is up.
 * @param {number} options.min - The shortest snap height.
 * @param {number} options.max - The tallest snap height.
 * @param {boolean} options.dismissible
 * @param {boolean} [options.reducedMotion] - Clamp instead of stretching.
 * @returns {number}
 */
export function dragHeight({
  start,
  delta,
  min,
  max,
  dismissible,
  reducedMotion = false,
}) {
  const raw = start + delta;
  if (raw > max) return max + (reducedMotion ? 0 : rubberBand(raw - max));
  if (raw < min) {
    if (dismissible) return Math.max(0, raw);
    return min - (reducedMotion ? 0 : rubberBand(min - raw));
  }
  return raw;
}

/**
 * Pick where a released drag settles. A slow release goes to the nearest
 * snap point. A fling, faster than `FLING_VELOCITY`, goes at least to the
 * next snap point in its direction, and further when its projection says
 * so. A dismissible sheet has a virtual snap point at height 0.
 *
 * @param {object} options
 * @param {number} options.height - The visible height at release.
 * @param {number} options.velocity - Release speed in px per ms; positive is downward.
 * @param {readonly number[]} options.heights - Snap heights, ascending.
 * @param {boolean} options.dismissible
 * @returns {{ index: number, dismiss: false } | { index: -1, dismiss: true }}
 */
export function settle({ height, velocity, heights, dismissible }) {
  const stops = dismissible ? [0, ...heights] : [...heights];
  const nearest = (/** @type {number} */ value) => {
    let best = 0;
    for (let i = 1; i < stops.length; i++) {
      if (Math.abs(stops[i] - value) < Math.abs(stops[best] - value)) best = i;
    }
    return best;
  };
  let target = nearest(height);
  if (Math.abs(velocity) >= FLING_VELOCITY) {
    const projected = nearest(height - velocity * PROJECTION_MS);
    if (velocity < 0) {
      // Up: the next stop above the release point, or the last one.
      let next = stops.findIndex((stop) => stop > height + SAME_HEIGHT);
      if (next === -1) next = stops.length - 1;
      target = Math.max(next, projected);
    } else {
      // Down: the next stop below the release point, or the first one.
      let next = 0;
      for (let i = 0; i < stops.length; i++) {
        if (stops[i] < height - SAME_HEIGHT) next = i;
      }
      target = Math.min(next, projected);
    }
  }
  if (dismissible && target === 0) return { index: -1, dismiss: true };
  return { index: dismissible ? target - 1 : target, dismiss: false };
}

/**
 * Release velocity over the last 100 ms of a drag.
 * @returns {{
 *   add: (position: number, time: number) => void,
 *   velocity: (now?: number) => number,
 *   reset: () => void,
 * }}
 */
export function createVelocityTracker() {
  /** @type {{ position: number, time: number }[]} */
  let samples = [];
  return {
    add(position, time) {
      samples.push({ position, time });
      while (samples.length > 2 && time - samples[0].time > 100) {
        samples.shift();
      }
    },
    /**
     * Px per ms; positive is toward larger positions. A finger that has
     * rested for 100 ms before `now` has no speed.
     */
    velocity(now) {
      if (samples.length < 2) return 0;
      const first = samples[0];
      const last = samples[samples.length - 1];
      if (now !== undefined && now - last.time > 100) return 0;
      const elapsed = last.time - first.time;
      return elapsed > 0 ? (last.position - first.position) / elapsed : 0;
    },
    reset() {
      samples = [];
    },
  };
}

/**
 * Decide, from the first travel of a touch inside the sheet's scrolling
 * body, who gets the gesture: the `"sheet"` (the sheet moves), the
 * `"content"` (the browser scrolls), or `"undecided"` until the finger has
 * moved far enough to tell.
 *
 * The sheet gets the gesture while it is below its tallest snap point (the
 * content does not scroll until the sheet is fully open), and at the
 * tallest only for a downward drag that started with the content scrolled
 * to the top. A mostly sideways drag always goes to the content.
 *
 * @param {object} options
 * @param {number} options.dx - Finger travel in px; positive is right.
 * @param {number} options.dy - Finger travel in px; positive is down.
 * @param {number} options.scrollTop - The body's `scrollTop` at touch start.
 * @param {boolean} options.atMax - Whether the sheet is at its tallest snap point.
 * @param {number} [options.slop] - Travel in px that decides.
 * @returns {"undecided" | "sheet" | "content"}
 */
export function claimTouch({ dx, dy, scrollTop, atMax, slop = 4 }) {
  if (Math.hypot(dx, dy) < slop) return "undecided";
  if (Math.abs(dx) > Math.abs(dy)) return "content";
  if (!atMax) return "sheet";
  return dy > 0 && scrollTop <= 0 ? "sheet" : "content";
}
