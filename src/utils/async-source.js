// @ts-check
import { addPooledListener } from "./window-listener-pool.js";

/**
 * @typedef {"idle" | "loading" | "success" | "error"} AsyncStatus
 */

const RESOLVED = Promise.resolve();

const DEFAULT_CACHE = { max: 50, ttl: 0 };

/** @param {unknown} query */
function defaultKey(query) {
  return typeof query === "string" ? query : JSON.stringify(query);
}

/** @param {number} attempt */
function defaultBackoff(attempt) {
  return Math.min(500 * 2 ** attempt, 8000);
}

function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * @param {any} retry
 * @returns {{ count: number, delay: (attempt: number, error: unknown) => number, when: (error: unknown, attempt: number) => boolean }}
 */
function normalizeRetry(retry) {
  const options =
    typeof retry === "number"
      ? { count: retry }
      : retry === true
        ? {}
        : (retry ?? { count: 0 });
  const delay = options.delay ?? defaultBackoff;
  return {
    count: options.count ?? 3,
    delay: typeof delay === "number" ? () => delay : delay,
    when: options.when ?? (() => true),
  };
}

/**
 * The shared engine of {@link createAsyncSource} and {@link createPagedSource}.
 *
 * @param {(query: any, context: { signal: AbortSignal, cursor?: any }) => any} fetcher
 * @param {any} options
 * @param {boolean} paged
 * @returns {any}
 */
