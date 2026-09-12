import type { Readable, Subscriber, Unsubscriber } from "svelte/store";
import type { BreakpointSize } from "./breakpoints";

/**
 * Attaches `matchMedia` listeners for every breakpoint and invokes `callback`
 * with the current size immediately, then again on every subsequent change.
 * @param callback - Called with the current breakpoint size.
 * @returns Cleanup function that removes the listeners.
 */
export function observeBreakpoint(
  callback: (size: BreakpointSize) => void,
): () => void;

/**
 * Creates a readable store that returns the current breakpoint size.
 * It also provides functions for creating derived stores used to do comparisons.
 */
export function breakpointObserver(): {
  subscribe: (
    this: void,
    run: Subscriber<BreakpointSize | undefined>,
    invalidate?: (value?: BreakpointSize | undefined) => void,
  ) => Unsubscriber;
  /**
   * Returns a store readable store that returns whether the current
   * breakpoint is smaller than size.
   * @param size - Size to compare against.
   */
  smallerThan: (size: BreakpointSize) => Readable<boolean>;
  /**
   * Returns a store readable store that returns whether the current
   * breakpoint is larger than size.
   * @param size - Size to compare against.
   */
  largerThan: (size: BreakpointSize) => Readable<boolean>;
};

export default breakpointObserver;
