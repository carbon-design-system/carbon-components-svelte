export type Box = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/**
 * How far to scroll so a focused element clears what sticks over the scroll
 * region. `cover` is how far the pinned columns and the sticky header reach
 * in from each physical edge. A pinned element never scrolls horizontally.
 */
export function computeReveal(
  box: Box,
  port: Box,
  cover: { left: number; right: number; top: number },
  pinned?: boolean,
): { dx: number; dy: number };

/**
 * Scroll a focused element in a table body out from under the pinned
 * columns and the sticky header.
 */
export function revealFocus(target: EventTarget | null): void;
