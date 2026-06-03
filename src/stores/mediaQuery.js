// @ts-check
import { readable } from "svelte/store";

/**
 * Create a readable store of whether a CSS media query currently matches.
 *
 * SSR-safe: the store holds `fallback` until it is subscribed to in a browser,
 * and the underlying `MediaQueryList` listener is removed when the last
 * subscriber unsubscribes.
 *
 * @param {string} query - A media query string (e.g. `"(min-width: 672px)"`).
 * @param {boolean} [fallback=false] - Value used before the query can be evaluated (SSR, no `matchMedia`).
 * @returns {import("svelte/store").Readable<boolean>}
 */
export function mediaQuery(query, fallback = false) {
  return readable(fallback, (set) => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    )
      return;

    const list = window.matchMedia(query);
    set(list.matches);

    /** @param {MediaQueryListEvent} event */
    function handleChange(event) {
      set(event.matches);
    }

    list.addEventListener("change", handleChange, { passive: true });
    return () => list.removeEventListener("change", handleChange);
  });
}

export default mediaQuery;
