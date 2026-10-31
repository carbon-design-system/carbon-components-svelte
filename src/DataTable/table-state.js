// @ts-check
import { readable, writable } from "svelte/store";
import { SEARCH_DEBOUNCE_MS } from "../constants/timing.js";
import { deepEqual } from "../utils/deep-equal.js";
import { replaceHistory } from "../utils/query-param.js";
import { safeBrowserStorage } from "../utils/storage.js";

/**
 * @typedef {import("../utils/column-settings.js").ColumnSettings} ColumnSettings
 */

/**
 * @typedef {object} TableState
 * @property {string | null} sortKey
 * @property {"none" | "ascending" | "descending"} sortDirection
 * @property {number} page - 1-based
 * @property {number} pageSize
 * @property {string} search
 * @property {ReadonlyArray<any>} selectedRowIds
 * @property {ColumnSettings} [columns]
 */

/**
 * @typedef {object} TableStateCodec
 * @property {(raw: string) => unknown} parse - Return `undefined` to reject the raw value
 * @property {(value: any) => string | null | undefined} serialize - Return `null`, `undefined` or `""` to leave the parameter out
 */

/**
 * @typedef {object} TableStateOptions
 * @property {string[]} [resetPageOn] - State keys, besides `search`, `pageSize`, `sortKey` and `sortDirection`, whose change resets `page` to 1
 * @property {Record<string, TableStateCodec>} [codecs] - Search-param codecs for keys beyond the built-in ones
 * @property {ReadonlyArray<number>} [pageSizes] - Allowed page sizes; anything else falls back to the default
 * @property {ReadonlyArray<string>} [sortKeys] - Allowed sort keys; anything else falls back to the default
 * @property {boolean | { prefix?: string; params?: SearchParamsOptions["params"]; replace?: (href: string) => void }} [url] - Mirror the state to the URL's search parameters
 * @property {{ key: string; area?: "local" | "session"; pick?: ReadonlyArray<string> }} [persist] - Mirror the state to web storage
 * @property {number} [searchDebounce] - Milliseconds a search-only change waits before `settled` follows it
 */

/**
 * @typedef {object} SearchParamsOptions
 * @property {Partial<TableState> & Record<string, unknown>} [defaults] - Values that are left out when they match
 * @property {string} [prefix] - Prepended to every parameter name
 * @property {Partial<Record<"sort" | "page" | "pageSize" | "search", string>>} [params] - Rename the built-in parameters
 * @property {Record<string, TableStateCodec>} [codecs]
 * @property {ReadonlyArray<number>} [pageSizes]
 * @property {ReadonlyArray<string>} [sortKeys]
 * @property {string | URLSearchParams} [base] - Parameters to keep and add to (writing only)
 */

const DIRECTIONS = ["none", "ascending", "descending"];
const BUILT_IN_KEYS = [
  "sortKey",
  "sortDirection",
  "page",
  "pageSize",
  "search",
  "selectedRowIds",
  "columns",
];
const URL_KEYS = ["sortKey", "sortDirection", "page", "pageSize", "search"];
const UNPERSISTED_KEYS = ["selectedRowIds", "search", "page"];
const RESET_PAGE_KEYS = ["search", "pageSize", "sortKey", "sortDirection"];
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 1000;
const PARAM_NAMES = {
  sort: "sort",
  page: "page",
  pageSize: "pageSize",
  search: "q",
};
const WHOLE_NUMBER = /^\d+$/;
const DIRECTION_SUFFIX = { asc: "ascending", desc: "descending" };

/** @param {unknown} value */
function isPositiveInteger(value) {
  return Number.isSafeInteger(value) && /** @type {number} */ (value) >= 1;
}

/**
 * Coerce any value into a complete, valid state. Anything missing or invalid
 * falls back to `defaults`, so a cleared or version-skewed stored value
 * cannot corrupt the store.
 * @param {unknown} value
 * @param {TableState & Record<string, unknown>} defaults
 * @param {{ pageSizes?: ReadonlyArray<number>; sortKeys?: ReadonlyArray<string>; extraKeys?: ReadonlyArray<string> }} [rules]
 * @returns {TableState & Record<string, unknown>}
 */
