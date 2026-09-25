// @ts-check

import { addPooledListener } from "./window-listener-pool.js";

/**
 * Svelte action: call `onReset` after the form that owns `node` resets.
 *
 * `reset` fires before the form restores its controls, and when the
 * user clicks a reset button, browsers run microtasks between
 * listeners, before the restore. The callback therefore runs on the
 * next task, once the DOM holds the reset values. It is skipped when
 * any listener cancels the reset.
 *
 * Every consumer shares one capturing `window` listener (reset
 * bubbles), so many controls on a page do not add a listener each. Each
 * consumer matches `node.form` per event, so a control associated
 * through the `form` attribute, or moved between forms, still resyncs.
 * SSR-safe: actions only run in the browser.
 *
 * @param {HTMLInputElement
 *   | HTMLSelectElement
 *   | HTMLTextAreaElement
 *   | HTMLFieldSetElement} node
 * @param {() => void} onReset
 * @returns {{
 *   update: (onReset: () => void) => void;
 *   destroy: () => void;
 * }}
 */
export function formReset(node, onReset) {
  let callback = onReset;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout;

  /** @param {Event} event */
  function handleReset(event) {
    if (!node.form || event.target !== node.form) return;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (!event.defaultPrevented) callback();
    });
  }

  const removeListener = addPooledListener("reset", handleReset, true);

  return {
    update(next) {
      callback = next;
    },
    destroy() {
      clearTimeout(timeout);
      removeListener();
    },
  };
}
