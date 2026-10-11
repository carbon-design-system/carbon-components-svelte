// @ts-check

import { createInitOrder } from "./init-order.js";

/**
 * Shared first-render selection for `Tabs`/`TabsVertical`. Tabs and panels
 * claim their position while they initialize, so the first render (and the
 * server render, where registration never flushes) already shows the
 * selected tab and panel and pairs their ids. Registration replaces these
 * once it flushes; for static children the two agree.
 *
 * `getSelection` is read at claim time. Call `close()` from the parent's
 * `onMount`; later claims return `undefined`.
 *
 * @param {object} params
 * @param {import("svelte/store").Writable<string | undefined>} params.selectedTab
 * @param {import("svelte/store").Writable<string | undefined>} params.selectedContent
 * @param {() => { selectedId: string | undefined; selectedIndex: number; hasContent: boolean }} params.getSelection
 * @returns {{
 *   claimTab: (id: string) => undefined | { panelId: string | undefined },
 *   claimPanel: (id: string, hasOwnId: boolean) => undefined | { id: string; tabId: string | undefined },
 *   close: () => void,
 * }}
 */
export function createTabsInitClaims({
  selectedTab,
  selectedContent,
  getSelection,
}) {
  /** @type {ReturnType<typeof createInitOrder<{ id: string; panelId: string | undefined }>>} */
  const initialTabs = createInitOrder();
  /** @type {ReturnType<typeof createInitOrder<string>>} */
  const initialPanels = createInitOrder();
  let initialSelectedIndex = -1;

  /**
   * Claim a tab's position. When there is a `content` slot, also reserve
   * the id of the panel at the same position, `{tabId}-panel`, so the tab
   * can point `aria-controls` at it before the panel renders. A panel with
   * its own `id` keeps it, so on the server the tab's `aria-controls` can
   * name an id that does not exist; registration corrects it after mount.
   * @param {string} id
   */
  function claimTab(id) {
    /** @type {{ id: string; panelId: string | undefined }} */
    const claimed = { id, panelId: undefined };
    const index = initialTabs.claim(claimed);
    if (index === undefined) return undefined;
    const { selectedId, selectedIndex, hasContent } = getSelection();
    const panelId = hasContent ? `${id}-panel` : undefined;
    claimed.panelId = panelId;
    const isSelected =
      selectedId === undefined ? index === selectedIndex : id === selectedId;
    if (isSelected && initialSelectedIndex === -1) {
      initialSelectedIndex = index;
      selectedTab.set(id);
    }
    return { panelId };
  }

  /**
   * Claim a panel's position. A panel without its own `id` takes the one
   * its tab reserved.
   * @param {string} id
   * @param {boolean} hasOwnId
   */
  function claimPanel(id, hasOwnId) {
    const index = initialPanels.claim(id);
    if (index === undefined) return undefined;
    const tab = initialTabs.at(index);
    const panelId = (!hasOwnId && tab?.panelId) || id;
    const { selectedId, selectedIndex } = getSelection();
    const isSelected =
      selectedId === undefined
        ? index === selectedIndex
        : index === initialSelectedIndex;
    if (isSelected) selectedContent.set(panelId);
    return { id: panelId, tabId: tab?.id };
  }

  function close() {
    initialTabs.close();
    initialPanels.close();
  }

  return { claimTab, claimPanel, close };
}
