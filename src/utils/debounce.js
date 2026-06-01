// @ts-check
/**
 * Create a debounced version of `fn` that postpones invocation until `delay`
 * milliseconds have elapsed since the last call. Repeated calls within that
 * window reset the timer, so `fn` runs once after activity settles, using the
 * arguments from the most recent call.
 *
 * The returned function exposes `cancel()` to discard a pending invocation
 * (e.g. on component teardown) and `flush()` to invoke a pending call
 * immediately.
 *
 * @template {(...args: any[]) => void} Fn
 * @param {Fn} fn - Function to debounce.
 * @param {number} delay - Quiet period in milliseconds before `fn` runs.
 * @returns {((...args: Parameters<Fn>) => void) & { cancel: () => void; flush: () => void }}
 */
export function debounce(fn, delay) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeoutId;
  /** @type {Parameters<Fn> | undefined} */
  let pendingArgs;

  /** @param {Parameters<Fn>} args */
  function debounced(...args) {
    pendingArgs = args;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      const args = pendingArgs;
      pendingArgs = undefined;
      if (args) fn(...args);
    }, delay);
  }

  debounced.cancel = () => {
    clearTimeout(timeoutId);
    timeoutId = undefined;
    pendingArgs = undefined;
  };

  debounced.flush = () => {
    if (timeoutId === undefined) return;
    clearTimeout(timeoutId);
    timeoutId = undefined;
    const args = pendingArgs;
    pendingArgs = undefined;
    if (args) fn(...args);
  };

  return debounced;
}
