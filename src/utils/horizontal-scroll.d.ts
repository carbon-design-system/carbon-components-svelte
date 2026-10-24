/**
 * Determine whether a horizontally scrollable element can still scroll
 * backward (toward the inline start) or forward from its current position.
 * `scrollLeft` is negative in an RTL element.
 */
export function computeScrollOverflow(options: {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
  forwardEpsilon?: number;
}): { canScrollBackward: boolean; canScrollForward: boolean };

/**
 * Scroll `node` by roughly 75% of its own width, toward its inline end (`1`)
 * or its inline start (`-1`).
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