function normalize(value, defaults, rules = {}) {
  const source = /** @type {Record<string, any>} */ (
    value && typeof value === "object" ? value : {}
  );
  const { pageSizes, sortKeys, extraKeys = [] } = rules;

  let sortKey = defaults.sortKey;
  if (source.sortKey === null) sortKey = null;
  else if (
    typeof source.sortKey === "string" &&
    source.sortKey !== "" &&
    (!sortKeys || sortKeys.includes(source.sortKey))
  ) {
    sortKey = source.sortKey;
  }

  /** @type {TableState & Record<string, unknown>} */
  const state = {
    sortKey,
    sortDirection:
      sortKey === null
        ? "none"
        : DIRECTIONS.includes(source.sortDirection)
          ? source.sortDirection
          : defaults.sortDirection,
    page: isPositiveInteger(source.page) ? source.page : defaults.page,
    pageSize:
      isPositiveInteger(source.pageSize) &&
      source.pageSize <= MAX_PAGE_SIZE &&
      (!pageSizes || pageSizes.includes(source.pageSize))
        ? source.pageSize
        : defaults.pageSize,
    search: typeof source.search === "string" ? source.search : defaults.search,
    selectedRowIds: Array.isArray(source.selectedRowIds)
      ? [...source.selectedRowIds]
      : [...defaults.selectedRowIds],
  };

  for (const key of ["columns", ...extraKeys]) {
    const next = key in source ? source[key] : defaults[key];
    if (next !== undefined) state[key] = next;
  }
  return state;
}

/**
 * The state after a write. A write that leaves nothing different returns
 * `current` itself. Changing `search`, `pageSize`, `sortKey`, `sortDirection`
 * or a `resetPageOn` key resets `page` to 1, unless the same write sets `page`.
 * @param {TableState & Record<string, unknown>} current
 * @param {unknown} incoming
 * @param {{ defaults: TableState & Record<string, unknown>; resetPageOn?: ReadonlyArray<string>; pageSizes?: ReadonlyArray<number>; sortKeys?: ReadonlyArray<string>; extraKeys?: ReadonlyArray<string> }} config
 * @param {boolean} [resetPage] - Set to `false` for a read from outside, which is not a user action
 * @returns {TableState & Record<string, unknown>}
 */
function nextTableState(current, incoming, config, resetPage = true) {
  const next = normalize(incoming, config.defaults, config);
  if (
    resetPage &&
    next.page === current.page &&
    [...RESET_PAGE_KEYS, ...(config.resetPageOn ?? [])].some(
      (key) => !deepEqual(next[key], current[key]),
    )
  ) {
    next.page = 1;
  }
  return deepEqual(next, current) ? current : next;
}

/** @param {TableState & Record<string, unknown>} state */
function copyState(state) {
  return { ...state, selectedRowIds: [...state.selectedRowIds] };
}

/**
 * Parse the sort parameter. The direction is the text after the last colon,
 * so a key that holds colons still parses. A value without a direction
 * suffix is an ascending sort on the whole value.
 * @param {string} raw
 */
function parseSort(raw) {
  const index = raw.lastIndexOf(":");
  const suffix = index > 0 ? raw.slice(index + 1) : "";
  if (suffix in DIRECTION_SUFFIX) {
    return {
      sortKey: raw.slice(0, index),
      sortDirection: DIRECTION_SUFFIX[/** @type {"asc" | "desc"} */ (suffix)],
    };
  }
  return { sortKey: raw, sortDirection: "ascending" };
}

/**
 * Read a table state out of search parameters. Parameters that are missing
 * or invalid fall back to `defaults`: a page that is not a whole number, a
 * page size outside `pageSizes`, a sort key outside `sortKeys`. The result
 * is a complete state, so it can be passed to `createTableState` as the
 * initial state, on the server too.
 * @param {string | URLSearchParams} params
 * @param {SearchParamsOptions} [options]
 * @returns {TableState & Record<string, unknown>}
 */
export function tableStateFromSearchParams(params, options = {}) {
  const input =
    typeof params === "string" ? new URLSearchParams(params) : params;
  const { prefix = "", codecs = {}, pageSizes, sortKeys } = options;
  const names = { ...PARAM_NAMES, ...options.params };
  /** @param {keyof typeof PARAM_NAMES} key */
  const read = (key) => input.get(prefix + names[key]);
  const extraKeys = [
    ...new Set([
      ...Object.keys(codecs),
      ...Object.keys(options.defaults ?? {}).filter(
        (key) => !BUILT_IN_KEYS.includes(key),
      ),
    ]),
  ];
  const defaults = normalize(options.defaults, createDefaults(), { extraKeys });

  /** @type {Record<string, unknown>} */
  const found = {};
  const sort = read("sort");
  if (sort) {
    const parsed = parseSort(sort);
    if (!sortKeys || sortKeys.includes(parsed.sortKey)) {
      Object.assign(found, parsed);
    }
  }
  const page = read("page");
  if (page !== null && WHOLE_NUMBER.test(page)) found.page = Number(page);
  const pageSize = read("pageSize");
  if (pageSize !== null && WHOLE_NUMBER.test(pageSize)) {
    found.pageSize = Number(pageSize);
  }
  const search = read("search");
  if (search !== null) found.search = search;

  for (const key of Object.keys(codecs)) {
    const raw = input.get(prefix + key);
    const value = raw === null ? undefined : codecs[key].parse(raw);
    if (value !== undefined) found[key] = value;
  }

  return normalize({ ...defaults, ...found }, defaults, {
    pageSizes,
    sortKeys,
    extraKeys,
  });
}

