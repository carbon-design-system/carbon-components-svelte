import browserslist from "browserslist";
import { browserslistToTargets } from "lightningcss";

// Svelte 5 minimum browsers — https://svelte.dev/docs/svelte/browser-support
// Safari bumped to 14.1 (not Svelte's documented 14.0 floor): unprefixed
// `:is()` shipped in 14.1, so targeting 14.0 makes lightningcss duplicate
// every `:is()` selector list with a `:-webkit-any()` fallback, bloating
// the themed CSS output by ~6%. Safari 14.0 shipped Sept 2020 and was
// superseded by 14.1 in Apr 2021.
export const BROWSERSLIST = [
  "Chrome >= 87",
  "Firefox >= 83",
  "Safari >= 14.1",
  "Edge >= 87",
] as const;

export const targets = browserslistToTargets(browserslist([...BROWSERSLIST]));
