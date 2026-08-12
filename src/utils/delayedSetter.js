// @ts-check

/**
 * Create a canceling delayed-call scheduler for hover-intent style UI (e.g.
 * opening/closing a tooltip after a delay). Each call clears any pending
 * invocation before scheduling the next one; a non-positive `delay` runs
 * `fn` synchronously instead of queuing a timer.
 * @returns {((delay: number, fn: () => void) => void) & { cancel: () => void }}
 */
export function createDelayedSetter() {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeoutId;

  /**
   * @param {number} delay
   * @param {() => void} fn
   */
  function schedule(delay, fn) {
    clearTimeout(timeoutId);
    if (delay > 0) {
      timeoutId = setTimeout(fn, delay);
    } else {
      fn();
    }
  }

  schedule.cancel = () => {
    clearTimeout(timeoutId);
  };

  return schedule;
}
