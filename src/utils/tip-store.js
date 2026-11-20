// @ts-check
import { getContext, setContext } from "svelte";
import { writable } from "svelte/store";
import { safeBrowserStorage } from "./storage.js";
import { addPooledListener } from "./window-listener-pool.js";

/**
 * Where a tip store keeps the ids of the tips a user dismissed. `read` and
 * `write` may be asynchronous, as for preferences synced with a server.
 * `subscribe` reports changes made elsewhere (another tab) and returns a
 * function that stops listening.
 *
 * @typedef {Object} TipStorage
 * @property {() => string[] | Promise<string[]>} read
 * @property {(ids: string[]) => void | Promise<void>} write
 * @property {(callback: (ids: string[]) => void) => () => void} [subscribe]
 */

/**
 * @typedef {Object} TipStoreState
 * @property {boolean} ready `true` once the dismissed ids are known: from
 *   `initial`, or after the storage was read.
 * @property {ReadonlySet<string>} dismissed
 * @property {"hide" | "show"} pending What a tip renders while `ready` is
 *   `false`.
 */

/**
 * @typedef {Object} TipStoreOptions
 * @property {TipStorage} [storage] Defaults to `localTipStorage()`.
 * @property {string[]} [initial] Dismissed ids the server already knows, such
 *   as read from a cookie. The store is `ready` from the first render, so the
 *   server and the first client paint agree and nothing shifts.
 * @property {"hide" | "show"} [pending] What a tip renders until the stored
 *   ids are known, on the server and for the first client paint. `"hide"`
 *   (default) shows nothing, so a returning user never sees a tip flash and
 *   vanish. `"show"` prints the tip, so a new user's page never grows after
 *   load.
 * @property {(error: unknown) => void} [onError] Called when a read or a
 *   write fails. The dismissals still hold for the session.
 */

/**
 * @typedef {Object} TipStore
 * @property {import("svelte/store").Readable<TipStoreState>["subscribe"]} subscribe
 * @property {(ids: string | string[]) => void} dismiss
 * @property {(ids?: string | string[]) => void} reset
 * @property {(id: string) => boolean} isDismissed
 * @property {() => () => void} connect
 */

/** @param {unknown} value */
function toIds(value) {
  return Array.isArray(value)
    ? value.filter((id) => typeof id === "string")
    : [];
}

/** @param {string[] | string | undefined} ids */
function asList(ids) {
  return ids === undefined ? [] : typeof ids === "string" ? [ids] : ids;
}

/**
 * @param {ReadonlySet<string>} a
 * @param {ReadonlySet<string>} b
 */
function sameSet(a, b) {
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}

const CHANGE_EVENT = "carbon:tip-storage";

/**
 * Keep the dismissed ids in `localStorage` (or `sessionStorage`) as a JSON
 * array under `key`. A write also tells other stores on the page that share
 * the key, and the `storage` event tells those in other tabs, so a "Show tips
 * again" control resets every tip at once. With storage off or no `window`,
 * reads are empty and writes do nothing.
 *
 * @param {string} [key]
 * @param {"localStorage" | "sessionStorage"} [type]
 * @returns {TipStorage}
 */
