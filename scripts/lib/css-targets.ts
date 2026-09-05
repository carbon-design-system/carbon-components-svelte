import browserslist from "browserslist";
import { browserslistToTargets } from "lightningcss";

// Svelte 5 minimum browsers — https://svelte.dev/docs/svelte/browser-support
export const BROWSERSLIST = [
  "Chrome >= 87",
  "Firefox >= 83",
  "Safari >= 14",
  "Edge >= 87",
] as const;

export const targets = browserslistToTargets(browserslist([...BROWSERSLIST]));
