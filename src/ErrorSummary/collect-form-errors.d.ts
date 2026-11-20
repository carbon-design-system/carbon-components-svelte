/** An entry for `ErrorSummary`'s `errors`. */
export interface CollectedError {
  /** The id of the field's first control. */
  fieldId: string;
  /** The field's invalid message. */
  message: string;
}

/**
 * Collect the invalid fields of a form, in document order, as a list for
 * `ErrorSummary`: one entry per message, linking to the field's first
 * control.
 *
 * It reads what the fields already say to assistive technology: controls
 * with `aria-invalid="true"` and the message they name through
 * `aria-errormessage` or `aria-describedby`. A field that shares one message
 * between several controls (a slider's thumb and number input, the segments
 * of a pin code, the boxes of a checkbox group) is listed once, at its
 * first control. A field with no message is left out.
 *
 * Call it after the page shows the invalid state (`await tick()`), since it
 * reads the DOM.
 */
export function collectFormErrors(
  root: ParentNode | null | undefined,
): CollectedError[];
