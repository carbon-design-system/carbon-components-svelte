// @ts-check
import { cubicBezier } from "./cubic-bezier.js";

/**
 * Carbon's motion durations in milliseconds. Hand-defined, with no
 * `@carbon/motion` runtime dependency; `tests/motion/tokens.test.ts` keeps
 * them equal to the Sass the stylesheet uses.
 */
export const duration = Object.freeze({
  fast01: 70,
  fast02: 110,
  moderate01: 150,
  moderate02: 240,
  slow01: 400,
  slow02: 700,
});

/**
 * Control points of Carbon's easing curves, by name and mode.
 * @type {Record<import("./tokens.js").EasingName, Record<import("./tokens.js").MotionMode, [number, number, number, number]>>}
 */
const curves = {
  standard: {
    productive: [0.2, 0, 0.38, 0.9],
    expressive: [0.4, 0.14, 0.3, 1],
  },
  entrance: {
    productive: [0, 0, 0.38, 0.9],
    expressive: [0, 0, 0.3, 1],
  },
  exit: {
    productive: [0.2, 0, 1, 0.9],
    expressive: [0.4, 0.14, 1, 1],
  },
};

/**
 * @template T
 * @param {(points: [number, number, number, number]) => T} map
 * @returns {Record<import("./tokens.js").EasingName, Record<import("./tokens.js").MotionMode, T>>}
 */
function mapCurves(map) {
  /** @type {any} */
  const result = {};
  for (const [name, modes] of Object.entries(curves)) {
    result[name] = {
      productive: map(modes.productive),
      expressive: map(modes.expressive),
    };
  }
  return result;
}

/**
 * Carbon's easing curves as `(t) => progress` functions for Svelte
 * transitions: `easing[name][mode]`.
 */
export const easing = mapCurves((points) => cubicBezier(...points));

/**
 * The same curves as CSS `cubic-bezier()` strings, for the Web Animations
 * API and inline styles.
 */
export const easingCss = mapCurves(
  ([x1, y1, x2, y2]) => `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`,
);

/**
 * Get the CSS timing function for an easing and motion mode. Mirrors the
 * Sass `motion()` function.
 * @param {import("./tokens.js").EasingName} [name]
 * @param {import("./tokens.js").MotionMode} [mode]
 * @returns {string}
 */
export function motion(name = "standard", mode = "productive") {
  const css = easingCss[name]?.[mode];
  if (css === undefined) {
    throw new TypeError(`Unknown motion easing "${name}" in mode "${mode}"`);
  }
  return css;
}
