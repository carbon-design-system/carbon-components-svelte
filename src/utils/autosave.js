// @ts-check
import { writable } from "svelte/store";
import {
  autosaveReduce,
  autosaveStatus,
  createAutosaveState,
  isAutosaveDirty,
} from "./autosave-state.js";
import { deepEqual } from "./deep-equal.js";
import { addPooledListener } from "./window-listener-pool.js";

/**
 * @typedef {import("./autosave-state.js").AutosaveStatus} AutosaveStatus
 *
 * @typedef {object} AutosaveRetryOptions
 * @property {number} [count] Tries after the first failure. Defaults to 3.
 * @property {number} [delay] Milliseconds before the first retry. Defaults to 1000.
 * @property {number} [factor] Each retry waits this many times longer. Defaults to 2.
 * @property {number} [max] Longest wait in milliseconds. Defaults to 30000.
 * @property {(error: unknown, attempt: number) => boolean} [when] Return
 *   `false` to give up on this error at once, such as for a validation
 *   failure that another try cannot fix.
 *
 * @typedef {object} AutosaveOptions
 * @property {number} [debounce] Quiet time in milliseconds before a save. Defaults to 1000.
 * @property {number} [maxWait] The longest an edit waits, so typing that
 *   never pauses still saves. Defaults to 10000. `0` removes the limit.
 * @property {number | boolean | AutosaveRetryOptions} [retry] Retries after a
 *   failed save. A number is the `count`, `false` turns retries off.
 * @property {boolean} [beforeUnload] Ask before the page closes while
 *   changes are unsaved. Defaults to `true`.
 * @property {boolean} [offline] Follow the browser's `online` and `offline`
 *   events. Set `false` to drive it with `setOnline`. Defaults to `true`.
 * @property {unknown} [initial] The value as loaded. With it, an edit that
 *   equals the last saved value is no edit: nothing is saved and the status
 *   stays put. That makes `$: autosave.change(values)` safe on mount, and
 *   leaves a form clean when a change is typed back. Values are compared by
 *   content, so pass a new object for each edit, as an object literal does.
 * @property {number} [savedAt] When the loaded value was last saved. Shows
 *   `saved` instead of `idle` at the start.
 *
 * @typedef {object} AutosaveContext
 * @property {AbortSignal} signal Aborts when the autosave is destroyed.
 * @property {number} attempt Counts from 1, and from 1 again after Retry.
 *
 * @typedef {object} AutosaveView
 * @property {AutosaveStatus} status
 * @property {boolean} dirty A value no save has confirmed.
 * @property {boolean} saving A request is in flight.
 * @property {boolean} retrying A failed save waits to be tried again.
 * @property {boolean} online
 * @property {number | undefined} savedAt When a save last succeeded.
 * @property {unknown} error Why the save failed, while `status` is `"error"`.
 * @property {number} attempts Failed attempts so far.
 */

const DEFAULT_RETRY = { count: 3, delay: 1000, factor: 2, max: 30000 };

/**
 * @param {number | boolean | AutosaveRetryOptions | undefined} retry
 * @returns {Required<AutosaveRetryOptions>}
 */
function normalizeRetry(retry) {
  const when = () => true;
  if (retry === false) return { ...DEFAULT_RETRY, count: 0, when };
  if (typeof retry === "number") {
    return { ...DEFAULT_RETRY, count: Math.max(0, retry), when };
  }
  if (retry && typeof retry === "object") {
    return { ...DEFAULT_RETRY, when, ...retry };
  }
  return { ...DEFAULT_RETRY, when };
}

/**
 * @param {import("./autosave-state.js").AutosaveMachineState} state
 * @returns {AutosaveView}
 */
function toView(state) {
  return {
    status: autosaveStatus(state),
    dirty: isAutosaveDirty(state),
    saving: state.saving,
    retrying: state.retrying,
    online: state.online,
    savedAt: state.savedAt,
    error: state.failed ? state.error : undefined,
    attempts: state.attempts,
  };
}

