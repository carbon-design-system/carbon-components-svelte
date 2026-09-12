/**
 * True when `(mouseX, mouseY)` falls within the buffered triangle connecting
 * `anchorRect`'s facing edge to `floatingRect`'s facing edge. Lets the
 * pointer travel diagonally from a trigger toward its submenu/popover
 * without it closing mid-crossing.
 */
export function isInSafeTriangle(
  mouseX: number,
  mouseY: number,
  anchorRect: { top: number; right: number; bottom: number; left: number },
  floatingRect: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    height: number;
  },
  buffer?: number,
): boolean;
