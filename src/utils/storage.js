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

/**
 * Use localStorage or sessionStorage without throwing. getItem is null when
 * there is no window, storage is blocked, or the read throws. setItem is
 * false when the write throws. removeItem and clear ignore errors.
 * @param {"localStorage" | "sessionStorage"} type
 */
export function safeBrowserStorage(type) {
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
        return true;
      } catch (error) {
        onError?.(error);
        return false;
      }
    },
    /** @param {string} key */
    removeItem(key) {
      const s = store();
      try {
        s?.removeItem(key);
      } catch {}
    },
    clear() {
      const s = store();
      try {
        s?.clear();
      } catch {}
    },
  };
}
