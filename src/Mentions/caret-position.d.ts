export type CaretCoordinates = {
  top: number;
  left: number;
  /** Line height at the caret. */
  height: number;
};

/**
 * The position of a character in a `<textarea>` or `<input>`, in CSS pixels
 * from the field's border box. Not corrected for the field's own scroll.
 * `null` outside a browser.
 */
export function getCaretCoordinates(
  field: HTMLTextAreaElement | HTMLInputElement,
  position: number,
): CaretCoordinates | null;

/** Remove the mirror built for `field`. */
export function disposeCaretMirror(
  field: HTMLTextAreaElement | HTMLInputElement,
): void;
