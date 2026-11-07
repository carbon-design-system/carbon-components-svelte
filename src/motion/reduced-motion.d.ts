import type { Readable } from "svelte/store";

/**
 * The user's `prefers-reduced-motion: reduce` setting as a store. `false` on
 * the server.
 */
export const prefersReducedMotion: Readable<boolean>;

/** Read the `prefers-reduced-motion: reduce` setting now. `false` on the server. */
export function shouldReduceMotion(): boolean;