function build(fetcher, options, paged) {
  const {
    debounce = 0,
    minLength = 0,
    keepPrevious = true,
    key: keyOf = defaultKey,
    itemKey,
    refetchOnReconnect = true,
  } = options;
  const cacheOptions =
    options.cache === false ? null : { ...DEFAULT_CACHE, ...options.cache };
  const retry = normalizeRetry(options.retry);

  /**
   * Answers by key. Map order is recency: the first key is the oldest used.
   * An entry past its `ttl` stays until evicted and serves as the
   * placeholder while the same key is fetched again.
   * @type {Map<string, { value: any, at: number }>}
   */
  const cache = new Map();
  /** @type {Map<string, any>} */
  const inflight = new Map();
  /** @type {Set<(state: any) => void>} */
  const subscribers = new Set();
  /** @type {Set<(edge: any) => void>} */
  const listeners = new Set();

  let seq = 0;
  // Bumped by `invalidate`, so an answer that was asked for before it is
  // shown but not cached.
  let epoch = 0;
  /** The request that answers `current`. @type {any} */
  let run = null;
  /** The `loadMore` in flight. @type {any} */
  let more = null;
  /** @type {{ query: any, key: string } | null} */
  let current = null;
  /** The key `state.data` answers, which can differ from `current` while loading. @type {string | undefined} */
  let dataKey;
  /** Paged only: what `state.data` holds. @type {any} */
  let acc = null;
  /** @type {(() => void) | undefined} */
  let stopOnline;

  /**
   * @param {string} status
   * @param {any} query
   * @param {{ data?: any, hasMore?: boolean, firstPage?: any } | undefined} view
   * @param {unknown} error
   * @param {boolean} stale
   */
  function make(status, query, view, error, stale) {
    /** @type {any} */
    const next = { status, data: view?.data, error, query, stale };
    if (paged) {
      next.hasMore = view?.hasMore ?? false;
      next.loadingMore = false;
      next.moreError = undefined;
      next.firstPage = view?.firstPage;
    }
    return next;
  }

  /** @param {any} value */
  function viewOf(value) {
    return paged
      ? {
          data: value.items,
          hasMore: value.cursor != null,
          firstPage: value.first,
        }
      : { data: value };
  }

  /** @param {any} payload */
  function toValue(payload) {
    return paged
      ? {
          items: payload?.items ?? [],
          cursor: payload?.nextCursor ?? null,
          first: payload,
        }
      : payload;
  }

  function previousView() {
    return {
      data: state.data,
      hasMore: state.hasMore,
      firstPage: state.firstPage,
    };
  }

  /** @type {any} */
  let state = make("idle", undefined, undefined, undefined, false);

  if (options.initialData !== undefined) {
    const value = toValue(options.initialData);
    const query = options.initialQuery;
    state = make("success", query, viewOf(value), undefined, false);
    if (query !== undefined) {
      current = { query, key: keyOf(query) };
      dataKey = current.key;
      acc = value;
      if (cacheOptions) cacheSet(dataKey, value);
    }
  }

  // The last state that was not a request in progress, so `cancel` can go
  // back to it.
  let settled = { state, current, dataKey, acc };

  /**
   * @param {any} next
   * @param {string} reason
   */
  function emit(next, reason) {
    const previous = state;
    state = next;
    if (next.status !== "loading") settled = { state, current, dataKey, acc };
    for (const notify of [...subscribers]) notify(next);
    if (listeners.size === 0) return;
    const changed =
      next.status !== previous.status ||
      (next.status === "success" && next.data !== previous.data) ||
      (next.status === "error" && next.error !== previous.error);
    if (!changed) return;
    const edge = {
      type: next.status,
      previous: previous.status,
      state: next,
      count: Array.isArray(next.data) ? next.data.length : undefined,
      reason,
    };
    for (const listener of [...listeners]) listener(edge);
  }

  /** @param {string} k */
  function cacheGet(k) {
    const entry = cache.get(k);
    if (entry) {
      cache.delete(k);
      cache.set(k, entry);
    }
    return entry;
  }

  /**
   * @param {string} k
   * @param {any} value
   */
  function cacheSet(k, value) {
    if (!cacheOptions) return;
    cache.delete(k);
    cache.set(k, { value, at: Date.now() });
    while (cache.size > cacheOptions.max) {
      cache.delete(/** @type {string} */ (cache.keys().next().value));
    }
  }

  /**
   * @param {any} query
   * @param {string} k
   */
  function makeRequest(query, k) {
    /** @type {any} */
    const req = {
      id: ++seq,
      query,
      key: k,
      controller: null,
      timer: undefined,
      attempt: 0,
      prefetch: false,
      parked: false,
      aborted: false,
      epoch,
    };
    req.promise = new Promise((resolve) => {
      req.finish = resolve;
    });
    return req;
  }

  /** @param {any} req */
  function finishRequest(req) {
    if (inflight.get(req.key) === req) inflight.delete(req.key);
    req.finish();
  }

  /** @param {any} req */
  function begin(req) {
    req.timer = undefined;
    inflight.set(req.key, req);
    attempt(req);
  }

  /** @param {any} req */
  function attempt(req) {
    req.timer = undefined;
    req.parked = false;
    const controller = new AbortController();
    req.controller = controller;
    let result;
    try {
      result = fetcher(req.query, { signal: controller.signal });
    } catch (error) {
      fail(req, error);
      return;
    }
    if (result != null && typeof result.then === "function") {
      result.then(
        (/** @type {any} */ payload) => succeed(req, payload),
        (/** @type {unknown} */ error) => fail(req, error),
      );
    } else {
      succeed(req, result);
    }
  }

  /**
   * @param {any} req
   * @param {any} payload
   */
  function succeed(req, payload) {
    const value = toValue(payload);
    // A late answer to a request that was superseded is still an answer to
    // its key, so it is cached.
    if (req.epoch === epoch) cacheSet(req.key, value);
    if (run !== req) {
      finishRequest(req);
      return;
    }
    run = null;
    dataKey = req.key;
    acc = value;
    finishRequest(req);
    emit(make("success", req.query, viewOf(value), undefined, false), "fetch");
  }

  /**
   * @param {any} req
   * @param {unknown} error
   */
  function fail(req, error) {
    if (req.aborted) {
      finishRequest(req);
      return;
    }
    if (req.attempt < retry.count && retry.when(error, req.attempt)) {
      const wait = retry.delay(req.attempt, error);
      req.attempt++;
      if (run === req && isOffline()) {
        // Wait for the network instead of burning attempts.
        req.parked = true;
      } else {
        req.timer = setTimeout(attempt, wait, req);
      }
      return;
    }
    if (run !== req) {
      finishRequest(req);
      return;
    }
    run = null;
    // The same key's old answer survives a failed refresh. Another key's
    // answer next to an error would read as the answer to this query.
    const keep = dataKey === req.key && state.data !== undefined;
    const view = keep ? previousView() : undefined;
    if (!keep) {
      dataKey = undefined;
      acc = null;
    }
    finishRequest(req);
    emit(make("error", req.query, view, error, keep), "fetch");
  }

  function abortMore() {
    const pending = more;
    if (!pending) return;
    more = null;
    pending.aborted = true;
    pending.controller.abort();
    pending.finish();
  }

  function abortRun() {
    abortMore();
    const req = run;
    if (!req) return;
    run = null;
    req.aborted = true;
    clearTimeout(req.timer);
    req.timer = undefined;
    req.parked = false;
    req.controller?.abort();
    finishRequest(req);
  }

  /**
   * @param {any} query
   * @param {boolean} force Ask again even if this is the current query, or its answer is cached.
   * @returns {Promise<void>}
   */
  function go(query, force) {
    const k = keyOf(query);
    if (!force && current && current.key === k && state.status !== "error") {
      return run ? run.promise : RESOLVED;
    }
    current = { query, key: k };

    if (typeof query === "string" && query.trim().length < minLength) {
      abortRun();
      dataKey = undefined;
      acc = null;
      emit(make("idle", query, undefined, undefined, false), "length");
      return RESOLVED;
    }

    const entry = cacheOptions ? cacheGet(k) : undefined;
    if (
      !force &&
      entry &&
      Date.now() - entry.at < /** @type {any} */ (cacheOptions).ttl
    ) {
      abortRun();
      dataKey = k;
      acc = entry.value;
      emit(
        make("success", query, viewOf(entry.value), undefined, false),
        "cache",
      );
      return RESOLVED;
    }

    // An answer that is already on its way is joined, not asked for again.
    const joined = force ? undefined : inflight.get(k);
    abortRun();
    const req = joined ?? makeRequest(query, k);
    req.prefetch = false;
    run = req;

    // What shows while this loads: the cached answer to this key, else the
    // last answer if `keepPrevious`, always the key's own answer when
    // refreshing it.
    /** @type {ReturnType<typeof viewOf> | undefined} */
    let view;
    if (entry) {
      view = viewOf(entry.value);
      dataKey = k;
      acc = entry.value;
    } else if ((keepPrevious || dataKey === k) && state.data !== undefined) {
      view = previousView();
    } else {
      dataKey = undefined;
      acc = null;
    }
    const loading = () =>
      make("loading", query, view, undefined, view !== undefined);

    if (joined) {
      emit(loading(), "fetch");
    } else if (debounce > 0 && !force) {
      emit(loading(), "fetch");
      req.timer = setTimeout(begin, debounce, req);
    } else {
      begin(req);
      // A source that answers at once never shows as loading.
      if (run === req) emit(loading(), "fetch");
    }
    return req.promise;
  }

  /**
   * Warm the cache for a query. Joins a request that is already on its way.
   * @param {any} query
   * @returns {Promise<void>}
   */
  function prefetch(query) {
    if (!cacheOptions) return RESOLVED;
    const k = keyOf(query);
    if (typeof query === "string" && query.trim().length < minLength) {
      return RESOLVED;
    }
    const entry = cache.get(k);
    if (entry && Date.now() - entry.at < cacheOptions.ttl) return RESOLVED;
    const pending = inflight.get(k);
    if (pending) return pending.promise;
    const req = makeRequest(query, k);
    req.prefetch = true;
    begin(req);
    return req.promise;
  }

  /**
   * The cached answer to a query, fresh or not, or `undefined`.
   * @param {any} query
   */
  function peek(query) {
    const entry = cache.get(keyOf(query));
    return entry && viewOf(entry.value).data;
  }

  function refresh() {
    return current ? go(current.query, true) : RESOLVED;
  }

  /** Stop the request in progress and go back to the last answer. */
  function cancel() {
    const pending = run;
    const loadingMore = Boolean(more);
    abortRun();
    if (pending) {
      ({ current, dataKey, acc } = settled);
      emit(settled.state, "cancel");
    } else if (loadingMore) {
      emit({ ...state, loadingMore: false }, "cancel");
    }
  }

  /** Stop everything and forget the answer. The cache stays. */
  function reset() {
    abortRun();
    current = null;
    dataKey = undefined;
    acc = null;
    emit(make("idle", undefined, undefined, undefined, false), "reset");
  }

  /**
   * Forget cached answers: one query's, or all.
   * @param {...any} query
   */
  function invalidate(...query) {
    epoch++;
    if (query.length === 0) cache.clear();
    else cache.delete(keyOf(query[0]));
  }

  function loadMore() {
    if (more) return more.promise;
    if (state.status !== "success" || !state.hasMore || !acc || !current) {
      return RESOLVED;
    }
    const base = acc;
    const k = dataKey;
    const query = current.query;
    /** @type {any} */
    const mine = { controller: new AbortController(), aborted: false };
    mine.promise = new Promise((resolve) => {
      mine.finish = resolve;
    });
    more = mine;
    emit({ ...state, loadingMore: true, moreError: undefined }, "more");

    /** @param {any} page */
    const onPage = (page) => {
      if (more !== mine) return;
      more = null;
      const incoming = page?.items ?? [];
      let items;
      if (itemKey) {
        const seen = new Set(base.items.map(itemKey));
        items = base.items.concat(
          incoming.filter(
            (/** @type {any} */ item) => !seen.has(itemKey(item)),
          ),
        );
      } else {
        items = base.items.concat(incoming);
      }
      const value = {
        items,
        cursor: page?.nextCursor ?? null,
        first: base.first,
      };
      acc = value;
      const entry = cache.get(/** @type {string} */ (k));
      if (entry) entry.value = value;
      mine.finish();
      emit(
        {
          ...state,
          data: items,
          hasMore: value.cursor != null,
          loadingMore: false,
          moreError: undefined,
        },
        "more",
      );
    };
    /** @param {unknown} error */
    const onError = (error) => {
      if (more !== mine) return;
      more = null;
      mine.finish();
      emit({ ...state, loadingMore: false, moreError: error }, "more");
    };

    /** @type {any} */
    let result;
    try {
      result = fetcher(query, {
        signal: mine.controller.signal,
        cursor: base.cursor,
      });
    } catch (error) {
      onError(error);
      return mine.promise;
    }
    Promise.resolve(result).then(onPage, onError);
    return mine.promise;
  }

  function onOnline() {
    let resumed = false;
    for (const req of [...inflight.values()]) {
      if (req.parked) {
        resumed = true;
        attempt(req);
      }
    }
    if (!resumed && refetchOnReconnect && state.status === "error" && current) {
      go(current.query, true);
    }
  }

  /** @param {(state: any) => void} listener */
  function subscribe(listener) {
    subscribers.add(listener);
    if (
      subscribers.size === 1 &&
      !stopOnline &&
      typeof window !== "undefined"
    ) {
      stopOnline = addPooledListener("online", onOnline);
    }
    listener(state);
    return () => {
      if (!subscribers.delete(listener) || subscribers.size > 0) return;
      stopOnline?.();
      stopOnline = undefined;
      // Nobody is watching: don't spend a request on it.
      cancel();
    };
  }

  /** @param {(edge: any) => void} listener */
  function onStatus(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  /** @type {any} */
  const source = {
    subscribe,
    set: (/** @type {any} */ query) => go(query, false),
    refresh,
    cancel,
    reset,
    prefetch,
    peek,
    invalidate,
    onStatus,
    get: () => state,
  };
  if (paged) source.loadMore = loadMore;
  return source;
}

/**
 * Turns a function that answers a query into a store that follows the latest
 * query: debounced, cancellable, cached, with only the newest answer shown.
 *
 * Nothing runs until `set` is called, so creating a source at component init
 * starts no timer and no request, on the server or in the browser. Work is
 * tied to its subscribers: when the last one leaves, the request in progress
 * is aborted and the online listener is removed.
 *
 * @template T, [Q=string]
 * @param {(query: Q, context: { signal: AbortSignal }) => T | PromiseLike<T>} fetcher
 * @param {import("./async-source.js").AsyncSourceOptions<T, Q>} [options]
 * @returns {import("./async-source.js").AsyncSource<T, Q>}
 */
export function createAsyncSource(fetcher, options = {}) {
  return build(fetcher, options, false);
}

/**
 * Like {@link createAsyncSource} for a list that comes in pages. The fetcher
 * returns `{ items, nextCursor }`; `loadMore` asks for the next page with that
 * cursor and appends it, and a new query starts over from the first page.
 *
 * @template Item, [Q=string], [Cursor=unknown], [Page={ items: ReadonlyArray<Item>, nextCursor?: Cursor | null }]
 * @param {(query: Q, context: { signal: AbortSignal, cursor?: Cursor }) => Page | PromiseLike<Page>} fetcher
 * @param {import("./async-source.js").PagedSourceOptions<Item, Q, Page>} [options]
 * @returns {import("./async-source.js").PagedSource<Item, Q, Page>}
 */
export function createPagedSource(fetcher, options = {}) {
  return build(fetcher, options, true);
}
