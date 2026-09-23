// @ts-check
import { writable } from "svelte/store";

/**
 * @template T
 * @typedef {Object} QueryParamOptions
 * @property {T} defaultValue Value used when the parameter is missing or
 *   invalid. Setting the store to this value removes the parameter.
 * @property {(raw: string) => T | undefined} [parse] Convert the raw
 *   parameter; return `undefined` to reject it. Defaults to coercing by the
 *   type of `defaultValue` (string, number, or boolean).
 * @property {(value: T) => string} [serialize] Convert a value to the
 *   parameter string. Defaults to `String`.
 * @property {(href: string) => void} [replace] Write the new URL. Defaults
 *   to `history.replaceState`; pass a router's navigation API instead.
 */

/**
 * @param {string} raw
 * @param {unknown} defaultValue
 */
function parseAsDefault(raw, defaultValue) {
  if (typeof defaultValue === "number") {
    const value = Number(raw);
    return raw.trim() !== "" && Number.isFinite(value) ? value : undefined;
  }
  if (typeof defaultValue === "boolean") {
    if (raw === "true") return true;
    if (raw === "false") return false;
    return undefined;
  }
  return raw;
}

/** @param {string} href */
function replaceHistory(href) {
  try {
    history.replaceState(history.state, "", href);
  } catch {
    // Some embedding contexts (a sandboxed iframe) block history updates.
  }
}

/**
 * A writable store mirrored to a URL query parameter. The initial value is
 * read from the URL; each `set` replaces the current history entry, so a
 * reload or shared link restores it without adding history entries.
 * Back/forward navigation re-reads the parameter while subscribed.
 *
 * Create it inside a component, not at module scope, so server-rendered
 * requests don't share one store.
 *
 * @template T
 * @param {string} key
 * @param {QueryParamOptions<T>} options
 * @returns {import("svelte/store").Writable<T>}
 */
export function queryParam(key, options) {
  const {
    defaultValue,
    parse,
    serialize = String,
    replace = replaceHistory,
  } = options;

  /** @returns {T} */
  function read() {
    if (typeof window === "undefined") return defaultValue;
    const raw = new URL(window.location.href).searchParams.get(key);
    if (raw === null) return defaultValue;
    const value = parse
      ? parse(raw)
      : /** @type {T | undefined} */ (parseAsDefault(raw, defaultValue));
    return value === undefined ? defaultValue : value;
  }

  /** @param {T} value */
  function write(value) {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const raw = serialize(value);
    // Compare serialized so a new-but-equal array or object also clears.
    if (raw === serialize(defaultValue)) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, raw);
    }
    if (url.href !== window.location.href) replace(url.href);
  }

  const store = writable(read(), (set) => {
    if (typeof window === "undefined") return;
    function handlePopstate() {
      set(read());
    }
    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  });

  return {
    subscribe: store.subscribe,
    set(value) {
      store.set(value);
      write(value);
    },
    update(callback) {
      store.update((value) => {
        const next = callback(value);
        write(next);
        return next;
      });
    },
  };
}
