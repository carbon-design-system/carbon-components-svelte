import type { Readable, Subscriber, Unsubscriber } from "svelte/store";
import type { BreakpointSize, BreakpointValue } from "./breakpoints";

/**
 * Creates a readable store that returns the current breakpoint size.
 * It also provides functions for creating derived stores used to do comparisons.
 */
export function breakpointObserver(): {
  subscribe: (
    this: void,
    run: Subscriber<any>,
    invalidate?: (value?: any) => void
  ) => Unsubscriber;
  /**
   * Returns a store readable store that returns whether the current
   * breakpoint is smaller than {@link size}.
   * @param {BreakpointSize} size Size to compare against.
   */
  smallerThan: (size: BreakpointSize) => Readable<boolean>;
  /**
   * Returns a store readable store that returns whether the current
   * breakpoint is larger than {@link size}.
   * @param {BreakpointSize} size Size to compare against.
   */
  largerThan: (size: BreakpointSize) => Readable<boolean>;
};

export default breakpointObserver;
