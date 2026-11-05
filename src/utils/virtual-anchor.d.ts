import type { VirtualAnchor } from "./auto-update.js";

/** An anchor at a point, in window coordinates. Moves with `move(x, y)`. */
export function pointAnchor(
  x: number,
  y: number,
): VirtualAnchor & { move: (x: number, y: number) => void };

/** An anchor on a text range. It reads the range's rect each time. */
export function rangeAnchor(
  range: Range,
  contextElement?: Element | null,
): VirtualAnchor;

/**
 * An anchor on the caret, or any character index, of an `<input>` or a
 * `<textarea>`. Call `destroy()` to remove its hidden copy of the text.
 */
export function caretAnchor(
  field: HTMLInputElement | HTMLTextAreaElement,
  getIndex?: () => number,
): VirtualAnchor & { destroy: () => void };
