// @ts-check

/**
 * Wrap a writable store's `update` so multiple synchronous calls made within
 * the same microtask (e.g. every child of a list registering itself from
 * its own script body during one synchronous mount pass) collapse into a
 * single flush, instead of notifying subscribers once per call. Only the
 * returned function is batched — call `store.update()` directly elsewhere
 * for an immediate, unbatched update.
 *
 * Call `flush` on the returned function to apply pending updates now, e.g.
 * before reading the store right after `await tick()`: on Svelte 3 and 4
 * that resolves before the microtask that would flush registrations made
 * by children mounted in the same update.
 *
 * @template T
 * @param {import("svelte/store").Writable<T>} store
 * @returns {((callback: (value: T) => T) => void) & { flush: () => void }}
 */
export function batchStoreUpdates(store) {
  /** @type {Array<(value: T) => T>} */
  let pending = [];
  let scheduled = false;

  function flush() {
    scheduled = false;
    if (pending.length === 0) return;
    const ops = pending;
    pending = [];
    store.update((value) =>
      ops.reduce((acc, callback) => callback(acc), value),
    );
  }

  /** @param {(value: T) => T} callback */
  function batchedUpdate(callback) {
    pending.push(callback);
    if (!scheduled) {
      scheduled = true;
      Promise.resolve().then(flush);
    }
  }

  batchedUpdate.flush = flush;
  return batchedUpdate;
}
