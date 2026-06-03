import type { Readable } from "svelte/store";
import type { BreakpointSize } from "../Breakpoint/breakpoints.js";

export type { BreakpointSize };

/**
 * Readable store of the current Carbon grid breakpoint size, or `undefined`
 * before it can be evaluated (SSR, no `matchMedia`).
 *
 * A lightweight counterpart to `breakpointObserver`: it exposes just the
 * current size as a store, without the `smallerThan`/`largerThan` helpers.
 * Listeners are removed when the last subscriber unsubscribes.
 */
export const breakpoint: Readable<BreakpointSize | undefined>;

export default breakpoint;
