// @ts-check

import { writable } from "svelte/store";
import { batchStoreUpdates } from "./batch-store-updates.js";

/**
 * A writable-array registry of DOM nodes: push on register, filter out
 * on unregister. Registrations made within the same microtask (e.g.
 * every child of a list registering itself from its own script body
 * during one synchronous mount pass) are batched into a single store
 * flush.
 *
 * @returns {{
 *   items: import("svelte/store").Writable<ReadonlyArray<HTMLElement>>,
 *   register: (node: HTMLElement) => void,
 *   unregister: (node: HTMLElement) => void,
 * }}
 */
export function createDomNodeRegistry() {
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<HTMLElement>>}
   */
  const items = writable([]);
  const batchedUpdate = batchStoreUpdates(items);

  return {
    items,
    register(node) {
      batchedUpdate((current) => [...current, node]);
    },
    unregister(node) {
      batchedUpdate((current) => current.filter((item) => item !== node));
    },
  };
}