/**
 * Write a table state as search parameters, for a URL or for the request a
 * server table makes. With `defaults`, a value equal to its default is left
 * out. An empty sort and an empty search are always left out. `selectedRowIds`
 * and `columns` are never written unless a codec is given for them.
 * @param {TableState & Record<string, unknown>} state
 * @param {SearchParamsOptions} [options]
 * @returns {URLSearchParams}
 */
export function tableStateToSearchParams(state, options = {}) {
  const { prefix = "", codecs = {}, defaults, base } = options;
  const names = { ...PARAM_NAMES, ...options.params };
  const out = new URLSearchParams(base);
  /**
   * @param {string} name
   * @param {string | null | undefined} value
   */
  const write = (name, value) => {
    if (value === null || value === undefined || value === "") {
      out.delete(prefix + name);
    } else {
      out.set(prefix + name, value);
    }
  };
  /** @param {string} key */
  const isDefault = (key) =>
    defaults !== undefined &&
    defaults[key] !== undefined &&
    deepEqual(state[key], defaults[key]);

  const suffix = state.sortDirection === "descending" ? "desc" : "asc";
  write(
    names.sort,
    state.sortKey === null ||
      state.sortDirection === "none" ||
      (isDefault("sortKey") && isDefault("sortDirection"))
      ? null
      : `${state.sortKey}:${suffix}`,
  );
  write(names.page, isDefault("page") ? null : String(state.page));
  write(names.pageSize, isDefault("pageSize") ? null : String(state.pageSize));
  write(names.search, isDefault("search") ? null : state.search);

  for (const [key, codec] of Object.entries(codecs)) {
    write(key, isDefault(key) ? null : codec.serialize(state[key]));
  }
  return out;
}

/** @returns {TableState & Record<string, unknown>} */
function createDefaults() {
  return {
    sortKey: null,
    sortDirection: "none",
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    search: "",
    selectedRowIds: [],
  };
}

/**
 * A writable store for the state a data table shares with its toolbar,
 * pagination and the request a server table makes: sort, page, page size,
 * search, selection and column settings.
 *
 * Every write goes through one commit, including the `set` that
 * `bind:value={$table.search}` makes with the mutated store value. The store
 * compares it with its own private copy, so a write that changes nothing
 * wakes no one, and changing the search, page size or sort resets `page` to 1
 * in the same commit instead of requesting a page that no longer exists.
 *
 * Create it inside a component, not at module scope, so server-rendered
 * requests don't share one store.
 *
 * @param {Partial<TableState> & Record<string, unknown>} [initial]
 * @param {TableStateOptions} [options]
 * @returns {import("svelte/store").Writable<any> & { patch(partial: Record<string, unknown>): void; reset(): void; settled: import("svelte/store").Readable<any> }}
 */
