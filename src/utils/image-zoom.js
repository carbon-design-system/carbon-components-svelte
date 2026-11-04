// @ts-check

/**
 * Pure math for zooming and panning an image inside a frame. A view is the
 * image's scale (CSS pixels per image pixel, so 1 is 100%) and the offset of
 * its top-left corner from the frame's, in CSS pixels.
 *
 * @typedef {{ width: number; height: number }} Size
 * @typedef {{ scale: number; x: number; y: number }} View
 * @typedef {{ x: number; y: number }} Point
 */

/** How far above the fit scale a view counts as zoomed. */
const ZOOMED_EPSILON = 0.005;

/** CSS pixels per line and per page for `WheelEvent.deltaMode` 1 and 2. */
const LINE_PX = 16;
const PAGE_PX = 400;

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * The scale at which the whole image fits the frame, capped so a small
 * image is not enlarged.
 * @param {Size} frame
 * @param {Size} natural
 * @param {number} [cap]
 * @returns {number}
 */
export function fitScale(frame, natural, cap = 1) {
  if (
    !(frame.width > 0 && frame.height > 0) ||
    !(natural.width > 0 && natural.height > 0)
  ) {
    return 1;
  }
  return Math.min(
    cap,
    frame.width / natural.width,
    frame.height / natural.height,
  );
}

/**
 * Keep one axis of the image inside the frame. An image smaller than the
 * frame on this axis is centered.
 * @param {number} offset
 * @param {number} content
 * @param {number} frame
 * @returns {number}
 */
export function clampAxis(offset, content, frame) {
  if (content <= frame) return (frame - content) / 2;
  return clamp(offset, frame - content, 0);
}

/**
 * @param {View} view
 * @param {Size} natural
 * @param {Size} frame
 * @returns {View}
 */
export function clampView(view, natural, frame) {
  return {
    scale: view.scale,
    x: clampAxis(view.x, natural.width * view.scale, frame.width),
    y: clampAxis(view.y, natural.height * view.scale, frame.height),
  };
}

/**
 * @param {number} scale
 * @param {Size} natural
 * @param {Size} frame
 * @returns {View}
 */
export function centeredView(scale, natural, frame) {
  return clampView({ scale, x: 0, y: 0 }, natural, frame);
}

/**
 * Change the scale so the image point under `anchor` stays under it.
 * @param {View} view
 * @param {number} scale
 * @param {Point} anchor A point in the frame's coordinates.
 * @param {Size} natural
 * @param {Size} frame
 * @param {{ min: number; max: number }} bounds
 * @returns {View}
 */
export function zoomAt(view, scale, anchor, natural, frame, bounds) {
  const next = clamp(scale, bounds.min, Math.max(bounds.min, bounds.max));
  const ratio = next / view.scale;
  return clampView(
    {
      scale: next,
      x: anchor.x - (anchor.x - view.x) * ratio,
      y: anchor.y - (anchor.y - view.y) * ratio,
    },
    natural,
    frame,
  );
}

/**
 * Move the image by a distance, held inside the frame.
 * @param {View} view
 * @param {number} dx
 * @param {number} dy
 * @param {Size} natural
 * @param {Size} frame
 * @returns {View}
 */
export function panBy(view, dx, dy, natural, frame) {
  return clampView(
    { scale: view.scale, x: view.x + dx, y: view.y + dy },
    natural,
    frame,
  );
}

/**
 * @param {number} scale
 * @param {number} fit
 * @returns {boolean}
 */
export function isZoomed(scale, fit) {
  return scale > fit * (1 + ZOOMED_EPSILON);
}

/**
 * The scale one zoom step away.
 * @param {number} scale
 * @param {1 | -1} direction
 * @param {number} step The factor of one step, above 1.
 * @param {{ min: number; max: number }} bounds
 * @returns {number}
 */
export function stepScale(scale, direction, step, bounds) {
  const next = direction > 0 ? scale * step : scale / step;
  return clamp(next, bounds.min, Math.max(bounds.min, bounds.max));
}

/**
 * Where a double-click or double-tap goes: back to fit from a zoomed view,
 * else to the image's actual size (100%), or twice the fit scale when the
 * image is already about that size.
 * @param {number} scale
 * @param {number} fit
 * @param {number} max
 * @returns {number}
 */
export function toggleScale(scale, fit, max) {
  if (isZoomed(scale, fit)) return fit;
  const target = fit <= 0.5 ? 1 : Math.max(1, fit * 2);
  return clamp(target, fit, Math.max(fit, max));
}

/**
 * The factor a wheel event scales by. A pinch on a trackpad arrives as a
 * wheel event with `ctrlKey` and small deltas, so it is more sensitive.
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
 * @param {Point} a
 * @param {Point} b
 * @returns {{ distance: number; midpoint: Point }}
 */
export function pinchGeometry(a, b) {
  return {
    distance: Math.hypot(b.x - a.x, b.y - a.y),
    midpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
  };
}

/**
 * Whether a tap follows another closely enough in time and place to be a
 * double tap.
 * @param {{ x: number; y: number; time: number } | null} previous
 * @param {{ x: number; y: number; time: number }} tap
 * @param {{ delay?: number; distance?: number }} [limits]
 * @returns {boolean}
 */
export function isDoubleTap(previous, tap, limits = {}) {
  const { delay = 300, distance = 30 } = limits;
  return (
    previous !== null &&
    tap.time - previous.time <= delay &&
    Math.hypot(tap.x - previous.x, tap.y - previous.y) <= distance
  );
}

/**
 * Track recent pointer positions to find the velocity a drag was released
 * with, in CSS pixels per millisecond.
 * @param {number} [windowMs]
 */
export function createVelocityTracker(windowMs = 100) {
  /** @type {Array<{ x: number; y: number; time: number }>} */
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

/** Time constant of inertia's exponential decay, in milliseconds. */
const INERTIA_TIME_CONSTANT = 325;

/** Speed under which inertia stops, in CSS pixels per millisecond. */
export const INERTIA_MIN_SPEED = 0.02;

/**
 * Advance a release by `dt` milliseconds with exponential decay: the
 * distance travelled and the velocity left.
 * @param {Point} velocity
 * @param {number} dt
 * @returns {{ dx: number; dy: number; velocity: Point }}
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
