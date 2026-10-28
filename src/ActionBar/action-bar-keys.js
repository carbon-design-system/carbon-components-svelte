// @ts-check

const TEXT_INPUT = /^(text|search|email|url|tel|password|number)$/;
const RANGE_ROLES = /^(slider|spinbutton)$/;
const POPUP_ROLES = /^(combobox|listbox|menu|menubar|tree|grid)$/;

/**
 * Whether a key belongs to the control that has focus rather than to the
 * toolbar. A toolbar moves focus with the arrows, and Home and End, so
 * those keys are the control's only where it uses them:
 *
 * - A text field, a text area or an editable region keeps Left, Right,
 *   Home and End (the caret), and Up and Down in a text area.
 * - A select, a slider or a spin button keeps every arrow.
 * - A combobox, listbox or menu keeps Up and Down, and every arrow while
 *   its popup is open.
 *
 * A button or a link hands every key to the toolbar.
 *
 * @param {EventTarget | null} target
 * @param {string} key - A `KeyboardEvent` key.
 * @returns {boolean}
 */
export function controlOwnsKey(target, key) {
  if (!(target instanceof HTMLElement)) return false;
  const inline = key === "ArrowLeft" || key === "ArrowRight";
  const block = key === "ArrowUp" || key === "ArrowDown";
  const edge = key === "Home" || key === "End";
  if (!inline && !block && !edge) return false;

  const role = target.getAttribute("role") ?? "";
  if (target instanceof HTMLInputElement) {
    if (target.type === "range") return true;
    if (TEXT_INPUT.test(target.type)) return inline || edge;
  }
  if (target instanceof HTMLTextAreaElement) return true;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLSelectElement) return true;
  if (RANGE_ROLES.test(role)) return true;
  if (POPUP_ROLES.test(role)) {
    return block || target.getAttribute("aria-expanded") === "true";
  }
  return false;
}

/**
 * Whether the caret of a single-line text field is at the edge a Left or
 * Right key would leave by, with nothing selected. The toolbar takes the key
 * then, so a field does not trap focus.
 *
 * @param {EventTarget | null} target
 * @param {"previous" | "next"} direction - Where the key goes in reading order.
 * @returns {boolean}
 */
export function caretAtEdge(target, direction) {
  if (!(target instanceof HTMLInputElement)) return false;
  if (!TEXT_INPUT.test(target.type) || target.type === "number") return false;
  const { selectionStart, selectionEnd, value } = target;
  if (selectionStart === null || selectionStart !== selectionEnd) return false;
  return direction === "previous"
    ? selectionStart === 0
    : selectionStart === value.length;
}
