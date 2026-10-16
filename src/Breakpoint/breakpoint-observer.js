// @ts-check
import { getContext, onMount } from "svelte";
import { derived, writable } from "svelte/store";
import { breakpoints } from "./breakpoints.js";

/** @typedef {import("./breakpoints").BreakpointSize} BreakpointSize */

/**
 * Context key for a width store that stands in for the window's, set by
 * `UIShellContainer` so breakpoints inside it follow the container.
 */
export const BREAKPOINT_WIDTH_CONTEXT = "carbon:BreakpointWidth";

/**
 * Attaches `matchMedia` listeners for every breakpoint and invokes `callback`
 * with the current size immediately, then again on every subsequent change.
 * Framework-agnostic (no `onMount`), so it can be called from a Svelte action
 * as well as from {@link breakpointObserver}.
 * @param {(size: BreakpointSize) => void} callback
 * @returns {() => void} Cleanup function that removes the listeners.
 */
export function observeBreakpoint(callback) {
  // `max-width` is inclusive, so each upper bound stops 0.02px short of the
  // next breakpoint (Carbon's `breakpoint-down`). Otherwise two lists match at
  // the boundary and the size sticks when only one of them flips.
  const below = (/** @type {number} */ px) => `(max-width: ${px - 0.02}px)`;

  /** @type {Record<BreakpointSize, MediaQueryList>} */
  const match = {
    sm: window.matchMedia(below(breakpoints.md)),
    md: window.matchMedia(
      `(min-width: ${breakpoints.md}px) and ${below(breakpoints.lg)}`,
    ),
    lg: window.matchMedia(
      `(min-width: ${breakpoints.lg}px) and ${below(breakpoints.xlg)}`,
    ),
    xlg: window.matchMedia(
      `(min-width: ${breakpoints.xlg}px) and ${below(breakpoints.max)}`,
    ),
    max: window.matchMedia(`(min-width: ${breakpoints.max}px)`),
  };
  const matchers = Object.entries(match);
  const sizeByMedia = /** @type {Record<string, BreakpointSize>} */ (
    Object.fromEntries(
      matchers.map(([size, queryList]) => [queryList.media, size]),
    )
  );

  const entry = matchers.find(([_size, queryList]) => queryList.matches);
  const size = entry?.[0];
  if (size !== undefined) callback(/** @type {BreakpointSize} */ (size));

  /** @type {(event: MediaQueryListEvent) => void} */
  function handleChange({ matches, media }) {
    const raw = sizeByMedia[media];
    if (matches && raw !== undefined) {
      callback(/** @type {BreakpointSize} */ (raw));
    }
  }

  for (const [_size, queryList] of matchers) {
    queryList.addEventListener("change", handleChange, { passive: true });
  }

  return () => {
    for (const [_size, queryList] of matchers) {
      queryList.removeEventListener("change", handleChange);
    }
  };
}

/**
 * The breakpoint size for a width in pixels, matching the media queries in
 * {@link observeBreakpoint}: a width on a boundary takes the smaller size.
 * @param {number} width
 * @returns {BreakpointSize}
 */
function breakpointForWidth(width) {
  if (width <= breakpoints.md) return "sm";
  if (width <= breakpoints.lg) return "md";
  if (width <= breakpoints.xlg) return "lg";
  if (width <= breakpoints.max) return "xlg";
  return "max";
}

/**
 * Creates a readable store that returns the current breakpoint size: the
 * window's, or inside a `UIShellContainer`, the container's. Call during
 * component initialization.
 * It also provides functions for creating derived stores used to do comparisons.
 */
export function breakpointObserver() {
  /** @type {import("svelte/store").Writable<BreakpointSize | undefined>} */
  const store = writable(undefined);

  /** @type {import("svelte/store").Readable<number | undefined> | undefined} */
  const containerWidth = getContext(BREAKPOINT_WIDTH_CONTEXT);

  onMount(() =>
    containerWidth
      ? containerWidth.subscribe((width) => {
          if (width !== undefined) store.set(breakpointForWidth(width));
        })
      : observeBreakpoint((size) => store.set(size)),
  );

  return {
    subscribe: store.subscribe,

    /**
     * Returns a store readable store that returns whether the current
     * breakpoint is smaller than {@link size}.
     * @param {BreakpointSize} size Size to compare against.
     */
    smallerThan: (size) => {
      checkSizeValid(size);
      return derived(store, ($size) =>
        $size === undefined ? false : breakpoints[$size] < breakpoints[size],
      );
    },

    /**
     * Returns a store readable store that returns whether the current
     * breakpoint is larger than {@link size}.
     * @param {BreakpointSize} size Size to compare against.
     */
    largerThan: (size) => {
      checkSizeValid(size);
      return derived(store, ($size) =>
        $size === undefined ? false : breakpoints[$size] > breakpoints[size],
      );
    },
  };
}

/**
 * @param {BreakpointSize} size
 */
function checkSizeValid(size) {
  if (size in breakpoints === false)
    throw new Error(`"${size}" is not a valid breakpoint size.`);
}
