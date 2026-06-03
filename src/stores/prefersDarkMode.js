// @ts-check
import { mediaQuery } from "./mediaQuery.js";

/**
 * Readable store of the user's `(prefers-color-scheme: dark)` preference.
 * `true` when the OS/browser requests a dark color scheme.
 * @type {import("svelte/store").Readable<boolean>}
 */
export const prefersDarkMode = mediaQuery("(prefers-color-scheme: dark)");

export default prefersDarkMode;
