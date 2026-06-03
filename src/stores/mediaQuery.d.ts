import type { Readable } from "svelte/store";

/**
 * Create a readable store of whether a CSS media query currently matches.
 *
 * SSR-safe: the store holds `fallback` until it is subscribed to in a browser,
 * and the underlying `MediaQueryList` listener is removed when the last
 * subscriber unsubscribes.
 *
 * @param query A media query string (e.g. `"(min-width: 672px)"`).
 * @param fallback Value used before the query can be evaluated (SSR, no `matchMedia`).
 */
export function mediaQuery(
  query: string,
  fallback?: boolean,
): Readable<boolean>;

export default mediaQuery;
