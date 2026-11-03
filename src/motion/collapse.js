// @ts-check
import { shouldReduceMotion } from "./reduced-motion.js";
import { duration as durations, easingCss } from "./tokens.js";

/**
 * @typedef {import("./collapse").CollapseOptions} CollapseOptions
 */

/** Properties that shrink to zero when collapsed. */
const PROPERTIES = /** @type {const} */ ([
  "height",
  "paddingTop",
  "paddingBottom",
]);

/**
 * @param {boolean | CollapseOptions | undefined} options
 * @returns {CollapseOptions}
 */
function normalize(options) {
  return typeof options === "boolean" ? { open: options } : (options ?? {});
}

/**
 * The element's current size, including a size an animation in progress
 * has reached.
 * @param {HTMLElement} node
 * @returns {Record<(typeof PROPERTIES)[number], string>}
 */
function readSize(node) {
  const style = getComputedStyle(node);
  return {
    height: style.height,
    paddingTop: style.paddingTop,
    paddingBottom: style.paddingBottom,
  };
}

/**
 * Svelte action that expands and collapses an element that stays mounted,
 * such as a disclosure's content or a side nav submenu, with Carbon motion.
 * Pass `open` as a boolean or in an options object. It animates `height`
 * and the vertical padding of the element alone, the one element that
 * expands, with the `entrance` curve on open and the `exit` curve on close.
 * While closed the element is `inert` and `visibility: hidden`, so it takes
 * no focus and is hidden from assistive technology; while it animates,
 * `max-height` is `none` and `visibility` is `visible`, so a stylesheet
 * that hides the closed state does not cut the motion short. A toggle
 * during a toggle starts from the size reached so far. Under
 * `prefers-reduced-motion: reduce` the element jumps between states.
 * @param {HTMLElement} node
 * @param {boolean | CollapseOptions} [options]
 */
export function collapse(node, options) {
  let settings = normalize(options);
  let open = settings.open ?? true;
  /** @type {Animation | undefined} */
  let animation;

  /** The resting styles of a state, with no animation. */
  /** @param {boolean} value */
  function rest(value) {
    for (const property of PROPERTIES) {
      node.style[property] = value ? "" : "0px";
    }
    node.style.overflow = value ? "" : "hidden";
    node.style.visibility = value ? "" : "hidden";
    node.style.maxHeight = "";
    node.inert = !value;
  }

  /** @param {boolean} value */
  function toggle(value) {
    // Start from the current size, even partway through a previous toggle.
    const from = readSize(node);
    animation?.cancel();
    animation = undefined;

    const skip =
      typeof node.animate !== "function" ||
      (settings.reducedMotion !== "ignore" && shouldReduceMotion());
    if (skip) {
      rest(value);
      return;
    }

    // Lift the stylesheet's closed state for the duration of the motion.
    node.inert = !value;
    node.style.visibility = "visible";
    node.style.maxHeight = "none";
    node.style.overflow = "hidden";
    for (const property of PROPERTIES) node.style[property] = "";
    const to = value ? readSize(node) : { ...from };
    if (!value) for (const property of PROPERTIES) to[property] = "0px";
    const duration =
      typeof settings.duration === "string"
        ? durations[settings.duration]
        : (settings.duration ?? durations.moderate02);
    const running = node.animate([from, to], {
      duration,
      easing:
        easingCss[value ? "entrance" : "exit"][settings.mode ?? "productive"],
    });
    animation = running;
    // `onfinish` does not fire for a cancelled animation, so a toggle
    // during a toggle never settles the wrong state.
    running.onfinish = () => {
      if (animation !== running) return;
      animation = undefined;
      rest(value);
    };
  }

  if (!open) rest(false);

  return {
    /** @param {boolean | CollapseOptions} [nextOptions] */
    update(nextOptions) {
      settings = normalize(nextOptions);
      const next = settings.open ?? true;
      if (next !== open) {
        open = next;
        toggle(open);
      }
    },
    destroy() {
      animation?.cancel();
    },
  };
}
