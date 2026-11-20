// @ts-check
// Turns a trigger's `items` (an array, or a function that may return a
// promise) into a stream of states. Only the newest request may report: a
// slower, older response is dropped whether or not the source honors the
// abort signal.

import {
  filterMentionItems,
  warmMentionItems,
} from "./filter-mention-items.js";

/**
 * @typedef {import("./filter-mention-items.js").MentionItem} MentionItem
 */

/**
 * @typedef {Object} MentionSourceContext
 * @property {AbortSignal} signal Aborts when a newer query replaces this one, or the menu closes.
 * @property {string} trigger The trigger character.
 */

/**
 * @typedef {ReadonlyArray<MentionItem> | ((query: string, context: MentionSourceContext) => ReadonlyArray<MentionItem> | Promise<ReadonlyArray<MentionItem>>)} MentionItems
 */

/**
 * @typedef {Object} MentionSourceState
 * @property {"idle" | "loading" | "ready" | "error"} status
 * @property {MentionItem[]} items The latest results. Kept while a newer query loads.
 * @property {string} query The query `items` answer, or the one loading.
 */

/**
 * @typedef {Object} MentionSourceRequest
 * @property {string} char
 * @property {MentionItems} items
 * @property {number} limit
 * @property {number} debounce Milliseconds to wait before calling a function source.
 * @property {(items: ReadonlyArray<MentionItem>, query: string) => ReadonlyArray<MentionItem>} [filter] Filters an array source. Default ranks by text.
 */

/**
 * @param {(state: MentionSourceState) => void} onChange
 */
export function createMentionSource(onChange) {
  let seq = 0;
  /** @type {AbortController | undefined} */
  let controller;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let warm;
  /** @type {MentionSourceState} */
  let state = { status: "idle", items: [], query: "" };
  let lastChar = "";

  /** @param {MentionSourceState} next */
  function emit(next) {
    state = next;
    onChange(next);
  }

  function abortPending() {
    clearTimeout(warm);
    clearTimeout(timer);
    timer = undefined;
    controller?.abort();
    controller = undefined;
  }

  /**
   * Ask for the items that answer `query`.
   * @param {MentionSourceRequest} request
   * @param {string} query
   */
  function request(request, query) {
    abortPending();
    const id = ++seq;
    const { items, limit, char } = request;
    const carried = char === lastChar ? state.items : [];
    lastChar = char;

    if (typeof items !== "function") {
      const filter =
        request.filter ?? ((list, q) => filterMentionItems(list, q, limit));
      emit({
        status: "ready",
        items: [...filter(items, query)].slice(0, limit),
        query,
      });
      // The bare trigger needs no ranking. Fold the list while the user
      // reads the menu, so the first letter does not wait for it.
      if (query === "" && !request.filter && items.length > limit) {
        warm = setTimeout(() => warmMentionItems(items), 0);
      }
      return;
    }

    const load =
      /** @type {(query: string, context: MentionSourceContext) => ReadonlyArray<MentionItem> | Promise<ReadonlyArray<MentionItem>>} */ (
        items
      );

    /** @param {ReadonlyArray<MentionItem>} list */
    const ready = (list) => {
      emit({ status: "ready", items: [...list].slice(0, limit), query });
    };

    controller =
      typeof AbortController === "undefined"
        ? undefined
        : new AbortController();
    const signal =
      controller?.signal ?? /** @type {AbortSignal} */ ({ aborted: false });

    function run() {
      timer = undefined;
      let result;
      try {
        result = load(query, { signal, trigger: char });
      } catch {
        if (id === seq) emit({ status: "error", items: [], query });
        return;
      }
      if (result && typeof (/** @type {any} */ (result).then) === "function") {
        if (state.status !== "loading" || state.query !== query) {
          emit({ status: "loading", items: carried, query });
        }
        /** @type {Promise<ReadonlyArray<MentionItem>>} */ (result).then(
          (list) => {
            if (id === seq && !signal.aborted) ready(list ?? []);
          },
          () => {
            if (id === seq && !signal.aborted) {
              emit({ status: "error", items: [], query });
            }
          },
        );
      } else {
        ready(/** @type {ReadonlyArray<MentionItem>} */ (result) ?? []);
      }
    }

    if (request.debounce > 0) {
      emit({ status: "loading", items: carried, query });
      timer = setTimeout(run, request.debounce);
    } else {
      run();
    }
  }

  /** Drop the pending request and forget the results. */
  function reset() {
    abortPending();
    seq++;
    lastChar = "";
    state = { status: "idle", items: [], query: "" };
  }

  return { request, reset, getState: () => state };
}
