// @ts-check
import { addPooledListener } from "./window-listener-pool.js";

/**
 * @typedef {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} Control
 * @typedef {Object} RequiredInvalidOptions
 * @property {(missing: boolean) => void} onChange Called with `true` when an
 * empty required control blocks submission, and with `false` when its form
 * resets.
 * @property {() => HTMLElement | null | undefined} [getFocusTarget] The
 * element to focus in place of the empty control, such as the visible field
 * of a list box that validates through a hidden proxy input.
 */

/**
 * Svelte action: show a field's own invalid state instead of the browser's
 * error bubble when a required control is empty.
 *
 * Listens for `invalid` on `node` and, in the capture phase, on the controls
 * inside it, so it serves a single input or a fieldset of checkboxes or
 * radios. Only a missing value is handled; other constraint failures, such
 * as `pattern`, keep the browser's own message. The event is cancelled,
 * which suppresses the bubble but still blocks submission, and the first
 * invalid control in the form is focused, as the browser would have done.
 *
 * The owner clears the state itself once the field has a value; this
 * action clears it when the form resets. SSR-safe: actions only run in the
 * browser.
 *
 * @param {HTMLElement} node
 * @param {RequiredInvalidOptions} options
 * @returns {{ update: (options: RequiredInvalidOptions) => void, destroy: () => void }}
 */
export function requiredInvalid(node, options) {
  let { onChange, getFocusTarget } = options;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout;

  /** @param {Event} event */
  function handleInvalid(event) {
    const control = /** @type {Control} */ (event.target);
    if (!control.validity?.valueMissing) return;
    event.preventDefault();
    const firstInvalid = control.form
      ? Array.from(control.form.elements).find(
          (element) =>
            /** @type {Control} */ (element).willValidate &&
            !(/** @type {Control} */ (element).validity.valid),
        )
      : control;
    if (firstInvalid === control) (getFocusTarget?.() ?? control).focus();
    onChange(true);
  }

  /** @param {Event} event */
  function handleReset(event) {
    const form =
      /** @type {Control} */ (/** @type {unknown} */ (node)).form ??
      node.closest("form");
    if (!form || event.target !== form) return;
    clearTimeout(timeout);
    // `reset` fires before the form restores its controls.
    timeout = setTimeout(() => {
      if (!event.defaultPrevented) onChange(false);
    });
  }

  node.addEventListener("invalid", handleInvalid, true);
  const removeReset = addPooledListener("reset", handleReset, true);

  return {
    update(next) {
      ({ onChange, getFocusTarget } = next);
    },
    destroy() {
      clearTimeout(timeout);
      node.removeEventListener("invalid", handleInvalid, true);
      removeReset();
    },
  };
}
