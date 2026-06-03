// @ts-check
import { mediaQuery } from "./mediaQuery.js";

/**
 * Readable store of the user's `(prefers-contrast: more)` preference.
 * `true` when the user has requested a higher-contrast presentation.
 * @type {import("svelte/store").Readable<boolean>}
 */
export const prefersContrast = mediaQuery("(prefers-contrast: more)");

export default prefersContrast;
