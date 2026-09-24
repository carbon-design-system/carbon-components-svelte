import type { Writable } from "svelte/store";

/**
 * Shared, batched child-registration logic for `Tabs`/`TabsVertical`:
 * adds and removes tabs and their paired content panels into/from the
 * given stores. Registrations made within the same microtask are
 * batched into a single store flush. Calls `onDomSyncNeeded()` whenever
 * the DOM order needs to be resynced afterwards (an insert or removal,
 * not a same-id re-registration).
 */
export function createTabsRegistration<
  Tab extends { id: string },
  Content extends { id: string },
>(params: {
  tabs: Writable<ReadonlyArray<Tab & { index: number }>>;
  content: Writable<ReadonlyArray<Content & { index: number }>>;
  onDomSyncNeeded: () => void;
}): {
  add: (data: Tab) => void;
  remove: (id: string) => void;
  addContent: (data: Content) => void;
  removeContent: (id: string) => void;
};
