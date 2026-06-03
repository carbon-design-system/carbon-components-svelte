// @ts-check
import { mediaQuery } from "./mediaQuery.js";

/**
 * Readable store of the user's `(prefers-reduced-motion: reduce)` preference.
 * `true` when the user has requested reduced motion; gate animations on it.
 * @type {import("svelte/store").Readable<boolean>}
 */
export const prefersReducedMotion = mediaQuery(
  "(prefers-reduced-motion: reduce)",
);

export default prefersReducedMotion;
