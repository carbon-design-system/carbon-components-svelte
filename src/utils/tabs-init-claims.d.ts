import type { Writable } from "svelte/store";

/**
 * Shared first-render selection for `Tabs`/`TabsVertical`. Tabs and panels
 * claim their position while they initialize, so the first render (and the
 * server render) already shows the selected tab and panel and pairs their
 * ids. Registration replaces these once it flushes.
 *
 * `getSelection` is read at claim time. Call `close()` from the parent's
 * `onMount`; later claims return `undefined`.
 */
export function createTabsInitClaims(params: {
  selectedTab: Writable<string | undefined>;
  selectedContent: Writable<string | undefined>;
  getSelection: () => {
    selectedId: string | undefined;
    selectedIndex: number;
    hasContent: boolean;
  };
}): {
  claimTab: (id: string) => undefined | { panelId: string | undefined };
  claimPanel: (
    id: string,
    hasOwnId: boolean,
  ) => undefined | { id: string; tabId: string | undefined };
  close: () => void;
};
