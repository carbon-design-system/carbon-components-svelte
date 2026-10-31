// @ts-check
import { shouldReduceMotion } from "./reduced-motion.js";
import { duration, easing } from "./tokens.js";

/**
 * @typedef {import("./transitions.js").MotionParams} MotionParams
 * @typedef {import("./transitions.js").TransitionOptions} TransitionOptions
 * @typedef {"in" | "out" | "both"} Direction
 */

const hasOwn = Object.prototype.hasOwnProperty;
const LENGTH = /^(-?[\d.]+)([a-z%]*)$/;

/**
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
function toMs(value, fallback) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && hasOwn.call(duration, value)) {
    return duration[/** @type {keyof typeof duration} */ (value)];
  }
  return fallback;
}

/**
 * `in:` takes the entrance curve and `out:` the exit curve. A `transition:`
 * directive runs both ways and takes the standard curve: Svelte 3 and 4 pass
 * `"both"` for every run, and cannot resolve a config returned as a function
 * for a `transition:` (they run it after the outro group is gone and throw), so
 * the curve cannot depend on the way it runs.
 * @param {MotionParams["easing"]} value
 * @param {Direction} direction
 * @param {import("./tokens.js").MotionMode} mode
 * @returns {(t: number) => number}
 */
function toEasing(value, direction, mode) {
  if (typeof value === "function") return value;
  const name =
    typeof value === "string" && hasOwn.call(easing, value)
      ? /** @type {import("./tokens.js").EasingName} */ (value)
      : direction === "in"
        ? "entrance"
        : direction === "out"
          ? "exit"
          : "standard";
  return easing[name][mode];
}

/** @param {Pick<MotionParams, "reducedMotion">} params */
function isReduced(params) {
  return params.reducedMotion !== "ignore" && shouldReduceMotion();
}

/**
 * Wrap a transition body. Under reduced motion the config is exactly
 * `{ duration: 0 }`: no `css`, so Svelte 5 skips the Web Animations API and
 * Svelte 3 and 4 inject no keyframes.
 * @template {MotionParams} P
 * @param {number} defaultDuration
 * @param {(node: Element, params: P) => (t: number, u: number) => string} createCss
 */
function createTransition(defaultDuration, createCss) {
  /**
   * @param {Element} node
   * @param {P} [params]
   * @param {TransitionOptions} [options]
   */
  return function transition(
    node,
    params = /** @type {P} */ ({}),
    options = {},
  ) {
    if (isReduced(params)) return { duration: 0 };
    return {
      delay: params.delay ?? 0,
      duration: toMs(params.duration, defaultDuration),
      easing: toEasing(
        params.easing,
        options.direction ?? "both",
        params.mode ?? "productive",
      ),
      css: createCss(node, params),
    };
  };
}

/**
 * Shrink the box along one axis, so what follows closes the gap. Reads the
 * node once.
 * @param {Element} node
 * @param {"x" | "y"} axis
 * @returns {(t: number) => string}
 */
function createCollapse(node, axis) {
  const style = getComputedStyle(node);
  const size = axis === "y" ? "height" : "width";
  const [start, end] = axis === "y" ? ["top", "bottom"] : ["left", "right"];
  /** @param {string} property */
  const read = (property) =>
    Number.parseFloat(style.getPropertyValue(property)) || 0;
  const sides = [start, end].flatMap((side) => [
    [`padding-${side}`, read(`padding-${side}`)],
    [`margin-${side}`, read(`margin-${side}`)],
    [`border-${side}-width`, read(`border-${side}-width`)],
  ]);
  const sizeValue = read(size);

  return (t) =>
    `overflow: hidden;${size}: ${t * sizeValue}px;${sides
      .map(([property, value]) => `${property}: ${t * Number(value)}px;`)
      .join("")}`;
}

/**
 * @param {number | string | undefined} value
 * @returns {[number, string]}
 */
function splitUnit(value) {
  if (typeof value === "number") return [value, "px"];
  const match = LENGTH.exec(String(value ?? 0).trim());
  return match ? [Number.parseFloat(match[1]), match[2] || "px"] : [0, "px"];
}

/** Fade in and out. Defaults to `fast02`. */
export const fade = createTransition(duration.fast02, (node) => {
  const opacity = +getComputedStyle(node).opacity;
  return (t) => `opacity: ${t * opacity}`;
});

/**
 * Reveal and hide by animating the box along one axis, so what follows moves
 * with it. Defaults to `moderate02`.
 */
export const slide = createTransition(
  duration.moderate02,
  /** @param {Element} node @param {import("./transitions.js").SlideParams} params */
  (node, { axis = "y" }) => {
    const opacity = +getComputedStyle(node).opacity;
    const collapse = createCollapse(node, axis);
    return (t) => `opacity: ${Math.min(t * 20, 1) * opacity};${collapse(t)}`;
  },
);

/**
 * Move in from an offset while fading, and back out. `x` is physical and does
 * not flip in right-to-left layouts, like Svelte's. `collapse` also shrinks the
 * height, so the siblings below close the gap. Defaults to `moderate02`.
 */
export const fly = createTransition(
  duration.moderate02,
  /** @param {Element} node @param {import("./transitions.js").FlyParams} params */
  (node, { x = 0, y = 0, opacity = 0, collapse = false }) => {
    const style = getComputedStyle(node);
    const target = +style.opacity;
    const transform = style.transform === "none" ? "" : style.transform;
    const [xValue, xUnit] = splitUnit(x);
    const [yValue, yUnit] = splitUnit(y);
    const shrink = collapse ? createCollapse(node, "y") : undefined;
    return (t, u) =>
      `transform: ${transform} translate(${u * xValue}${xUnit}, ${u * yValue}${yUnit});` +
      `opacity: ${target - target * (1 - opacity) * u};` +
      (shrink?.(t) ?? "");
  },
);

/**
 * Animate a keyed `{#each}` item to its new position. Use with `animate:`.
 * Defaults to `moderate02`. `duration` can be a function of the distance
 * moved, in pixels.
 * @param {Element} node
 * @param {{ from: DOMRect; to: DOMRect }} rects
 * @param {import("./transitions.js").FlipParams} [params]
 */
export function flip(node, { from, to }, params = {}) {
  if (isReduced(params)) return { duration: 0 };

  const style = getComputedStyle(node);
  const transform = style.transform === "none" ? "" : style.transform;
  const [originX, originY] = style.transformOrigin
    .split(" ")
    .map(Number.parseFloat);
  const dx =
    from.left + (from.width * originX) / to.width - (to.left + originX);
  const dy =
    from.top + (from.height * originY) / to.height - (to.top + originY);
  const distance = Math.sqrt(dx * dx + dy * dy);

  return {
    delay: params.delay ?? 0,
    duration:
      typeof params.duration === "function"
        ? params.duration(distance)
        : toMs(params.duration, duration.moderate02),
    easing: toEasing(params.easing, "both", params.mode ?? "productive"),
    css: (/** @type {number} */ t, /** @type {number} */ u) =>
      `transform: ${transform} translate(${u * dx}px, ${u * dy}px) scale(${
        t + (u * from.width) / to.width
      }, ${t + (u * from.height) / to.height});`,
  };
}
