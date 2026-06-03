// @ts-check

/**
 * Auto-close timer for notifications with a `timeout` prop.
 * `sync()` clears any pending timer and calls `setTimeout` when `open` and `timeout` > 0.
 * Skips `setTimeout` when `window` is undefined (SSR).
 *
 * @returns {{
 *   get timeoutId(): ReturnType<typeof setTimeout> | undefined,
 *   sync: (open: boolean, timeout: number, onTimeout: () => void) => void,
 *   clear: () => void,
 * }}
 */
export function createTimeoutDismiss() {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeoutId;

  return {
    get timeoutId() {
      return timeoutId;
    },
    /**
     * @param {boolean} open
     * @param {number} timeout
     * @param {() => void} onTimeout
     */
    sync(open, timeout, onTimeout) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
      if (typeof window !== "undefined" && open && timeout) {
        timeoutId = setTimeout(onTimeout, timeout);
      }
    },
    clear() {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    },
  };
}
