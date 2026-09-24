// @ts-check

import { batchStoreUpdates } from "./batch-store-updates.js";

/**
 * Shared, batched child-registration logic for `Tabs`/`TabsVertical`: adds
 * and removes tabs and their paired content panels into/from the given
 * stores. Registrations made within the same microtask (every tab/panel
 * registering itself during one synchronous mount pass) are batched into a
 * single store flush. Calls `onDomSyncNeeded()` whenever the DOM order
 * needs to be resynced afterwards (an insert or removal, not a same-id
 * re-registration).
 *
 * @template {{ id: string }} Tab
 * @template {{ id: string }} Content
 * @param {object} params
 * @param {import("svelte/store").Writable<ReadonlyArray<Tab & { index: number }>>} params.tabs
 * @param {import("svelte/store").Writable<ReadonlyArray<Content & { index: number }>>} params.content
 * @param {() => void} params.onDomSyncNeeded
 * @returns {{
 *   add: (data: Tab) => void,
 *   remove: (id: string) => void,
 *   addContent: (data: Content) => void,
 *   removeContent: (id: string) => void,
 * }}
 */
export function createTabsRegistration({ tabs, content, onDomSyncNeeded }) {
  const batchedTabsUpdate = batchStoreUpdates(tabs);
  const batchedContentUpdate = batchStoreUpdates(content);

  /** @param {Tab} data */
  function add(data) {
    batchedTabsUpdate((_) => {
      // A tab re-registers when its props change. Check the batched
      // accumulator, not the derived store: a same-batch registration is
      // not in it yet. Only an insert needs a DOM-order sync.
      const index = _.findIndex((tab) => tab.id === data.id);
      if (index !== -1) {
        return _.map((tab, i) => (i === index ? { ...tab, ...data } : tab));
      }
      onDomSyncNeeded();
      return [..._, { ...data, index: _.length }];
    });
  }

  /** @param {string} id */
  function remove(id) {
    batchedTabsUpdate((_) => {
      onDomSyncNeeded();
      return _.filter((tab) => tab.id !== id);
    });
  }

  /** @param {Content} data */
  function addContent(data) {
    batchedContentUpdate((_) => {
      onDomSyncNeeded();
      return [..._, { ...data, index: _.length }];
    });
  }

  /** @param {string} id */
  function removeContent(id) {
    batchedContentUpdate((_) => {
      onDomSyncNeeded();
      return _.filter((item) => item.id !== id);
    });
  }

  return { add, remove, addContent, removeContent };
}
