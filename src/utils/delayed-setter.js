// @ts-check

/**
 * Create a canceling delayed-call scheduler for hover-intent style UI (e.g.
 * opening/closing a tooltip after a delay). Each call clears any pending
 * invocation before scheduling the next one; a non-positive `delay` runs
 * `callback` synchronously instead of queuing a timer.
 * @returns {((delay: number, callback: () => void) => void) & { cancel: () => void }}
 */
export function createDelayedSetter() {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeoutId;

  /**
   * @param {number} delay
   * @param {() => void} callback
   */
  function schedule(delay, callback) {
    clearTimeout(timeoutId);
    if (delay > 0) {
      timeoutId = setTimeout(callback, delay);
    } else {
      callback();
    }
  }

  schedule.cancel = () => {
    clearTimeout(timeoutId);
  };

  return schedule;
}
