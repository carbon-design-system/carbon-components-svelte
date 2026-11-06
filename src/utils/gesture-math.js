// @ts-check

/**
 * @typedef {{ x: number, y: number }} Point
 * @typedef {"x" | "y" | "both"} GestureAxis
 */

const LINE_PX = 16;
const PAGE_PX = 400;
/** Time constant of the exponential decay a fling follows, in ms. */
const INERTIA_TIME_CONSTANT = 325;

/** Speed under which a fling has stopped, in CSS pixels per millisecond. */
export const INERTIA_MIN_SPEED = 0.02;

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * The `touch-action` a set of gestures needs. A recognizer takes the
 * pointer stream away from the browser for the axes it handles, and leaves
 * the rest to it, so a pan along x keeps the page's vertical scroll.
 *
 * - A pan or swipe claims its axis (`"both"` claims both).
 * - A pinch claims everything: two fingers are the browser's zoom and pan.
 * - A double tap alone turns off double-tap-to-zoom (`manipulation`).
 * - Tap and long press need nothing (`auto`).
 *
 * @param {{
 *   doubleTap?: boolean,
 *   pinch?: boolean,
 *   pan?: GestureAxis | null,
 *   swipe?: GestureAxis | null,
 * }} needs `pan` is `null` when the pan starts only after a long press.
 * @returns {string}
 */
export function computeTouchAction(needs) {
  let panX = true;
  let panY = true;
  let pinchZoom = true;
  if (needs.pinch) {
    panX = false;
    panY = false;
    pinchZoom = false;
  }
  for (const axis of [needs.pan, needs.swipe]) {
    if (axis === "x" || axis === "both") panX = false;
    if (axis === "y" || axis === "both") panY = false;
  }
  if (panX && panY && pinchZoom)
    return needs.doubleTap ? "manipulation" : "auto";
  /** @type {string[]} */
  const allowed = [];
  if (panX) allowed.push("pan-x");
  if (panY) allowed.push("pan-y");
  if (pinchZoom) allowed.push("pinch-zoom");
  return allowed.length > 0 ? allowed.join(" ") : "none";
}

/**
 * Track recent pointer positions to find the velocity a drag was released
 * with, in CSS pixels per millisecond. A pointer held still before release
 * has no velocity left.
 *
 * @param {number} [windowMs]
 */
export function createVelocityTracker(windowMs = 100) {
  /** @type {Array<{ x: number, y: number, time: number }>} */
  let samples = [];
  return {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} time
     */
    add(x, y, time) {
      samples.push({ x, y, time });
      while (samples.length > 2 && time - samples[0].time > windowMs) {
        samples.shift();
      }
    },
    /** @returns {Point} */
    velocity() {
      const first = samples[0];
      const last = samples[samples.length - 1];
      if (!first || first === last) return { x: 0, y: 0 };
      const elapsed = last.time - first.time;
      if (elapsed <= 0 || elapsed > windowMs * 2) return { x: 0, y: 0 };
      return {
        x: (last.x - first.x) / elapsed,
        y: (last.y - first.y) / elapsed,
      };
    },
    reset() {
      samples = [];
    },
  };
}

/**
 * Advance a fling by `dt` milliseconds with exponential decay: the distance
 * it travels and the velocity it has left. Stop when the speed falls under
 * `INERTIA_MIN_SPEED`, and skip it under reduced motion.
 *
 * @param {Point} velocity
 * @param {number} dt
 * @returns {{ dx: number, dy: number, velocity: Point }}
 */
export function inertiaStep(velocity, dt) {
  const decay = Math.exp(-dt / INERTIA_TIME_CONSTANT);
  const travel = INERTIA_TIME_CONSTANT * (1 - decay);
  return {
    dx: velocity.x * travel,
    dy: velocity.y * travel,
    velocity: { x: velocity.x * decay, y: velocity.y * decay },
  };
}

/**
 * The scale factor of one wheel event. A trackpad pinch arrives as a wheel
 * event with `ctrlKey` and small deltas, so it is more sensitive.
 *
 * @param {number} deltaY
 * @param {number} deltaMode
 * @param {boolean} ctrlKey
 * @returns {number}
 */
export function wheelFactor(deltaY, deltaMode, ctrlKey) {
  const pixels =
    deltaMode === 1
      ? deltaY * LINE_PX
      : deltaMode === 2
        ? deltaY * PAGE_PX
        : deltaY;
  return Math.exp(-clamp(pixels, -300, 300) * (ctrlKey ? 0.01 : 0.0015));
}

/**
 * The span, midpoint and angle of two pointers.
 *
 * @param {Point} a
 * @param {Point} b
 */
export function pinchGeometry(a, b) {
  return {
    distance: Math.hypot(b.x - a.x, b.y - a.y),
    center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    angle: Math.atan2(b.y - a.y, b.x - a.x),
  };
}

/**
 * The difference of two angles in (-PI, PI], so a rotation across the
 * +/-PI seam does not jump a full turn.
 *
 * @param {number} to
 * @param {number} from
 */
export function angleDelta(to, from) {
  let delta = to - from;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta <= -Math.PI) delta += 2 * Math.PI;
  return delta;
}

/**
 * The swipe a release makes, or `null`. It needs the travel along its axis
 * to pass `minDistance`, to beat the cross travel, and the release velocity
 * to pass `minVelocity` in the same direction.
 *
 * @param {{
 *   dx: number,
 *   dy: number,
 *   vx: number,
 *   vy: number,
 *   axis: GestureAxis,
 *   minDistance: number,
 *   minVelocity: number,
 * }} release
 * @returns {"left" | "right" | "up" | "down" | null}
 */
export function swipeDirection(release) {
  const { dx, dy, vx, vy, axis, minDistance, minVelocity } = release;
  const horizontal = Math.abs(dx) > Math.abs(dy);
  if (axis === "x" && !horizontal) return null;
  if (axis === "y" && horizontal) return null;
  const distance = horizontal ? dx : dy;
  const velocity = horizontal ? vx : vy;
  if (Math.abs(distance) < minDistance) return null;
  if (Math.abs(velocity) < minVelocity) return null;
  if (Math.sign(distance) !== Math.sign(velocity)) return null;
  if (horizontal) return distance < 0 ? "left" : "right";
  return distance < 0 ? "up" : "down";
}
