// @ts-check
import { isSubmitAttempt, submitAttempts } from "./submit-attempt.js";
import { addPooledListener } from "./window-listener-pool.js";

/**
 * @typedef {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} Control
 * @typedef {Object} RequiredInvalidOptions
 * @property {(missing: boolean) => void} onChange Called with `true` when an
 * empty required control blocks a submit attempt, and with `false` when its
 * form resets.
 * @property {() => HTMLElement | null | undefined} [getFocusTarget] The
 * element to focus in place of the empty control, such as the visible field
 * of a list box that validates through a hidden proxy input.
 * @property {boolean} [proxy] Set for a hidden input that validates on
 * behalf of a list box: its `invalid` event is always cancelled, so the
 * browser never focuses it or anchors a bubble to it.
 * @property {boolean} [enabled] Set to `false` while the field isn't
 * required, so it adds no listeners. Defaults to `true`.
 */

/**
 * Whether `control` is invalid in a way the user should see: during a
 * submit attempt, or once the browser has flagged it `:user-invalid` (after
 * any submit attempt, including `requestSubmit()`, or an edit). A plain
 * `checkValidity()` call fires `invalid` too, and must not show errors.
 *
 * @param {Control} control
 * @returns {boolean}
 */
function isUserInvalid(control) {
  if (isSubmitAttempt(control.form)) return true;
  try {
    return control.matches(":user-invalid");
  } catch {
    return false;
  }
}

/**
 * Svelte action: show a field's own invalid state instead of the browser's
 * error bubble when a required control is empty.
 *
 * Listens for `invalid` on `node` and, in the capture phase, on the controls
 * inside it, so it serves a single input or a fieldset of checkboxes or
 * radios. Only a missing value is handled; other constraint failures, such
 * as `pattern`, keep the browser's own message. Errors show on a submit
 * attempt, not when code calls `checkValidity()`. The event is then
 * cancelled, which suppresses the bubble but still blocks submission, and
 * the field is focused if it's the first invalid control in the form.
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
  let { onChange, getFocusTarget, proxy = false } = options;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout;
  /** @type {(() => void) | undefined} */
  let stop;

  /** @param {Event} event */
  function handleInvalid(event) {
    const control = /** @type {Control} */ (event.target);
    if (!control.validity?.valueMissing) return;
    const show = isUserInvalid(control);
    if (show || proxy) event.preventDefault();
    if (!show) return;

    if (isSubmitAttempt(control.form)) {
      const firstInvalid = control.form
        ? Array.from(control.form.elements).find(
            (element) =>
              /** @type {Control} */ (element).willValidate &&
              !(/** @type {Control} */ (element).validity.valid),
          )
        : control;
      if (firstInvalid === control) {
        // After the browser has focused any other invalid control whose
        // bubble wasn't cancelled.
        setTimeout(() => {
          const target = getFocusTarget?.() ?? control;
          if (target?.isConnected) target.focus();
        });
      }
    }
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

  function start() {
    const attempts = submitAttempts(node);
    node.addEventListener("invalid", handleInvalid, true);
    const removeReset = addPooledListener("reset", handleReset, true);
    return () => {
      clearTimeout(timeout);
      node.removeEventListener("invalid", handleInvalid, true);
      removeReset();
      attempts.destroy();
    };
  }

  if (options.enabled ?? true) stop = start();

  return {
    update(next) {
      ({ onChange, getFocusTarget, proxy = false } = next);
      const enabled = next.enabled ?? true;
      if (enabled && !stop) stop = start();
      else if (!enabled && stop) {
        stop();
        stop = undefined;
      }
    },
    destroy() {
      stop?.();
      stop = undefined;
    },
  };
}
