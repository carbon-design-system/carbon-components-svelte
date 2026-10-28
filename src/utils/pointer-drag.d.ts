/** Params for `pointerDrag`. */
export interface PointerDragOptions {
  /** Set to `false` to ignore new drags. An active drag still ends normally. */
  enabled?: boolean;
  /**
   * When the node captures the pointer.
   * - `"press"` captures on `pointerdown`, so the drag starts at once. The
   *   `click` that follows is retargeted to the node, so a link or button
   *   inside it stops working.
   * - `"drag"` waits until the pointer moves `threshold` pixels. A press that
   *   stays under it is an ordinary click on the element under the pointer,
   *   and a drag swallows the click that follows it.
   * @default "press"
   */
  capture?: "press" | "drag";
  /**
   * Pixels the pointer must travel before `capture: "drag"` starts the drag.
   * Ignored when `capture` is `"press"`.
   * @default 4
   */
  threshold?: number;
  /** Called on the primary-button `pointerdown`. Return `false` to decline the drag. */
  onStart?: (event: PointerEvent) => unknown;
  /**
   * Called once when the drag becomes active, with the event that started it:
   * the `pointerdown` for `capture: "press"`, the first `pointermove` past the
   * threshold for `capture: "drag"`.
   */
  onDragStart?: (event: PointerEvent) => void;
  /**
   * Called for each `pointermove` of the active pointer. With
   * `capture: "drag"` the first call is the move that crossed the threshold.
   */
  onMove?: (event: PointerEvent) => void;
  /**
   * Called once when the active pointer is released, cancelled, or loses
   * capture. `dragged` is `false` when `capture: "drag"` ended before the
   * threshold, which was a click, not a drag.
   */
  onEnd?: (event: PointerEvent, dragged: boolean) => void;
}

/** Tracks one pointer drag that starts on `node`, using pointer capture. */
export function pointerDrag(
  node: HTMLElement,
  options: PointerDragOptions,
): { update: (options: PointerDragOptions) => void; destroy: () => void };