/**
 * Drives a save for a form or an editor that saves as you go.
 *
 * Call `change(value)` on every edit. The latest value is saved after
 * `debounce` ms of quiet, or after `maxWait` ms of continuous editing. One
 * save runs at a time, so they land in order, and an edit made during a
 * save goes in the next one: intermediate values are dropped, never queued.
 * A failure is tried again with exponential backoff; when the tries run out
 * the status is `"error"` and `retry()` or the next edit tries again. While
 * the browser is offline nothing is sent, and the save resumes the moment it
 * is back. The page asks before it closes while a value is unsaved.
 *
 * Nothing runs on the server: no timer and no listener exists until the
 * first `change`, and the listeners exist only while there is something to
 * save. Call `destroy()` when the owner goes away.
 *
 * The store holds the state; pass it to `SavingStatus` as `autosave`.
 *
 * @template [T=unknown]
 * @param {(value: T, context: AutosaveContext) => unknown} save
 * @param {AutosaveOptions} [options]
 */
export function createAutosave(save, options = {}) {
  const { debounce = 1000, maxWait = 10000, beforeUnload = true } = options;
  const followBrowser = options.offline !== false;
  const retryOptions = normalizeRetry(options.retry);
  const wait = Math.max(0, debounce);
  const cap = maxWait > 0 ? Math.max(wait, maxWait) : Number.POSITIVE_INFINITY;

  let state = createAutosaveState({ savedAt: options.savedAt });
  const store = writable(toView(state));

  /** @type {T | undefined} */
  let latest;
  /** The value the last save confirmed, once `initial` opts in. */
  let baseline = /** @type {unknown} */ (options.initial);
  let compares = "initial" in options;
  /**
   * What the request in flight carries.
   * @type {T | undefined}
   */
  let sent;
  /**
   * When the first edit not yet handed to a save was made.
   * @type {number | undefined}
   */
  let pendingSince;
  /** The earliest the next attempt may start, after a failure. */
  let notBefore = 0;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  let runId = 0;
  let destroyed = false;
  /** Whether the app has called `setOnline` itself. */
  let told = false;
  /** @type {AbortController | undefined} */
  let controller;
  /** @type {Array<(ok: boolean) => void>} */
  let waiters = [];
  /** @type {(() => void) | undefined} */
  let stopListening;

  /** @param {import("./autosave-state.js").AutosaveEvent} event */
  function dispatch(event) {
    const next = autosaveReduce(state, event);
    if (next === state) return;
    state = next;
    syncListeners();
    store.set(toView(state));
  }

  /** @param {boolean} ok */
  function settleWaiters(ok) {
    const list = waiters;
    waiters = [];
    for (const resolve of list) resolve(ok);
  }

  function clearTimer() {
    clearTimeout(timer);
    timer = undefined;
  }

  /** @param {Event} event */
  function guardUnload(event) {
    if (!isAutosaveDirty(state)) return;
    event.preventDefault();
    // Older browsers read the return value instead.
    /** @type {any} */ (event).returnValue = "";
  }

  // The listeners exist only while a value is unsaved, so a page full of
  // clean forms holds none and a forgotten `destroy()` leaks nothing.
  function syncListeners() {
    const needed =
      !destroyed && typeof window !== "undefined" && isAutosaveDirty(state);
    if (needed && !stopListening) {
      /** @type {Array<() => void>} */
      const stops = [];
      if (beforeUnload) {
        stops.push(addPooledListener("beforeunload", guardUnload));
      }
      if (followBrowser) {
        stops.push(
          addPooledListener("online", () => applyOnline(true)),
          addPooledListener("offline", () => applyOnline(false)),
        );
      }
      stopListening = () => {
        for (const stop of stops) stop();
      };
    } else if (!needed && stopListening) {
      stopListening();
      stopListening = undefined;
    }
  }

  function schedule() {
    clearTimer();
    if (destroyed || state.saving || !isAutosaveDirty(state)) return;
    // Nothing is sent offline; `setOnline(true)` starts the save.
    if (!state.online) return;
    // Retries ran out and nothing changed since: wait for Retry.
    if (state.failed && !state.retrying && pendingSince === undefined) return;
    const now = Date.now();
    const due =
      pendingSince === undefined
        ? notBefore
        : Math.max(Math.min(now + wait, pendingSince + cap), notBefore);
    timer = setTimeout(run, Math.max(0, due - now));
  }

  function run() {
    timer = undefined;
    if (destroyed || state.saving || !state.online) return;
    if (!isAutosaveDirty(state)) return;

    const value = /** @type {T} */ (latest);
    sent = value;
    pendingSince = undefined;
    const id = ++runId;
    dispatch({ type: "start" });
    controller ??= new AbortController();
    const context = { signal: controller.signal, attempt: state.attempts + 1 };

    /** @type {unknown} */
    let result;
    try {
      result = save(value, context);
    } catch (error) {
      result = Promise.reject(error);
    }
    Promise.resolve(result).then(
      () => settle(id, true),
      (error) => settle(id, false, error),
    );
  }

  /**
   * @param {number} id
   * @param {boolean} ok
   * @param {unknown} [error]
   */
  function settle(id, ok, error) {
    // A reset or a destroy since the request started: its result is moot.
    if (destroyed || id !== runId) return;
    if (ok) {
      notBefore = 0;
      baseline = sent;
      dispatch({ type: "success", at: Date.now() });
    } else {
      const attempt = state.attempts + 1;
      const retry =
        state.online &&
        attempt <= retryOptions.count &&
        retryOptions.when(error, attempt);
      if (retry) {
        const backoff =
          retryOptions.delay * retryOptions.factor ** (attempt - 1);
        notBefore = Date.now() + Math.min(backoff, retryOptions.max);
      }
      dispatch({ type: "failure", error, retry });
    }
    settleWaiters(ok);
    schedule();
  }

  /**
   * Record an edit. The latest value wins; the call is cheap enough for
   * every keystroke.
   * @param {T} [value]
   */
  function change(value) {
    if (destroyed) return;
    // Nothing waits and nothing differs: not an edit.
    if (compares && !isAutosaveDirty(state) && deepEqual(value, baseline)) {
      return;
    }
    latest = value;
    if (
      followBrowser &&
      !stopListening &&
      !told &&
      typeof navigator !== "undefined"
    ) {
      // No listener exists while clean, so read the network now.
      dispatch({ type: navigator.onLine === false ? "offline" : "online" });
    }
    dispatch({ type: "change" });
    pendingSince ??= Date.now();
    schedule();
  }

  /**
   * Tell it the network is up or down. It follows the browser's events
   * itself unless `offline` is `false`; call this for a connection check of
   * your own, such as a socket. Once called, it stops reading
   * `navigator.onLine` when an edit starts.
   * @param {boolean} online
   */
  function setOnline(online) {
    told = true;
    applyOnline(online);
  }

  /** @param {boolean} online */
  function applyOnline(online) {
    if (destroyed) return;
    const wasOnline = state.online;
    dispatch({ type: online ? "online" : "offline" });
    if (!online) {
      clearTimer();
    } else if (!wasOnline) {
      // Back from offline: go now, the backoff was for a server that failed.
      notBefore = 0;
      run();
    }
  }

  /**
   * Try again now, without waiting for the backoff. This is the Retry
   * button.
   */
  function retry() {
    if (destroyed || state.saving) return;
    notBefore = 0;
    clearTimer();
    run();
  }

  /**
   * Save now instead of waiting for the debounce, such as before a
   * navigation. Resolves `true` once everything is saved, and `false` when a
   * save fails, the network is down, or the autosave is destroyed or reset.
   * A failure is still retried in the background.
   * @returns {Promise<boolean>}
   */
  async function flush() {
    for (;;) {
      if (destroyed) return false;
      if (!isAutosaveDirty(state)) return true;
      if (!state.online) return false;
      if (!state.saving) {
        notBefore = 0;
        clearTimer();
        run();
      }
      // eslint-disable-next-line no-await-in-loop -- each save settles before the next
      const ok = await new Promise((resolve) => waiters.push(resolve));
      if (!ok) return false;
    }
  }

  /**
   * Take the current value as saved, such as after loading a record, and
   * forget any failure. A request still in flight is ignored when it ends.
   * Pass the loaded value to compare later edits against it, as `initial`
   * does.
   * @param {...T} loaded
   */
  function reset(...loaded) {
    if (destroyed) return;
    if (loaded.length > 0) {
      baseline = loaded[0];
      compares = true;
    }
    runId++;
    clearTimer();
    pendingSince = undefined;
    notBefore = 0;
    dispatch({ type: "reset" });
    settleWaiters(false);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    clearTimer();
    controller?.abort();
    stopListening?.();
    stopListening = undefined;
    settleWaiters(false);
  }

  return {
    subscribe: store.subscribe,
    change,
    flush,
    retry,
    reset,
    setOnline,
    destroy,
  };
}
