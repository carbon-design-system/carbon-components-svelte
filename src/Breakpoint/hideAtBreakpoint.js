// @ts-check

import { observeBreakpoint } from "./breakpointObserver";
import { breakpoints } from "./breakpoints";

/** @typedef {import("./breakpoints").BreakpointSize} BreakpointSize */

/**
 * Svelte action that hides the element when the current breakpoint is
 * larger than `above` or smaller than `below`.
 * @typedef {{ above?: BreakpointSize; below?: BreakpointSize }} HideAtBreakpointOptions
 * @type {(node: HTMLElement, options?: HideAtBreakpointOptions) => { update: (options?: HideAtBreakpointOptions) => void; destroy: () => void }}
 * @example
 * <div use:hideAtBreakpoint={{ above: "md" }}>Hidden at md and up</div>
 * <div use:hideAtBreakpoint={{ below: "lg" }}>Hidden below lg</div>
 */
export function hideAtBreakpoint(node, options = {}) {
  let { above, below } = options;

  /** @type {BreakpointSize | undefined} */
  let size;

  function updateVisibility() {
    if (size === undefined) return;
    const hidden =
      (above !== undefined && breakpoints[size] > breakpoints[above]) ||
      (below !== undefined && breakpoints[size] < breakpoints[below]);
    node.style.display = hidden ? "none" : "";
  }

  const cleanup = observeBreakpoint((newSize) => {
    size = newSize;
    updateVisibility();
  });

  return {
    update(newOptions = {}) {
      above = newOptions.above;
      below = newOptions.below;
      updateVisibility();
    },
    destroy: cleanup,
  };
}

export default hideAtBreakpoint;
