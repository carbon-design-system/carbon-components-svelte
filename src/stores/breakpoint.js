// @ts-check
import { readable } from "svelte/store";
import { breakpoints } from "../Breakpoint/breakpoints.js";

/** @typedef {import("../Breakpoint/breakpoints.js").BreakpointSize} BreakpointSize */

/**
 * Readable store of the current Carbon grid breakpoint size, or `undefined`
 * before it can be evaluated (SSR, no `matchMedia`).
 *
 * A lightweight counterpart to `breakpointObserver`: it exposes just the
 * current size as a store, without the `smallerThan`/`largerThan` helpers.
 * Listeners are removed when the last subscriber unsubscribes.
 *
 * @type {import("svelte/store").Readable<BreakpointSize | undefined>}
 */
export const breakpoint = readable(
  /** @type {BreakpointSize | undefined} */ (undefined),
  (set) => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    )
      return;

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

    const matchers = /** @type {[BreakpointSize, MediaQueryList][]} */ (
      Object.entries(match)
    );
    /** @type {Record<string, BreakpointSize>} */
    const sizeByMedia = Object.fromEntries(
      matchers.map(([size, queryList]) => [queryList.media, size]),
    );

    const current = matchers.find(([, queryList]) => queryList.matches);
    if (current !== undefined) set(current[0]);

    /** @param {MediaQueryListEvent} event */
    function handleChange({ matches, media }) {
      const size = sizeByMedia[media];
      if (matches && size !== undefined) set(size);
    }

    for (const [, queryList] of matchers) {
      queryList.addEventListener("change", handleChange, { passive: true });
    }

    return () => {
      for (const [, queryList] of matchers) {
        queryList.removeEventListener("change", handleChange);
      }
    };
  },
);

export default breakpoint;
