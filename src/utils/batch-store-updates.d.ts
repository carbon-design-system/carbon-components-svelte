import type { Writable } from "svelte/store";

/**
 * Wrap a writable store's `update` so multiple synchronous calls made within
 * the same microtask collapse into a single flush, instead of notifying
 * subscribers once per call.
 */
export function batchStoreUpdates<T>(
  store: Writable<T>,
): (fn: (value: T) => T) => void;
