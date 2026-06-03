import type { Readable } from "svelte/store";

/**
 * Readable store of the user's `(prefers-contrast: more)` preference.
 * `true` when the user has requested a higher-contrast presentation.
 */
export const prefersContrast: Readable<boolean>;

export default prefersContrast;