export function createTableState(initial = {}, options = {}) {
  const {
    resetPageOn = [],
    codecs = {},
    pageSizes,
    sortKeys,
    searchDebounce = SEARCH_DEBOUNCE_MS,
  } = options;
  const extraKeys = [
    ...new Set(
      [...Object.keys(initial), ...Object.keys(codecs), ...resetPageOn].filter(
        (key) => !BUILT_IN_KEYS.includes(key),
      ),
    ),
  ];
  const config = {
    resetPageOn,
    pageSizes,
    sortKeys,
    extraKeys,
    defaults: createDefaults(),
  };
  config.defaults = normalize(initial, config.defaults, config);

  const urlOptions = options.url === true ? {} : options.url || null;
  const urlParams = {
    prefix: urlOptions?.prefix,
    params: urlOptions?.params,
    codecs,
    pageSizes,
    sortKeys,
  };
  const urlKeys = [...URL_KEYS, ...Object.keys(codecs)];
  const replace = urlOptions?.replace ?? replaceHistory;

  const { persist } = options;
  const storage = persist
    ? safeBrowserStorage(
        persist.area === "session" ? "sessionStorage" : "localStorage",
      )
    : null;
  const persistKeys =
    persist?.pick ??
    [...BUILT_IN_KEYS, ...extraKeys].filter(
      (key) => !UNPERSISTED_KEYS.includes(key),
    );

  /** @type {TableState & Record<string, unknown>} */
  let current = copyState(config.defaults);
  let active = false;
  /** @type {ReturnType<typeof setTimeout> | number | null} */
  let frame = null;
  /** @type {string | undefined} */
  let lastStored;

  /**
   * @param {unknown} value
   * @param {boolean} [external] - A read from the URL or storage, not a user action
   */
  function commit(value, external = false) {
    const next = nextTableState(current, value, config, !external);
    if (next === current) return;
    current = next;
    // `bind:x={$store.f}` mutates the subscribed object and sets it back.
    // Subscribers get a copy, so the store never diffs against an object a
    // consumer can change.
    store.set(copyState(current));
    if (!external && active) {
      writeStorage();
      scheduleUrlWrite();
    }
  }

  function readStorage() {
    const raw = storage?.getItem(persist?.key ?? "");
    if (raw === null || raw === undefined) return undefined;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return undefined;
      }
      return Object.fromEntries(
        persistKeys
          .filter((key) => key in parsed)
          .map((key) => [key, parsed[key]]),
      );
    } catch {
      return undefined;
    }
  }

  function writeStorage() {
    if (!persist || !storage) return;
    const raw = JSON.stringify(
      Object.fromEntries(
        persistKeys
          .filter((key) => current[key] !== undefined)
          .map((key) => [key, current[key]]),
      ),
    );
    if (raw === lastStored) return;
    lastStored = raw;
    storage.setItem(persist.key, raw);
  }

  /**
   * The URL's value for each URL key. A key the URL leaves out falls back to
   * `base`.
   * @param {TableState & Record<string, unknown>} base
   */
  function readUrl(base) {
    const parsed = tableStateFromSearchParams(window.location.search, {
      ...urlParams,
      defaults: base,
    });
    return Object.fromEntries(urlKeys.map((key) => [key, parsed[key]]));
  }

  function writeUrl() {
    frame = null;
    const href = new URL(window.location.href);
    href.search = tableStateToSearchParams(current, {
      ...urlParams,
      defaults: config.defaults,
      base: href.search,
    }).toString();
    if (href.href !== window.location.href) replace(href.href);
  }

  // Safari rate-limits `history.replaceState`, so a burst of writes, such as
  // typing in a search box, becomes one `replace` per frame.
  function scheduleUrlWrite() {
    if (!urlOptions || frame !== null) return;
    frame =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame(writeUrl)
        : setTimeout(writeUrl, 16);
  }

  function handlePopstate() {
    commit({ ...current, ...readUrl(config.defaults) }, true);
  }

  // Reading from the URL and storage starts with the first subscriber and
  // stops with the last, and only in a browser. A subscriber gets the value
  // `start` sets before its first call, so there is no flash of the defaults.
  const store = writable(copyState(current), () => {
    if (typeof window === "undefined") return;
    active = true;
    let next = current;
    const stored = readStorage();
    if (stored) next = { ...next, ...stored };
    if (urlOptions) next = { ...next, ...readUrl(next) };
    commit(next, true);
    if (urlOptions) window.addEventListener("popstate", handlePopstate);

    return () => {
      if (urlOptions) window.removeEventListener("popstate", handlePopstate);
      if (frame !== null) {
        if (typeof requestAnimationFrame === "function") {
          cancelAnimationFrame(/** @type {number} */ (frame));
        } else clearTimeout(frame);
        writeUrl();
      }
      active = false;
    };
  });

  /**
   * Whether `next` differs from `prev` only in what typing in a search
   * changes: `search`, and the `page` it resets.
   * @param {TableState & Record<string, unknown>} prev
   * @param {TableState & Record<string, unknown>} next
   */
  function searchOnly(prev, next) {
    if (prev.search === next.search) return false;
    return Object.keys({ ...prev, ...next }).every(
      (key) =>
        key === "search" || key === "page" || deepEqual(prev[key], next[key]),
    );
  }

  // The state a request reads. It follows every change at once, except one
  // that only types in the search, which lands once typing pauses for
  // `searchDebounce` ms. A later change of any other kind flushes it.
  const settled = readable(copyState(current), (set) => {
    /** @type {ReturnType<typeof setTimeout> | null} */
    let timer = null;
    /** @type {null | (TableState & Record<string, unknown>)} */
    let last = null;
    const unsubscribe = store.subscribe((value) => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      if (last && searchDebounce > 0 && searchOnly(last, value)) {
        timer = setTimeout(() => {
          timer = null;
          last = value;
          set(value);
        }, searchDebounce);
        return;
      }
      last = value;
      set(value);
    });
    return () => {
      if (timer !== null) clearTimeout(timer);
      unsubscribe();
    };
  });

  return {
    subscribe: store.subscribe,
    settled: { subscribe: settled.subscribe },
    set: (value) => commit(value),
    update: (callback) => commit(callback(copyState(current))),
    patch: (partial) => commit({ ...current, ...partial }),
    reset: () => commit(config.defaults),
  };
}
