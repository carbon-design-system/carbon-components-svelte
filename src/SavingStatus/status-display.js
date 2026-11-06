// @ts-check

/** @typedef {import("../utils/autosave-state.js").AutosaveStatus} AutosaveStatus */

/**
 * @typedef {object} StatusDisplayOptions
 * @property {number} [savingDelay] Milliseconds a save must run before
 *   "Saving" shows. Defaults to 400.
 * @property {number} [savingMinimum] Milliseconds "Saving" stays once shown.
 *   Defaults to 600.
 * @property {number} [savedDelay] Milliseconds the status must stay saved
 *   before "Saved" shows. Defaults to 250.
 */

/**
 * Turns the machine's status into the one the user sees, so a status bar
 * that follows continuous typing does not flash:
 *
 * - "Saving" shows only when a save outlasts `savingDelay`, and then stays
 *   for `savingMinimum`. A fast save shows "Unsaved changes" and then
 *   "Saved".
 * - "Saved" shows only when it lasts `savedDelay`. Typing that resumes in
 *   that gap never sees it, so a `maxWait` save in the middle of a sentence
 *   does not blink "Saved".
 * - Everything else shows at once, after a shown "Saving" has had its
 *   minimum: an error or an offline notice must not wait for anything else.
 *
 * The first value applies at once and starts no timer, so a server render
 * and the first client render agree.
 *
 * @param {(shown: AutosaveStatus) => void} onChange Called with each new
 *   status to show.
 * @param {StatusDisplayOptions} [options]
 * @returns {((status: AutosaveStatus) => void) & { cancel: () => void }}
 */
export function createStatusDisplay(onChange, options = {}) {
  const { savingDelay = 400, savingMinimum = 600, savedDelay = 250 } = options;

  /** @type {AutosaveStatus | undefined} */
  let shown;
  let shownAt = 0;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  /** @param {AutosaveStatus} next */
  function show(next) {
    timer = undefined;
    if (next === shown) return;
    shown = next;
    shownAt = Date.now();
    onChange(next);
  }

  /** @param {AutosaveStatus} status */
  function update(status) {
    clearTimeout(timer);
    timer = undefined;

    if (shown === undefined) {
      show(status);
      return;
    }

    if (status === "saving") {
      if (shown !== "saving") timer = setTimeout(show, savingDelay, status);
      return;
    }

    if (shown === "saving") {
      const remaining = shownAt + savingMinimum - Date.now();
      if (remaining > 0) {
        timer = setTimeout(() => update(status), remaining);
        return;
      }
    }

    if (status === "saved" && shown !== "saved") {
      timer = setTimeout(show, savedDelay, status);
      return;
    }

    show(status);
  }

  update.cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };

  return update;
}