export function localTipStorage(key = "carbon:tips", type = "localStorage") {
  const storage = safeBrowserStorage(type);

  function read() {
    const raw = storage.getItem(key);
    if (raw === null) return [];
    try {
      return toIds(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  return {
    read,
    write(ids) {
      storage.setItem(key, JSON.stringify(ids), (error) => {
        throw error;
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
      }
    },
    subscribe(callback) {
      const stopStorage = addPooledListener("storage", (event) => {
        const { key: changed, storageArea } = /** @type {StorageEvent} */ (
          event
        );
        if (storageArea && storageArea !== window[type]) return;
        // A null key means another document called clear().
        if (changed === null || changed === key) callback(read());
      });
      const stopLocal = addPooledListener(CHANGE_EVENT, (event) => {
        if (/** @type {CustomEvent} */ (event).detail === key) callback(read());
      });
      return () => {
        stopStorage();
        stopLocal();
      };
    },
  };
}

/**
 * Read the dismissed ids from a cookie header, as a server does before it
 * renders. Pass the result to `createTipStore({ initial })`.
 *
 * @param {string | null | undefined} cookieHeader
 * @param {string} [name]
 * @returns {string[]}
 */
export function parseTipCookie(cookieHeader, name = "carbon-tips") {
  if (!cookieHeader) return [];
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1 || part.slice(0, separator).trim() !== name) continue;
    try {
      return toIds(JSON.parse(decodeURIComponent(part.slice(separator + 1))));
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Keep the dismissed ids in a cookie, so the server can render a tip that was
 * dismissed already: nothing flashes and the page does not shift. Read it on
 * the server with `parseTipCookie`. The cookie is first-party and readable by
 * script, so keep only tip ids in it.
 *
 * @param {{ name?: string, maxAge?: number, path?: string }} [options]
 * @returns {TipStorage}
 */
export function cookieTipStorage(options = {}) {
  const { name = "carbon-tips", maxAge = 31536000, path = "/" } = options;
  return {
    read() {
      return typeof document === "undefined"
        ? []
        : parseTipCookie(document.cookie, name);
    },
    write(ids) {
      if (typeof document === "undefined") return;
      const secure = location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${name}=${encodeURIComponent(JSON.stringify(ids))}; Max-Age=${maxAge}; Path=${path}; SameSite=Lax${secure}`;
    },
  };
}

/**
 * Remember which tips a user dismissed, by tip id. Share one store between
 * the tips of a page with `setTipStore`, or pass it as the `store` prop.
 *
 * The store never reads its storage while it is created, so the server and
 * the first client render agree. A tip calls `connect()` in `onMount`, which
 * reads the storage once and keeps listening for changes from other tabs.
 * Until then a tip follows `pending`. Create the store inside a component,
 * not at module scope, so server-rendered requests don't share one.
 *
 * @param {TipStoreOptions} [options]
 * @returns {TipStore}
 */
export function createTipStore(options = {}) {
  const {
    storage = localTipStorage(),
    initial,
    pending = "hide",
    onError,
  } = options;

  /** @type {ReadonlySet<string>} */
  let dismissed = new Set(initial);
  let ready = initial !== undefined;
  let refs = 0;
  let loaded = false;
  let resets = 0;
  /** @type {undefined | (() => void)} */
  let stop;

  const state = writable(snapshot());

  /** @returns {TipStoreState} */
  function snapshot() {
    return { ready, dismissed, pending };
  }

  /**
   * @param {ReadonlySet<string>} next
   * @param {boolean} nextReady
   */
  function commit(next, nextReady) {
    if (nextReady === ready && sameSet(next, dismissed)) return;
    dismissed = next;
    ready = nextReady;
    state.set(snapshot());
  }

  /** @param {unknown} error */
  function fail(error) {
    if (onError) onError(error);
  }

  function persist() {
    try {
      const result = storage.write([...dismissed]);
      if (result && typeof result.then === "function") result.then(null, fail);
    } catch (error) {
      fail(error);
    }
  }

  /** @param {string[]} ids */
  function receive(ids) {
    commit(new Set(ids), true);
  }

  function load() {
    const started = resets;
    /** @param {string[]} ids */
    function apply(ids) {
      // A reset made while an async read ran wins over it. The first read adds
      // to what the server and the user already dismissed; a later one, after
      // every tip let go, replaces it, since the ids may have been reset.
      if (started !== resets) return commit(dismissed, true);
      commit(loaded ? new Set(ids) : new Set([...dismissed, ...ids]), true);
      loaded = true;
    }
    try {
      const result = storage.read();
      if (result && typeof (/** @type {any} */ (result).then) === "function") {
        /** @type {Promise<string[]>} */ (result).then(apply, (error) => {
          fail(error);
          apply([]);
        });
      } else {
        apply(/** @type {string[]} */ (result));
      }
    } catch (error) {
      fail(error);
      apply([]);
    }
  }

  return {
    subscribe: state.subscribe,
    dismiss(ids) {
      const list = asList(ids);
      if (list.every((id) => dismissed.has(id))) return;
      commit(new Set([...dismissed, ...list]), ready);
      persist();
    },
    reset(ids) {
      resets++;
      if (ids === undefined) {
        commit(new Set(), ready);
      } else {
        const list = new Set(asList(ids));
        commit(new Set([...dismissed].filter((id) => !list.has(id))), ready);
      }
      persist();
    },
    isDismissed: (id) => dismissed.has(id),
    connect() {
      refs++;
      if (refs === 1) {
        load();
        stop = storage.subscribe?.(receive);
      }
      let released = false;
      return () => {
        if (released) return;
        released = true;
        refs--;
        if (refs === 0) {
          stop?.();
          stop = undefined;
        }
      };
    },
  };
}

const CONTEXT_KEY = "carbon:TipStore";

/**
 * Share a tip store with every `InlineTip` and `Guidebanner` below the
 * calling component. Call it while a component initializes.
 *
 * @param {TipStore} store
 */
export function setTipStore(store) {
  setContext(CONTEXT_KEY, store);
}

/**
 * The store `setTipStore` shared with this component, if any.
 *
 * @returns {TipStore | undefined}
 */
export function getTipStore() {
  return getContext(CONTEXT_KEY);
}

/**
 * The wiring `InlineTip` and `Guidebanner` share. Call it while the component
 * initializes. `resolve` picks the store: the `store` prop, then the one
 * `setTipStore` shared, then one of the component's own. `connect` reads the
 * stored dismissals once the component is mounted, never while the server or
 * the first client render runs, so both agree. A component that has no id to
 * remember passes `false` and leaves the storage alone.
 *
 * @returns {{
 *   resolve: (given: TipStore | undefined) => TipStore,
 *   connect: (store: TipStore, enabled: boolean) => void,
 *   release: () => void,
 * }}
 */
export function createTipStoreBinding() {
  const shared = getTipStore();
  /** @type {TipStore | undefined} */
  let own;
  /** @type {TipStore | undefined} */
  let connected;
  /** @type {undefined | (() => void)} */
  let disconnect;

  function release() {
    if (disconnect) disconnect();
    connected = undefined;
    disconnect = undefined;
  }

  return {
    resolve(given) {
      if (given) return given;
      if (shared) return shared;
      if (!own) own = createTipStore();
      return own;
    },
    connect(store, enabled) {
      const target = enabled ? store : undefined;
      if (target === connected) return;
      release();
      connected = target;
      disconnect = target?.connect();
    },
    release,
  };
}
