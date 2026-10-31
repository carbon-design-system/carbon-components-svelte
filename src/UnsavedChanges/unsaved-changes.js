// @ts-check

import { derived, get, writable } from "svelte/store";
import { addPooledListener } from "../utils/window-listener-pool.js";

/**
 * @typedef {{ resolve: (discard: boolean) => void }} UnsavedChangesRequest
 * @typedef {() => boolean | Promise<boolean>} UnsavedChangesAsk
 */

/**
 * Create a registry of dirty sources and the guards that read it.
 *
 * @param {{ beforeUnload?: boolean }} [options]
 */
export function createUnsavedChanges(options = {}) {
  /** @type {Set<string>} */
  const sources = new Set();
  const size = writable(0);
  const dirty = derived(size, ($size) => $size > 0);
  /** @type {import("svelte/store").Writable<UnsavedChangesRequest | null>} */
  const prompt = writable(null);
  /** @type {Set<() => void>} */
  const savedListeners = new Set();
  /** @type {Set<() => boolean>} */
  const unloadIgnores = new Set();

  let beforeUnload = options.beforeUnload !== false;
  let promptMounted = false;
  /** @type {null | (() => void)} */
  let removeUnloadListener = null;
  /** @type {null | Promise<boolean>} */
  let pendingGuard = null;
  /** @type {null | (() => void)} */
  let pendingRetry = null;

  function isDirty() {
    return sources.size > 0;
  }

  /** @param {Event} event */
  function handleBeforeUnload(event) {
    for (const ignore of unloadIgnores) {
      if (ignore()) return;
    }
    event.preventDefault();
    // Legacy browsers read `returnValue`; modern ones show their own text.
    /** @type {BeforeUnloadEvent} */ (event).returnValue = "";
  }

  // The listener exists only while dirty: a page with a `beforeunload`
  // listener can lose back/forward cache eligibility in some browsers.
  function syncListener() {
    const wanted = beforeUnload && isDirty() && typeof window !== "undefined";
    if (wanted && !removeUnloadListener) {
      removeUnloadListener = addPooledListener(
        "beforeunload",
        handleBeforeUnload,
      );
    } else if (!wanted && removeUnloadListener) {
      removeUnloadListener();
      removeUnloadListener = null;
    }
  }

  function sync() {
    // `size` emits only when the count changes.
    size.set(sources.size);
    syncListener();
  }

  /**
   * @param {string} id
   * @param {boolean} value
   */
  function set(id, value) {
    if (value === sources.has(id)) return;
    if (value) sources.add(id);
    else sources.delete(id);
    sync();
  }

  /** @param {string} id */
  function clear(id) {
    set(id, false);
  }

  function reset() {
    if (sources.size === 0) return;
    sources.clear();
    sync();
  }

  function markSaved() {
    reset();
    for (const listener of [...savedListeners]) listener();
  }

  /**
   * @param {() => void} listener
   * @returns {() => void}
   */
  function onSaved(listener) {
    savedListeners.add(listener);
    return () => {
      savedListeners.delete(listener);
    };
  }

  /**
   * @param {UnsavedChangesAsk} [ask]
   * @returns {Promise<boolean>}
   */
  function guard(ask) {
    if (!isDirty()) return Promise.resolve(true);
    if (pendingGuard) return pendingGuard;

    const request = new Promise((resolve) => {
      if (ask) {
        resolve(ask());
      } else if (promptMounted) {
        prompt.set({
          resolve(discard) {
            prompt.set(null);
            resolve(discard);
          },
        });
      } else {
        resolve(window.confirm("You have unsaved changes. Discard them?"));
      }
    });

    const current = request.then(
      (discard) => {
        pendingGuard = null;
        if (discard) reset();
        return !!discard;
      },
      (error) => {
        pendingGuard = null;
        prompt.set(null);
        throw error;
      },
    );
    pendingGuard = current;
    return current;
  }

  /**
   * Router bridge. `cancel` runs synchronously, because routers commit the
   * navigation as soon as the hook returns. `retry` runs once the user
   * discards. A second interruption while the first is open replaces `retry`.
   *
   * @param {() => void} cancel
   * @param {() => void} retry
   * @returns {boolean}
   */
  function interrupt(cancel, retry) {
    if (!isDirty()) return false;
    cancel();
    const first = pendingRetry === null;
    pendingRetry = retry;
    if (first) {
      guard().then(
        (discard) => {
          const run = pendingRetry;
          pendingRetry = null;
          if (discard) run?.();
        },
        () => {
          pendingRetry = null;
        },
      );
    }
    return true;
  }

  /**
   * Build a handler for a dialog's cancelable `close` event, or for a Cancel
   * button. On approval it runs `close()`, then `markSaved()`.
   *
   * @param {() => void} close
   * @returns {(event?: CustomEvent<{ trigger?: string }>) => void}
   */
  function closeGuard(close) {
    return (event) => {
      if (event?.detail?.trigger === "programmatic") return;
      if (!isDirty()) {
        // A dialog closes itself when its `close` event is not canceled; a
        // button handler has no event, so it closes the dialog here.
        if (!event) close();
        return;
      }
      event?.preventDefault();
      guard().then((discard) => {
        if (!discard) return;
        close();
        // The dialog's form is going away or being restored: tracked forms
        // read clean at whatever `close()` left in them.
        markSaved();
      });
    };
  }

  /** @param {boolean} on */
  function setBeforeUnload(on) {
    beforeUnload = on;
    syncListener();
  }

  /**
   * Internal: the mounted `UnsavedChangesPrompt` answers `guard()`. Only the
   * first prompt per store attaches.
   *
   * @returns {null | (() => void)}
   */
  function mountPrompt() {
    if (promptMounted) return null;
    promptMounted = true;
    return () => {
      promptMounted = false;
      // A request nobody can answer would hang its `guard()` forever.
      get(prompt)?.resolve(false);
    };
  }

  /**
   * Internal: skip the unload prompt while `predicate` returns true, for a
   * form that is navigating the page on purpose.
   *
   * @param {() => boolean} predicate
   * @returns {() => void}
   */
  function ignoreUnload(predicate) {
    unloadIgnores.add(predicate);
    return () => {
      unloadIgnores.delete(predicate);
    };
  }

  return {
    dirty: { subscribe: dirty.subscribe },
    count: { subscribe: size.subscribe },
    prompt: { subscribe: prompt.subscribe },
    set,
    clear,
    reset,
    markSaved,
    onSaved,
    guard,
    interrupt,
    closeGuard,
    setBeforeUnload,
    mountPrompt,
    ignoreUnload,
  };
}

/** The shared store, for zero-config page protection. */
export const unsavedChanges = createUnsavedChanges();
