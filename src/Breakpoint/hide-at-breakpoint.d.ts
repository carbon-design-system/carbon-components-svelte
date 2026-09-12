import type { BreakpointSize } from "./breakpoints";

export interface HideAtBreakpointOptions {
  /** Hide the element when the current breakpoint is larger than this size. */
  above?: BreakpointSize;
  /** Hide the element when the current breakpoint is smaller than this size. */
  below?: BreakpointSize;
}

/**
 * Svelte action that hides the element when the current breakpoint is
 * larger than `above` or smaller than `below`.
 * @param node - The element to toggle visibility on
 * @param options - Upper/lower breakpoint bounds
 */
export function hideAtBreakpoint(
  node: HTMLElement,
  options?: HideAtBreakpointOptions,
): {
  update: (options?: HideAtBreakpointOptions) => void;
  destroy: () => void;
};

export default hideAtBreakpoint;
