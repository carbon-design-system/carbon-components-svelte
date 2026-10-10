export type PointerDragOptions = {
  /** Pixels the pointer must move before a drag starts. @default 3 */
  threshold?: number;
  /** Mouse buttons that start a drag. @default [0] */
  buttons?: number[];
  /** Screen pixels per world unit, so deltas come out in world units. */
  scale?: () => number;
  /** Whether a press may start a drag, given where it landed. */
  accept?: (event: PointerEvent) => boolean;
  /** Called with the press that started the drag, once the threshold is passed. */
  onStart?: (event: PointerEvent) => void;
  /** Deltas since the last move, in world units. */
  onMove?: (dx: number, dy: number, event: PointerEvent) => void;
  onEnd?: (event: PointerEvent) => void;
};

/** Track a pointer drag on an element. Returns a function that stops. */
export function trackPointerDrag(
  node: HTMLElement | SVGElement,
  options: PointerDragOptions,
): () => void;
