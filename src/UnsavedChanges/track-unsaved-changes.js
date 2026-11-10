// @ts-check

import { formReset } from "../utils/form-reset.js";
import { uniqueId } from "../utils/unique-id.js";
import { addPooledListener } from "../utils/window-listener-pool.js";
import { createFormSnapshot, isControl } from "./form-snapshot.js";
import { unsavedChanges } from "./unsaved-changes.js";

/**
 * @typedef {import("./unsaved-changes.js").UnsavedChangesStore} Store
 * @typedef {object} TrackUnsavedChangesParams
 * @property {Store} [store] Defaults to the shared `unsavedChanges` store.
 * @property {string} [id] Defaults to a generated id.
 * @property {boolean} [dirty] Mirror this flag instead of diffing controls.
 */

// Keys that change a control's value without typing: arrows move a slider or
// a list selection, Enter and Space choose an item.
const SWEEP_KEYS = new Set([
  "Enter",
  " ",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

// How long a native submit keeps the leave-page prompt quiet. The browser
// asks `beforeunload` a task after `submit`, and a submit that never
// navigates (`target="_blank"`) must not silence it for long.
const SUBMIT_GRACE_MS = 1000;

/**
 * Report the dirty state of a `<form>` (or any element) to an
 * unsaved-changes store.
 *
 * A form is compared control by control against a baseline taken on mount,
 * so unnamed controls count. A reset, or `store.markSaved()`, retakes the
 * baseline. Pass `dirty` to mirror a flag you compute yourself instead.
 *
 * @param {HTMLElement} node
 * @param {TrackUnsavedChangesParams} [params]
 * @returns {{ update: (params?: TrackUnsavedChangesParams) => void, destroy: () => void }}
 */
export function trackUnsavedChanges(node, params = {}) {
  let store = unsavedChanges;
  let id = "";
  let explicit = false;
  /** @type {null | (() => void)} */
  let stopForm = null;

  function stop() {
    stopForm?.();
    stopForm = null;
    store.clear(id);
  }

  /** @param {TrackUnsavedChangesParams} next */
  function start(next) {
    store = next.store ?? unsavedChanges;
    id = next.id ?? id;
    explicit = next.dirty !== undefined;
    if (explicit) store.set(id, !!next.dirty);
    else stopForm = trackForm(node, store, id);
  }

  id = params.id ?? uniqueId("unsaved-changes");
  start(params);

  return {
    update(next = {}) {
      const sameTarget = (next.store ?? unsavedChanges) === store;
      if (explicit && next.dirty !== undefined && sameTarget && !next.id) {
        store.set(id, next.dirty);
        return;
      }
      stop();
      start(next);
    },
    destroy: stop,
  };
}

/**
 * @param {HTMLElement} node
 * @param {Store} store
 * @param {string} id
 * @returns {() => void}
 */
function trackForm(node, store, id) {
  const snapshot = createFormSnapshot(node);
  const isForm = node.tagName === "FORM";
  let submitting = false;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let sweepTimer;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let submitTimer;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let settleTimer;
  let interacted = false;

  /** @param {EventTarget | null} target */
  function owns(target) {
    if (!(target instanceof Element)) return false;
    if (isForm && "form" in target && target.form === node) return true;
    return node.contains(target);
  }

  function publish() {
    store.set(id, snapshot.isDirty());
  }

  function rebaseline() {
    clearTimeout(sweepTimer);
    snapshot.capture();
    publish();
  }

  // Values can reach the controls after the event that asked for a fresh
  // baseline: bound values arrive as the component tree mounts (Svelte 5
  // runs `use:` on a form before its children's `bind:value`), and a
  // save handler may assign the server's normalized values in the same
  // breath as `markSaved()`. Take the baseline now, then once more when
  // the DOM has settled, unless the user has touched a control since.
  function rebaselineSettled() {
    rebaseline();
    interacted = false;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      if (!interacted) rebaseline();
    });
  }

  function sweep() {
    snapshot.checkAll();
    publish();
  }

  // Controls such as a file list, a listbox or a slider set their value from
  // their own state, so the DOM changes a task after the click or key that
  // caused it and fires no `input` or `change` event.
  function scheduleSweep() {
    clearTimeout(sweepTimer);
    sweepTimer = setTimeout(sweep);
  }

  /** @param {Event} event */
  function handleValue(event) {
    const { target } = event;
    if (!isControl(target) || !owns(target)) return;
    interacted = true;
    snapshot.check(target);
    if (target.type === "radio") snapshot.checkRadios();
    publish();
  }

  /** @param {Event} event */
  function handleInteraction(event) {
    if (
      event.type === "keydown" &&
      !SWEEP_KEYS.has(/** @type {KeyboardEvent} */ (event).key)
    ) {
      return;
    }
    if (owns(event.target)) {
      interacted = true;
      scheduleSweep();
    }
  }

  /** @param {Event} event */
  function handleSubmit(event) {
    // Bubbles to `window` after the form's own listeners, so a handler that
    // calls `preventDefault()` (an `enhance`d or fetch-based save) is seen.
    if (event.target !== node || event.defaultPrevented) return;
    submitting = true;
    clearTimeout(submitTimer);
    submitTimer = setTimeout(() => {
      submitting = false;
    }, SUBMIT_GRACE_MS);
  }

  /** @param {MutationRecord[]} records */
  function handleMutations(records) {
    let structure = false;
    for (const record of records) {
      if (record.type === "attributes") {
        const target = record.target;
        if (isControl(target) && owns(target)) snapshot.check(target);
        continue;
      }
      for (const added of [...record.addedNodes, ...record.removedNodes]) {
        if (
          added instanceof Element &&
          (isControl(added) || added.querySelector("input, select, textarea"))
        ) {
          structure = true;
        }
      }
    }
    if (structure) snapshot.checkAll();
    publish();
  }

  rebaselineSettled();

  const observer = new MutationObserver(handleMutations);
  observer.observe(node, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["value"],
  });

  const removeIgnore = store.ignoreUnload(() => submitting);
  const removeListeners = [
    addPooledListener("input", handleValue, true),
    addPooledListener("change", handleValue, true),
    addPooledListener("click", handleInteraction, true),
    addPooledListener("keydown", handleInteraction, true),
    addPooledListener("drop", handleInteraction, true),
    addPooledListener("submit", handleSubmit),
  ];
  const resetAction = formReset(node, rebaseline);
  const removeSaved = store.onSaved(rebaselineSettled);

  return () => {
    clearTimeout(sweepTimer);
    clearTimeout(settleTimer);
    clearTimeout(submitTimer);
    observer.disconnect();
    removeIgnore();
    for (const remove of removeListeners) remove();
    resetAction.destroy();
    removeSaved();
  };
}
