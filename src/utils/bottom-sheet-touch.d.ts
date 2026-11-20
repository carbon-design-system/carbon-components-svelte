/** Params for `sheetTouch`. */
export interface SheetTouchOptions {
  /** Set to `false` to ignore touches. */
  enabled?: boolean;
  /** Whether the sheet is at its tallest snap point. */
  atMax: () => boolean;
  /** The sheet claimed the gesture. */
  onStart: () => void;
  /** Finger travel in px since the claim; positive is down. */
  onMove: (travel: number, time: number) => void;
  /** The finger lifted, or the touch was cancelled. */
  onEnd: (time?: number) => void;
}

/** Shares a scrolling element's touches between the element and its sheet. */
export function sheetTouch(
  node: HTMLElement,
  options: SheetTouchOptions,
): { update: (options: SheetTouchOptions) => void; destroy: () => void };
