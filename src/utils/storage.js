// @ts-check

/**
 * JSON.parse the string; return it unchanged if parse fails.
 * @param {string} raw
 * @returns {any}
 */
export function parseStoredValue(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/**
 * JSON.stringify objects (null included); String() for other values.
 * Strings that parseStoredValue would read back as something else ("123",
 * "true", '{"a":1}') are JSON-encoded; other strings stay raw, so values
 * stored by older versions read back unchanged.
 * @param {any} value
 * @returns {string}
 */
export function serializeStoredValue(value) {
  if (typeof value === "string" && parseStoredValue(value) !== value) {
    return JSON.stringify(value);
  }
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

// Storage events never fire in the document that made the change, so
// instances on the same page notify each other directly.
/** @type {Record<"localStorage" | "sessionStorage", Set<(key: string | null) => void>>} */
const peers = { localStorage: new Set(), sessionStorage: new Set() };

/**
 * Use localStorage or sessionStorage without throwing. getItem is null when
 * there is no window, storage is blocked, or the read throws. setItem is
 * false when the write throws. removeItem and clear ignore errors.
 * Successful changes are reported to listeners on other instances of the
 * same type (see `onPeerChange`).
 * @param {"localStorage" | "sessionStorage"} type
 */
export function safeBrowserStorage(type) {
  /** @type {null | ((key: string | null) => void)} */
  let listener = null;

  /** @param {string | null} key */
  function notifyPeers(key) {
    const self = listener;
    // Deliver after the current flush, like a storage event.
    queueMicrotask(() => {
      for (const peer of peers[type]) {
        if (peer !== self) peer(key);
      }
    });
  }

  function store() {
    try {
      if (typeof window === "undefined") return null;
      return window[type] ?? null;
    } catch {
      return null; // reading window[type] can throw when storage is off
    }
  }

  return {
    /**
     * @param {string} key
     * @returns {string | null}
     */
    getItem(key) {
      const s = store();
      if (!s) return null;
      try {
        return s.getItem(key);
      } catch {
        return null;
      }
    },
    /**
     * @param {string} key
     * @param {string} value
     * @param {(error: unknown) => void} [onError]
     * @returns {boolean}
     */
    setItem(key, value, onError) {
      const s = store();
      if (!s) return false;
      try {
        s.setItem(key, value);
        notifyPeers(key);
        return true;
      } catch (error) {
        onError?.(error);
        return false;
      }
    },
    /** @param {string} key */
    removeItem(key) {
      const s = store();
      if (!s) return;
      try {
        s.removeItem(key);
        notifyPeers(key);
      } catch {}
    },
    clear() {
      const s = store();
      if (!s) return;
      try {
        s.clear();
        notifyPeers(null);
      } catch {}
    },
    /**
     * Call `fn` after another instance of this type on the page sets or
     * removes a key (`fn(key)`) or clears storage (`fn(null)`). Replaces any
     * previous listener. Returns a function that removes it.
     * @param {(key: string | null) => void} fn
     * @returns {() => void}
     */
    onPeerChange(fn) {
      if (listener) peers[type].delete(listener);
      listener = fn;
      peers[type].add(fn);
      return () => {
        peers[type].delete(fn);
        if (listener === fn) listener = null;
      };
    },
  };
}
