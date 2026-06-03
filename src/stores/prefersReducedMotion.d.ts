import type { Readable } from "svelte/store";

/**
 * Readable store of the user's `(prefers-reduced-motion: reduce)` preference.
 * `true` when the user has requested reduced motion; gate animations on it.
 */
export const prefersReducedMotion: Readable<boolean>;

export default prefersReducedMotion;
