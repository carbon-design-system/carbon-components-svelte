// @ts-check
import { fly } from "../motion/transitions.js";

/** Pixels a menu travels as it opens or closes. */
const TRAVEL = 2;

/**
 * Carbon's menu motion: `fly` that moves 2 px along the axis the menu opens
 * on, toward its open edge, and flips with the side it opened on. A menu's
 * `data-floating-menu-direction` names that side.
 * @param {Element} node
 * @param {import("../motion/transitions.js").FlyParams} [params]
 * @param {import("../motion/transitions.js").TransitionOptions} [options]
 */
export function menuFly(node, params = {}, options = {}) {
  const side = node.getAttribute("data-floating-menu-direction");
  const offset = side === "top" || side === "left" ? -TRAVEL : TRAVEL;
  const axis = side === "left" || side === "right" ? "x" : "y";
  return fly(node, { opacity: 0, [axis]: offset, ...params }, options);
}

/** The preset a menu's `transition` prop resolves against. */
export const menuPreset = {
  fn: menuFly,
  params: /** @type {import("../motion/transitions.js").FlyParams} */ ({
    duration: "fast01",
  }),
};

// Svelte 5 makes an element inert while it leaves; Svelte 3 and 4 do not. A
// reopen during the exit brings the menu back, so it is live again on intro.

/** @param {Event} event */
export function makeInert(event) {
  /** @type {HTMLElement} */ (event.currentTarget).inert = true;
}

/** @param {Event} event */
export function makeLive(event) {
  /** @type {HTMLElement} */ (event.currentTarget).inert = false;
}
