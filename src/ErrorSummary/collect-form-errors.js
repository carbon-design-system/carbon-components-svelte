// @ts-check
import { resolveControl } from "./focus-field.js";

/**
 * @typedef {{ fieldId: string; message: string }} CollectedError
 */

const WHITESPACE = /\s+/;
const CHOICE = 'input[type="radio"], input[type="checkbox"]';
const GROUP = 'fieldset, [role="radiogroup"], [role="group"]';

/**
 * The element that holds the invalid message for `element`, which sets
 * `aria-invalid="true"` (or, for a group, holds the controls that do).
 *
 * Fields point at their message with `aria-errormessage` or, for those that
 * name it as a description, `aria-describedby`; a group (radios, checkboxes)
 * keeps the message on the fieldset or inside it.
 * @param {HTMLElement} element
 * @returns {HTMLElement | null}
 */
function messageFor(element) {
  const doc = element.ownerDocument;
  /** @param {Element | null} node */
  const messageIn = (node) => {
    if (!node) return null;
    for (const attribute of ["aria-errormessage", "aria-describedby"]) {
      for (const id of node.getAttribute(attribute)?.split(WHITESPACE) ?? []) {
        const message = id ? doc.getElementById(id) : null;
        if (message && isInvalidMessage(message)) return message;
      }
    }
    return null;
  };

  const own = messageIn(element);
  if (own) return own;

  // Only a group, or one of its radios or checkboxes, shares the group's
  // message. A text field in a fieldset with other fields does not.
  const group = element.closest(GROUP);
  if (!group || !(group === element || element.matches(CHOICE))) {
    return null;
  }
  const grouped = group === element ? null : messageIn(group);
  if (grouped) return grouped;

  // A radio group names its message from each radio, not the fieldset.
  const inside = group.querySelector(
    '[role="alert"], .bx--form-requirement--invalid',
  );
  if (inside && !inside.closest("label")) {
    return /** @type {HTMLElement} */ (inside);
  }
  return messageIn(group.querySelector("input"));
}

/**
 * Whether a described-by target reads as an error, not helper text. The
 * library's messages are `role="alert"`, except InlineEdit's warning text.
 * @param {Element} element
 */
function isInvalidMessage(element) {
  return (
    element.getAttribute("role") === "alert" ||
    element.matches(
      '.bx--form-requirement--invalid, [class*="--invalid"], [class*="warning-text"]',
    )
  );
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
 *
 * @param {ParentNode | null | undefined} root - Usually the form element.
 * @returns {CollectedError[]}
 */
export function collectFormErrors(root) {
  if (!root) return [];
  /** @type {CollectedError[]} */
  const errors = [];
  const seen = new Set();

  for (const node of root.querySelectorAll('[aria-invalid="true"]')) {
    const element = /** @type {HTMLElement} */ (node);
    if (element.matches(":disabled") || element.closest("[hidden], [inert]"))
      continue;

    const message = messageFor(element);
    // A group marks itself invalid; the control to link to is inside it.
    const control = element.matches(GROUP) ? resolveControl(element) : element;
    if (!control?.id) continue;

    const key = message?.id || control.id;
    if (seen.has(key)) continue;
    seen.add(key);

    const text = message?.textContent?.trim();
    if (text) errors.push({ fieldId: control.id, message: text });
  }
  return errors;
}
