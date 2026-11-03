// @ts-check

/**
 * Whether `element` is an open modal dialog: one with `aria-modal="true"`
 * (`Modal`, `ComposedModal`), or a `<dialog>` opened with `showModal()`
 * (a modal `Dialog`), which sets no `aria-modal`.
 * @param {Element} element
 * @returns {boolean}
 */
export function isModalDialog(element) {
  if (element.matches('[aria-modal="true"]')) return true;
  if (!(element instanceof HTMLDialogElement) || !element.open) return false;
  try {
    return element.matches(":modal");
  } catch {
    // Browsers without `:modal` only reach here for an open `<dialog>`.
    return true;
  }
}
