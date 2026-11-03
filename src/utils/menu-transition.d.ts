import type { TransitionConfig } from "svelte/transition";
import type { FlyParams, TransitionOptions } from "../motion/transitions.js";

/**
 * Carbon's menu motion: `fly` that moves 2 px along the axis the menu opens
 * on, toward its open edge, and flips with the side it opened on. A menu's
 * `data-floating-menu-direction` names that side.
 */
export function menuFly(
  node: Element,
  params?: FlyParams,
  options?: TransitionOptions,
): TransitionConfig;

/** The preset a menu's `transition` prop resolves against. */
export const menuPreset: {
  fn: typeof menuFly;
  params: FlyParams;
};

export function makeInert(event: Event): void;

export function makeLive(event: Event): void;
