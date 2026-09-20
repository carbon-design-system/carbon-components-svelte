/**
 * Determine whether a horizontally scrollable element can still scroll
 * backward/forward from its current position.
 */
export function computeScrollOverflow(options: {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
  forwardEpsilon?: number;
}): { canScrollBackward: boolean; canScrollForward: boolean };

/**
 * Scroll `node` by roughly 75% of its own width, in the given direction.
 */
export function scrollByViewport(
  node: HTMLElement | null | undefined,
  direction: 1 | -1,
): void;

/**
 * Scroll `container` horizontally so `target` is fully visible, inset from
 * each edge by `margin` so it isn't tucked under an overflow button.
 */
export function scrollIntoViewX(
  container: HTMLElement | null | undefined,
  target: HTMLElement | null | undefined,
  margin?: number,
): void;
