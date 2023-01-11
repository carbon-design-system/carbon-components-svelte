import { onMount } from "svelte";
import { derived, writable } from "svelte/store";
import { breakpoints } from "./breakpoints";

/**
 * Creates a readable store that returns the current breakpoint size.
 * It also provides functions for creating derived stores used to do comparisons.
 */
export function breakpointObserver() {
  const store = writable(undefined);

  onMount(() => {
    /** @type {Record<import("./breakpoints").BreakpointSize, MediaQueryList>} */
    const match = {
      sm: window.matchMedia(`(max-width: ${breakpoints.md}px)`),
      md: window.matchMedia(
        `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg}px)`
      ),
      lg: window.matchMedia(
        `(min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xlg}px)`
      ),
      xlg: window.matchMedia(
        `(min-width: ${breakpoints.xlg}px) and (max-width: ${breakpoints.max}px)`
      ),
      max: window.matchMedia(`(min-width: ${breakpoints.max}px)`),
    };
    const matchers = Object.entries(match);
    const sizeByMedia = Object.fromEntries(
      matchers.map(([size, queryList]) => [queryList.media, size])
    );

    const size = matchers.find(([size, queryList]) => queryList.matches)[0];
    store.set(size);

    /** @type {(e: MediaQueryListEvent) => void} */
    function handleChange({ matches, media }) {
      const size = sizeByMedia[media];
      if (matches) store.set(size);
    }

    matchers.forEach(([size, queryList]) =>
      queryList.addEventListener("change", handleChange)
    );

    return () => {
      matchers.forEach(([size, queryList]) =>
        queryList.removeEventListener("change", handleChange)
      );
    };
  });

  return {
    subscribe: store.subscribe,

    /**
     * Returns a store readable store that returns whether the current
     * breakpoint is smaller than {@link size}.
     * @param {import("./breakpoints").BreakpointSize} size Size to compare against.
     */
    smallerThan: (size) => {
      checkSizeValid(size);
      return derived(store, ($size) => breakpoints[$size] < breakpoints[size]);
    },

    /**
     * Returns a store readable store that returns whether the current
     * breakpoint is larger than {@link size}.
     * @param {import("./breakpoints").BreakpointSize} size Size to compare against.
     */
    largerThan: (size) => {
      checkSizeValid(size);
      return derived(store, ($size) => breakpoints[$size] > breakpoints[size]);
    },
  };
}

function checkSizeValid(size) {
  if (size in breakpoints == false)
    throw new Error(`"${size}" is not a valid breakpoint size.`);
}

export default breakpointObserver;
