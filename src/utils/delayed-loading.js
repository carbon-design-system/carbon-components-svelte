// @ts-check
import { readable } from "svelte/store";
import {
  LOADING_DELAY_MS,
  LOADING_MIN_DURATION_MS,
} from "../constants/timing.js";

/**
 * @typedef {object} DelayedLoadingOptions
 * @property {number} [delay] Milliseconds `loading` must stay `true` before the indicator shows. Defaults to 300.
 * @property {number} [minDuration] Milliseconds the indicator stays once it shows. Defaults to 500.
 */

/**
 * Turns a `loading` flag into whether to show a loading indicator. Work that
 * ends within `delay` shows nothing. Once shown, the indicator stays for at
 * least `minDuration`, so it never flashes.
 *
 * The first call sets the state at once and starts no timer, so a server
 * render and the first client render agree. Call it again with each new
 * `loading` value; a repeated value is ignored.
 * @param {(shown: boolean) => void} onChange Called with each new state.
 * @param {DelayedLoadingOptions} [options]
 * @returns {((loading: boolean) => void) & { cancel: () => void }}
 */
export function createLoadingDelay(onChange, options = {}) {
  const { delay = LOADING_DELAY_MS, minDuration = LOADING_MIN_DURATION_MS } =
    options;

  /** @type {boolean | undefined} */
  let input;
  let shown = false;
  let shownAt = 0;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeoutId;

  /** @param {boolean} next */
  function show(next) {
    timeoutId = undefined;
    shown = next;
    if (next) shownAt = Date.now();
    onChange(next);
  }

  /** @param {boolean} loading */
  function update(loading) {
    const next = Boolean(loading);
    if (next === input) return;
    const first = input === undefined;
    input = next;

    if (first) {
      show(next);
      return;
    }

    clearTimeout(timeoutId);
    timeoutId = undefined;

    if (next) {
      // A pending hide was just canceled, so the indicator stays up.
      if (shown) return;
      if (delay > 0) timeoutId = setTimeout(show, delay, true);
      else show(true);
    } else {
      // A pending show was just canceled, so nothing flashes.
      if (!shown) return;
      const remaining = shownAt + minDuration - Date.now();
      if (remaining > 0) timeoutId = setTimeout(show, remaining, false);
      else show(false);
    }
  }

  update.cancel = () => {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  };

  return update;
}

/**
 * Creates a readable store that follows a `loading` store with
 * {@link createLoadingDelay}: `true` only when the work outlasts `delay`, and
 * then for at least `minDuration`.
 * @param {import("svelte/store").Readable<boolean>} loading
 * @param {DelayedLoadingOptions} [options]
 * @returns {import("svelte/store").Readable<boolean>}
 */
export function delayedLoading(loading, options) {
  return readable(false, (set) => {
    const update = createLoadingDelay(set, options);
    const unsubscribe = loading.subscribe(update);
    return () => {
      unsubscribe();
      update.cancel();
    };
  });
}
