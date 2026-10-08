// @ts-check
import { addPooledListener } from "./window-listener-pool.js";

/** Forms with a submit attempt in progress, cleared after the current task. */
const attempts = new Set();
let consumers = 0;
/** @type {() => void} */
let removeListeners = () => {};

/** @param {HTMLFormElement | null | undefined} form */
function markAttempt(form) {
  if (!form || attempts.has(form)) return;
  attempts.add(form);
  // Validation runs in the same task as the click or Enter that started
  // it, after the event finishes dispatching.
  setTimeout(() => attempts.delete(form));
}

/** @param {Event} event */
function handleClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const control = /** @type {HTMLButtonElement | HTMLInputElement | null} */ (
    target.closest("button, input")
  );
  if (!control || control.disabled || control.formNoValidate) return;
  if (control.type === "submit" || control.type === "image") {
    markAttempt(control.form);
  }
}

/** @param {KeyboardEvent} event */
function handleKeydown(event) {
  // Enter in a text field submits the form implicitly, even without a
  // submit button to click.
  if (event.key !== "Enter") return;
  const target = event.target;
  if (target instanceof HTMLInputElement) markAttempt(target.form);
}

function acquire() {
  if (consumers++ === 0) {
    const removeClick = addPooledListener("click", handleClick, true);
    const removeKeydown = addPooledListener(
      "keydown",
      /** @type {(event: Event) => void} */ (handleKeydown),
      true,
    );
    removeListeners = () => {
      removeClick();
      removeKeydown();
    };
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--consumers === 0) removeListeners();
  };
}

/**
 * Whether `form` is being submitted by a submit button or Enter right now,
 * as opposed to validated from code with `checkValidity()`. Only reports
 * attempts while at least one `submitAttempts` action is mounted.
 *
 * @param {HTMLFormElement | null | undefined} form
 * @returns {boolean}
 */
export function isSubmitAttempt(form) {
  return !!form && attempts.has(form);
}

/**
 * Svelte action: track submit attempts while `enabled`, for
 * `isSubmitAttempt`. All instances share one pair of window listeners.
 *
 * @param {HTMLElement} _node
 * @param {boolean} [enabled]
 * @returns {{ update: (enabled?: boolean) => void, destroy: () => void }}
 */
export function submitAttempts(_node, enabled = true) {
  let release = enabled ? acquire() : () => {};
  return {
    update(next = true) {
      release();
      release = next ? acquire() : () => {};
    },
    destroy() {
      release();
    },
  };
}
