import { onMount } from "svelte";
import { derived, writable } from "svelte/store";
import { breakpoints } from "./breakpoints";

/** @typedef {import("./breakpoints").BreakpointSize} BreakpointSize */

/**
 * Creates a readable store that returns the current breakpoint size.
 * It also provides functions for creating derived stores used to do comparisons.
 */
export function breakpointObserver() {
  /** @type {import("svelte/store").Writable<BreakpointSize | undefined>} */
  const store = writable(undefined);

  onMount(() => {
    /** @type {Record<BreakpointSize, MediaQueryList>} */
    const match = {
      sm: window.matchMedia(`(max-width: ${breakpoints.md}px)`),
      md: window.matchMedia(
        `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg}px)`,
      ),
      lg: window.matchMedia(
        `(min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xlg}px)`,
      ),
      xlg: window.matchMedia(
        `(min-width: ${breakpoints.xlg}px) and (max-width: ${breakpoints.max}px)`,
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
    if (size !== undefined) store.set(/** @type {BreakpointSize} */ (size));

    /** @type {(e: MediaQueryListEvent) => void} */
    function handleChange({ matches, media }) {
      const raw = sizeByMedia[media];
      if (matches && raw !== undefined) {
        const size = /** @type {BreakpointSize} */ (raw);
        store.set(size);
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
  });

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
        $size !== undefined ? breakpoints[$size] < breakpoints[size] : false,
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
        $size !== undefined ? breakpoints[$size] > breakpoints[size] : false,
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

export default breakpointObserver;
