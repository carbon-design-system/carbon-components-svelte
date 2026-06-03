import type { Readable } from "svelte/store";

/**
 * Readable store of the user's `(prefers-color-scheme: dark)` preference.
 * `true` when the OS/browser requests a dark color scheme.
 */
export const prefersDarkMode: Readable<boolean>;

export default prefersDarkMode;
