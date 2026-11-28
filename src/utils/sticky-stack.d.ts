/**
 * The element `node` sticks within: its nearest ancestor that clips
 * overflow, or the root element when the page scrolls.
 */
export function stickyContainer(node: HTMLElement): HTMLElement;

/**
 * Add a top-edge sticky element to the stack of its scroll container. A
 * stacked entry sticks below the UI Shell `Header` (when the page scrolls)
 * and below every entry before it. The container publishes the bottom of
 * the lowest entry as `--ccs-sticky-offset`, in pixels, while it holds a
 * stacked entry.
 */
export function joinStack(
  node: HTMLElement,
  stacked: boolean,
  onTop: (top: number) => void,
): { update: (stacked: boolean) => void; leave: () => void };
