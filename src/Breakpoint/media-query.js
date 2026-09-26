// @ts-check
import { derived, readable } from "svelte/store";

/**
 * @typedef {Object} MediaQueryOptions
 * @property {boolean} [fallback] Value the store holds until the first
 *   evaluation, and permanently when `matchMedia` is unavailable (SSR,
 *   old test runners). Defaults to `undefined`.
 */

/**
 * Framework-agnostic: evaluates `query` once, calls `callback(matches)`
 * immediately, then again on every change. Returns a cleanup function.
 * Returns a no-op cleanup without calling `callback` when `window` or
 * `window.matchMedia` is missing.
 * @param {string} query
 * @param {(matches: boolean) => void} callback
 * @returns {() => void}
 */
export function observeMediaQuery(query, callback) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return () => {};

  const queryList = window.matchMedia(query);
  callback(queryList.matches);

  /** @type {(event: MediaQueryListEvent) => void} */
  function handleChange(event) {
    callback(event.matches);
  }

  queryList.addEventListener("change", handleChange, { passive: true });

  return () => {
    queryList.removeEventListener("change", handleChange);
  };
}

/**
 * Readable store of whether `query` currently matches.
 *
 * Unlike `breakpointObserver`, this can be created at module scope: the
 * `readable` start function only runs when the first subscriber attaches and
 * its cleanup runs when the last one leaves, so there is no need for
 * `onMount` to time the `matchMedia` call to component initialization.
 * @param {string} query
 * @param {MediaQueryOptions} [options]
 * @returns {import("svelte/store").Readable<boolean | undefined>}
 */
export function mediaQuery(query, options = {}) {
  const { fallback } = options;

  return readable(fallback, (set) => observeMediaQuery(query, set));
}

/** `(prefers-reduced-motion: reduce)` */
export function prefersReducedMotion(options = {}) {
  return mediaQuery("(prefers-reduced-motion: reduce)", options);
}

/**
 * Readable of `"dark" | "light" | undefined` from `(prefers-color-scheme: dark)`.
 * @param {{ fallback?: "dark" | "light" }} [options]
 */
export function prefersColorScheme(options = {}) {
  const { fallback } = options;

  const matches = mediaQuery("(prefers-color-scheme: dark)", {
    fallback: fallback === "dark",
  });

  return derived(matches, ($matches) =>
    $matches === undefined ? undefined : $matches ? "dark" : "light",
  );
}

/**
 * Readable of `"portrait" | "landscape" | undefined` from `(orientation: portrait)`.
 * @param {{ fallback?: "portrait" | "landscape" }} [options]
 */
export function orientation(options = {}) {
  const { fallback } = options;

  const matches = mediaQuery("(orientation: portrait)", {
    fallback: fallback === "portrait",
  });

  return derived(matches, ($matches) =>
    $matches === undefined ? undefined : $matches ? "portrait" : "landscape",
  );
}
