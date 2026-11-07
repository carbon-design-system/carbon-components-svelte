// @ts-check
// Turns a picker's `items` (an array, or a function that may return a
// promise) into a stream of states. Only the newest request may report: a
// slower, older response is dropped whether or not the source honors the
// abort signal. Adapted from `createMentionSource` (Mentions, #5342), which
// has the same job for a trigger menu; this one has no trigger, can skip
// people already chosen, and can run the last request again after an error.

import { filterPeople, warmPeople } from "./filter-people.js";

/**
 * @typedef {import("./filter-people.js").PersonLike} PersonLike
 */

/**
 * @template {PersonLike} T
 * @typedef {Object} PersonSourceState
 * @property {"idle" | "loading" | "ready" | "error"} status
 * @property {T[]} items The latest results. Kept while a newer query loads.
 * @property {string} query The query `items` answer, or the one loading.
 * @property {unknown} [error] Why a request failed, with `status` `"error"`.
 */

/**
 * @template {PersonLike} T
 * @typedef {Object} PersonSourceRequest
 * @property {ReadonlyArray<T> | ((query: string, context: { signal: AbortSignal }) => ReadonlyArray<T> | Promise<ReadonlyArray<T>>)} items
 * @property {number} limit
 * @property {number} debounce Milliseconds to wait before calling a function source.
 * @property {(person: T) => boolean} [exclude] Skips a person, such as one already chosen.
 * @property {(items: ReadonlyArray<T>, query: string) => ReadonlyArray<T>} [filter] Filters an array source. Default ranks by name, then email and secondary text.
 */

/**
 * @template {PersonLike} T
 * @param {(state: PersonSourceState<T>) => void} onChange
 */
export function createPersonSource(onChange) {
  let seq = 0;
  /** @type {AbortController | undefined} */
  let controller;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let warm;
  /** @type {PersonSourceState<T>} */
  let state = { status: "idle", items: [], query: "" };
  /** @type {{ request: PersonSourceRequest<T>, query: string } | undefined} */
  let last;

  /** @param {PersonSourceState<T>} next */
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
   * Ask for the people that answer `query`.
   * @param {PersonSourceRequest<T>} request
   * @param {string} query
   */
  function request(request, query) {
    abortPending();
    last = { request, query };
    const id = ++seq;
    const { items, limit, exclude } = request;
    const carried = state.items;

    /** @param {ReadonlyArray<T>} list */
    const take = (list) => {
      const kept = exclude ? list.filter((person) => !exclude(person)) : list;
      return kept.slice(0, limit);
    };

    if (typeof items !== "function") {
      const filter = request.filter;
      emit({
        status: "ready",
        items: filter
          ? take(filter(items, query))
          : filterPeople(items, query, limit, exclude),
        query,
      });
      // The empty query needs no ranking. Fold the list while the user reads
      // the menu, so the first letter does not wait for it.
      if (query === "" && !filter && items.length > limit) {
        warm = setTimeout(() => warmPeople(items), 0);
      }
      return;
    }

    const load =
      /** @type {(query: string, context: { signal: AbortSignal }) => ReadonlyArray<T> | Promise<ReadonlyArray<T>>} */ (
        items
      );

    /** @param {ReadonlyArray<T>} list */
    const ready = (list) => {
      emit({ status: "ready", items: take(list), query });
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
        result = load(query, { signal });
      } catch (error) {
        if (id === seq) emit({ status: "error", items: [], query, error });
        return;
      }
      if (result && typeof (/** @type {any} */ (result).then) === "function") {
        if (state.status !== "loading" || state.query !== query) {
          emit({ status: "loading", items: carried, query });
        }
        /** @type {Promise<ReadonlyArray<T>>} */ (result).then(
          (list) => {
            if (id === seq && !signal.aborted) ready(list ?? []);
          },
          (error) => {
            if (id === seq && !signal.aborted) {
              emit({ status: "error", items: [], query, error });
            }
          },
        );
      } else {
        ready(/** @type {ReadonlyArray<T>} */ (result) ?? []);
      }
    }

    if (request.debounce > 0) {
      emit({ status: "loading", items: carried, query });
      timer = setTimeout(run, request.debounce);
    } else {
      run();
    }
  }

  /** Run the last request again, at once, such as after an error. */
  function retry() {
    if (!last) return;
    request({ ...last.request, debounce: 0 }, last.query);
  }

  /** Drop the pending request and forget the results. */
  function reset() {
    abortPending();
    seq++;
    last = undefined;
    state = { status: "idle", items: [], query: "" };
  }

  return { request, retry, reset, getState: () => state };
}
