// @ts-check
// Turns a key's values into a stream of states: what is known at once (the
// `values` of the key and the date shortcuts) shows while a function
// `source` answers, and only the newest request may report. A slower, older
// response is dropped whether or not the source honors the abort signal.
// Adapted from the source of `Mentions` (draft #5342), which this branch
// does not depend on.

/**
 * @typedef {import("./token-suggest.js").TokenSuggestion} TokenSuggestion
 */

/**
 * @typedef {Object} SuggestState
 * @property {"idle" | "loading" | "ready" | "error"} status
 * @property {TokenSuggestion[]} items The latest results. Kept while a newer query loads.
 * @property {string} query The query `items` answer, or the one loading.
 */

/**
 * @typedef {Object} SuggestRequest
 * @property {(query: string) => TokenSuggestion[]} known What can be shown without waiting.
 * @property {((query: string, signal: AbortSignal) => TokenSuggestion[] | Promise<TokenSuggestion[]>) | undefined} [load] A source that may take a while.
 * @property {number} limit
 * @property {number} debounce Milliseconds to wait before calling `load`.
 * @property {string} id What the request is for, such as the key. A new one drops the old results.
 */

/**
 * @param {(state: SuggestState) => void} onChange
 */
export function createSuggestSource(onChange) {
  let seq = 0;
  /** @type {AbortController | undefined} */
  let controller;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  /** @type {SuggestState} */
  let state = { status: "idle", items: [], query: "" };
  let lastId = "";

  /** @param {SuggestState} next */
  function emit(next) {
    state = next;
    onChange(next);
  }

  function abortPending() {
    clearTimeout(timer);
    timer = undefined;
    controller?.abort();
    controller = undefined;
  }

  /**
   * @param {TokenSuggestion[]} first
   * @param {TokenSuggestion[]} second
   * @param {number} limit
   */
  function merge(first, second, limit) {
    const seen = new Set(first.map((item) => item.value.toLowerCase()));
    return [
      ...first,
      ...second.filter((item) => !seen.has(item.value.toLowerCase())),
    ].slice(0, limit);
  }

  /**
   * Ask for the rows that answer `query`.
   * @param {SuggestRequest} request
   * @param {string} query
   */
  function ask(request, query) {
    abortPending();
    const run = ++seq;
    const { load, limit } = request;
    const carried = request.id === lastId ? state.items : [];
    lastId = request.id;
    const known = request.known(query);

    if (!load) {
      emit({ status: "ready", items: known, query });
      return;
    }

    controller =
      typeof AbortController === "undefined"
        ? undefined
        : new AbortController();
    const signal =
      controller?.signal ?? /** @type {AbortSignal} */ ({ aborted: false });

    function call() {
      timer = undefined;
      /** @type {TokenSuggestion[] | Promise<TokenSuggestion[]>} */
      let result;
      try {
        result = /** @type {NonNullable<typeof load>} */ (load)(query, signal);
      } catch {
        if (run === seq) emit({ status: "error", items: known, query });
        return;
      }
      if (result && typeof (/** @type {any} */ (result).then) === "function") {
        emit({
          status: "loading",
          items: merge(known, carried, limit),
          query,
        });
        /** @type {Promise<TokenSuggestion[]>} */ (result).then(
          (list) => {
            if (run === seq && !signal.aborted) {
              emit({
                status: "ready",
                items: merge(known, list ?? [], limit),
                query,
              });
            }
          },
          () => {
            if (run === seq && !signal.aborted) {
              emit({ status: "error", items: known, query });
            }
          },
        );
      } else {
        emit({
          status: "ready",
          items: merge(
            known,
            /** @type {TokenSuggestion[]} */ (result) ?? [],
            limit,
          ),
          query,
        });
      }
    }

    if (request.debounce > 0) {
      emit({ status: "loading", items: merge(known, carried, limit), query });
      timer = setTimeout(call, request.debounce);
    } else {
      call();
    }
  }

  /** Drop the pending request and forget the results. */
  function reset() {
    abortPending();
    seq++;
    lastId = "";
    state = { status: "idle", items: [], query: "" };
  }

  return { ask, reset, getState: () => state };
}
