/**
 * Creates a readable store that returns the current {@link BreakpointSize}.
 * It also provides functions for creating derived stores used to do comparisons.
 */
export function breakpointObserver(): {
    subscribe: (this: void, run: import("svelte/store").Subscriber<any>, invalidate?: (value?: any) => void) => import("svelte/store").Unsubscriber;
    /**
     * Returns a store readable store that returns whether the current
     * breakpoint is smaller than {@link size}.
     * @param {BreakpointSize} size Size to compare against.
     */
    smallerThan: (size: BreakpointSize) => import("svelte/store").Readable<boolean>;
    /**
     * Returns a store readable store that returns whether the current
     * breakpoint is larger than {@link size}.
     * @param {BreakpointSize} size Size to compare against.
     */
    largerThan: (size: BreakpointSize) => import("svelte/store").Readable<boolean>;
};
