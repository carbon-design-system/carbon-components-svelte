/** Params for `pointerDrag`. */
export interface PointerDragOptions {
  /** Set to `false` to ignore new drags. An active drag still ends normally. */
  enabled?: boolean;
  /** Called on the primary-button `pointerdown`. Return `false` to decline the drag. */
  onStart?: (event: PointerEvent) => unknown;
  /** Called for each `pointermove` of the active pointer. */
  onMove?: (event: PointerEvent) => void;
  /** Called once when the active pointer is released, cancelled, or loses capture. */
  onEnd?: (event: PointerEvent) => void;
}

/** Tracks one pointer drag that starts on `node`, using pointer capture. */
export function pointerDrag(
  node: HTMLElement,
  options: PointerDragOptions,
): { update: (options: PointerDragOptions) => void; destroy: () => void };
