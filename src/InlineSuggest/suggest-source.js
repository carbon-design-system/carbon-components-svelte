// @ts-check
// Runs a suggestion function for `InlineSuggest`. Only the newest request
// may report: an older answer is dropped whether or not the function honors
// the abort signal, and a request whose text has been typed past is aborted
// as soon as the next one starts.

/**
 * @typedef {Object} SuggestContext
 * @property {AbortSignal} signal Aborts when the user types on, moves the caret or leaves the field.
 */

/**
 * @typedef {(value: string, context: SuggestContext) => string | null | undefined | Promise<string | null | undefined>} SuggestFunction
 */

/**
 * @param {(suggestion: string, value: string) => void} onResult Called with the text to offer after `value`. An empty string means none, a failure included.
 */
export function createSuggestSource(onResult) {
  let seq = 0;
  /** @type {AbortController | undefined} */
  let controller;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  let pending = false;

  function stop() {
    clearTimeout(timer);
    timer = undefined;
    controller?.abort();
    controller = undefined;
    pending = false;
  }

  /**
   * Ask `load` what follows `value`, after `delay` milliseconds of quiet.
   * @param {SuggestFunction} load
   * @param {string} value
   * @param {number} [delay=0]
   */
  function ask(load, value, delay = 0) {
    stop();
    const id = ++seq;
    controller =
      typeof AbortController === "undefined"
        ? undefined
        : new AbortController();
    const signal =
      controller?.signal ?? /** @type {AbortSignal} */ ({ aborted: false });
    pending = true;

    /** @param {unknown} text */
    const done = (text) => {
      if (id !== seq || signal.aborted) return;
      pending = false;
      onResult(typeof text === "string" ? text : "", value);
    };

    const run = () => {
      timer = undefined;
      let result;
      try {
        result = load(value, { signal });
      } catch {
        done("");
        return;
      }
      if (result && typeof (/** @type {any} */ (result).then) === "function") {
        /** @type {Promise<unknown>} */ (result).then(done, () => done(""));
      } else {
        done(result);
      }
    };

    if (delay > 0) timer = setTimeout(run, delay);
    else run();
  }

  /** Drop the pending request and ignore any answer still on its way. */
  function cancel() {
    seq++;
    stop();
  }

  return { ask, cancel, isPending: () => pending };
}
