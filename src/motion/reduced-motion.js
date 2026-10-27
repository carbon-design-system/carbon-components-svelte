// @ts-check
import { readable } from "svelte/store";

const QUERY = "(prefers-reduced-motion: reduce)";

/** @returns {MediaQueryList | undefined} */
function queryList() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return undefined;
  return window.matchMedia(QUERY);
}

/**
 * Read the user's reduced-motion preference once. Always `false` on the
 * server. The transitions call this when they start, so a change mid-session
 * applies to the next one.
 * @returns {boolean}
 */
export function shouldReduceMotion() {
  return queryList()?.matches === true;
}

/**
 * The user's reduced-motion preference as a store. It holds one shared
 * `MediaQueryList` while anything subscribes and none otherwise, and stays
 * `false` on the server, where nothing subscribes to a query.
 * @type {import("svelte/store").Readable<boolean>}
 */
export const prefersReducedMotion = readable(false, (set) => {
  const list = queryList();
  if (!list) return;
  set(list.matches);
  /** @param {MediaQueryListEvent} event */
  const handleChange = (event) => set(event.matches);
  list.addEventListener("change", handleChange);
  return () => list.removeEventListener("change", handleChange);
});
