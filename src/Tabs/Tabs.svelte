<script>
  /**
   * @event {number} change
   * @event {{ id: string; label: string; disabled: boolean; hasSecondaryLabel: boolean; index: number }} dismiss
   */

  /**
   * Specify the selected tab index.
   * Prefer `selectedId` when tabs can be added, removed or reordered: an
   * index then points at a different tab. Ignored when `selectedId` is set.
   * @bindable writable
   */
  export let selected = 0;

  /**
   * Specify the selected tab by id. Prefer it to `selected`.
   * When set, takes precedence over `selected` and stays on the same logical
   * tab as tabs are added or removed. Pair with a stable `id` on each `Tab`.
   * @bindable writable
   * @type {string | undefined}
   */
  export let selectedId = undefined;

  /**
   * Choose whether arrow keys change the selection on focus.
   * Defaults to `"automatic"`. Set to `"manual"` so arrow keys only move
   * focus; press Enter or Space to select.
   * Ignored when `navigation` is set.
   * @type {"automatic" | "manual"}
   */
  export let activation = "automatic";

  /**
   * Specify the type of tabs.
   * @type {"default" | "container"}
   */
  export let type = "default";

  /**
   * Set to `true` to render the tabs as page navigation: a list of links
   * where the selected link has `aria-current="page"`, instead of a tab list
   * that switches panels in place. Links keep the browser's Tab order and
   * arrow keys do not move between them. Give each `Tab` an `href`, set
   * `selected` or `selectedId` from the current route, and label the
   * navigation with `aria-label`.
   */
  export let navigation = false;

  /** Set to `true` for tabs to have an auto-width */
  export let autoWidth = false;

  /** Set to `true` to render a dismiss button for each tab */
  export let dismissible = false;

  /**
   * Specify the accessible name of each tab's dismiss button.
   * Receives the tab's `label`, which is empty when the tab has none.
   * @type {(label: string) => string}
   */
  export let dismissText = function dismissText(label) {
    return label ? `Dismiss ${label}` : "Dismiss tab";
  };

  /** Set to `true` for tabs to span the full width of the container */
  export let fullWidth = false;

  /**
   * Set to `true` to render icon-only tabs.
   * Each `Tab` displays only its `icon`; the `label` is used as the accessible
   * name and the tooltip shown on hover and focus.
   */
  export let iconOnly = false;

  /**
   * Specify the icon size for icon-only tabs.
   * `"lg"` uses the large scale (48px tabs with a 20px icon);
   * the default scale is 40px tabs with a 16px icon.
   * Only applies when `iconOnly` is `true`.
   * @type {"default" | "lg"}
   */
  export let iconSize = "default";

  /**
   * Specify the size of the tabs. Unset by default, which preserves the
   * original unsized height. Line tabs (`type="default"`) support up to
   * `"lg"`; container tabs support the full range up to `"xl"` — an
   * out-of-range value clamps to the type's max.
   * @type {"sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { derived, get, writable } from "svelte/store";
  import ChevronLeft from "../icons/ChevronLeft.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import {
    computeScrollOverflow,
    scrollByViewport,
    scrollIntoViewX,
  } from "../utils/horizontal-scroll.js";
  import { keyBy } from "../utils/key-by.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { noop } from "../utils/noop.js";
  import { observeDomOrder } from "../utils/observe-dom-order.js";
  import { resolveIdSelection } from "../utils/resolve-id-selection.js";
  import { resolveTabsSize } from "../utils/resolve-tabs-size.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { syncDomOrder } from "../utils/sync-dom-order.js";
  import { createTabsInitClaims } from "../utils/tabs-init-claims.js";
  import { createTabsRegistration } from "../utils/tabs-registration.js";
  import { provideTooltipGroup } from "../utils/tooltip-group.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<{ id: string; label: string; disabled: boolean; hasSecondaryLabel: boolean; index: number }>>}
   */
  const tabs = writable([]);
  /** @type {import("svelte/store").Readable<Record<string, { id: string; label: string; disabled: boolean; hasSecondaryLabel: boolean; index: number }>>} */
  const tabsById = derived(tabs, (_) => keyBy(_));
  /**
   * @type {import("svelte/store").Writable<boolean>}
   */
  const useAutoWidth = writable(autoWidth);
  /**
   * @type {import("svelte/store").Writable<boolean>}
   */
  const useFullWidth = writable(fullWidth);
  /**
   * @type {import("svelte/store").Writable<boolean>}
   */
  const useDismissible = writable(dismissible);
  /**
   * @type {import("svelte/store").Writable<(label: string) => string>}
   */
  const useDismissText = writable(dismissText);
  /**
   * @type {import("svelte/store").Writable<boolean>}
   */
  const useContainer = writable(type === "container");
  /**
   * @type {import("svelte/store").Writable<boolean>}
   */
  const useNavigation = writable(navigation);
  /**
   * @type {import("svelte/store").Writable<string | undefined>}
   */
  const selectedTab = writable(undefined);
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<{ id: string; index: number }>>}
   */
  const content = writable([]);
  /**
   * @type {import("svelte/store").Readable<Record<string, { id: string; index: number }>>}
   */
  const contentById = derived(content, (_) => keyBy(_));
  /**
   * Reverse lookup so each `Tab` can find its paired panel id by index.
   * @type {import("svelte/store").Readable<Record<number, string>>}
   */
  const contentByIndex = derived(content, (_) => {
    /** @type {Record<number, string>} */
    const map = {};
    for (const item of _) map[item.index] = item.id;
    return map;
  });
  /**
   * @type {import("svelte/store").Writable<string | undefined>}
   */
  const selectedContent = writable(undefined);
  // Icon-only tabs hand their tooltips off to each other, and to the rest
  // of an enclosing `TooltipGroup`.
  provideTooltipGroup();

  /** @type {null | HTMLUListElement} */
  let refTabList = null;
  /** @type {null | HTMLDivElement} */
  let refRoot = null;

  // Carbon React v11 replaces the legacy mobile dropdown with a horizontally
  // scrollable tab list plus overflow navigation buttons. The buttons appear
  // only when the list overflows, and each one hides once that edge is reached.
  let canScrollBackward = false;
  let canScrollForward = false;
  $: isOverflow = canScrollBackward || canScrollForward;

  function updateOverflow() {
    if (!refTabList) return;
    const { scrollLeft, scrollWidth, clientWidth } = refTabList;
    // forwardEpsilon absorbs sub-pixel widths. Firefox can report scrollWidth
    // 1px larger than clientWidth with nowhere to scroll; ignore that gap so
    // the forward button does not flicker in.
    ({ canScrollBackward, canScrollForward } = computeScrollOverflow({
      scrollLeft,
      scrollWidth,
      clientWidth,
      forwardEpsilon: 1,
    }));
  }

  let mounted = false;
  let stopObserving = noop;

  // Observing queues a measurement that runs with every other instance's in
  // one batch after layout, instead of forcing a layout per instance. Observing
  // again queues a fresh one.
  function observeOverflow() {
    stopObserving();
    stopObserving = refTabList
      ? observeResize(refTabList, handleListResize)
      : noop;
  }

  // The scroll buttons appear or hide once the list overflows, and that
  // moves the list's edges after a tab was scrolled into view. Keys
  // pressed before the first measurement leave the focused tab under a
  // button, so bring it back on each resize.
  function handleListResize() {
    updateOverflow();
    const focused = refTabList?.ownerDocument.activeElement;
    if (
      focused instanceof HTMLElement &&
      focused.matches("[role='tab']") &&
      refTabList.contains(focused)
    ) {
      scrollTabIntoView(focused);
    }
  }

  function remeasureOverflow() {
    if (mounted) observeOverflow();
  }

  // Flag to trigger DOM reordering only when tabs change.
  // This is necessary to avoid infinite loops in Svelte 5.
  let needsDomSync = false;

  /** @type {import("svelte/store").Readable<boolean>} */
  const hasSecondaryLabel = derived(
    [tabs, useContainer],
    ([_, container]) => container && _.some((tab) => tab.hasSecondaryLabel),
  );

  /**
   * Mirror the `iconOnly` prop into the context so each `Tab` reacts to it.
   * @type {import("svelte/store").Writable<boolean>}
   */
  const useIconOnly = writable(iconOnly);

  // Batch child registration. Leave afterUpdate's syncDomOrder unbatched
  // so DOM-order correction stays synchronous.
  //
  // Set needsDomSync inside the batched update. afterUpdate runs once
  // after mount before this flush, while tabs is still [].
  const registration = createTabsRegistration({
    tabs,
    content,
    onDomSyncNeeded: () => {
      needsDomSync = true;
    },
  });

  /**
   * @type {(data: {
   *   id: string;
   *   label: string;
   *   disabled: boolean;
   *   hasSecondaryLabel: boolean;
   * }) => void}
   */
  const add = registration.add;
  /** @type {(id: string) => void} */
  const remove = registration.remove;
  /** @type {(data: { id: string }) => void} */
  const addContent = registration.addContent;
  /** @type {(id: string) => void} */
  const removeContent = registration.removeContent;

  // Tabs and panels claim their position while they initialize, so the
  // first render (server included) shows the selection. Closed on mount.
  const initialClaims = createTabsInitClaims({
    selectedTab,
    selectedContent,
    getSelection: () => ({
      selectedId,
      selectedIndex,
      hasContent: !!$$slots.content,
    }),
  });
  /** @type {(id: string) => undefined | { panelId: string | undefined }} */
  const claimTab = initialClaims.claimTab;
  /** @type {(id: string, hasOwnId: boolean) => undefined | { id: string; tabId: string | undefined }} */
  const claimPanel = initialClaims.claimPanel;

  /**
   * @type {(id: string) => void}
   */
  function update(id) {
    focusedIndex = -1;
    if (selectedId !== undefined) {
      selectedId = id;
      return;
    }
    // Ignore clicks that land before this tab's batched registration flushes.
    const tab = $tabsById[id];
    if (!tab) return;
    selectedIndex = tab.index;
  }

  /**
   * Resolve selection from `selectedId` when set; otherwise use `selected`.
   * If the selected id was removed, keep the same index (next tab) or clamp.
   * @type {() => void}
   */
  function syncSelection() {
    if (selectedId === undefined) {
      selectedIndex = selected;
      return;
    }

    const resolved = resolveIdSelection({
      items: $tabs,
      selectedId,
      currentIndex: selectedIndex,
    });
    if (!resolved) return;
    selectedIndex = resolved.index;
    selectedId = resolved.id;
  }

  /**
   * Dispatch `dismiss`. When the handler removes the focused tab, move focus
   * to the tab that took its place (or the new last tab) instead of `<body>`.
   * @type {(id: string) => Promise<void>}
   */
  async function dismiss(id) {
    const tab = get(tabsById)[id];
    if (!tab) return;

    const doc = refTabList?.ownerDocument;
    const hadFocus = Boolean(doc && refTabList.contains(doc.activeElement));
    dispatch("dismiss", tab);
    if (!hadFocus) return;

    // Let the handler's removal render, then keep focus in the list.
    await tick();
    if (!refTabList || (doc.activeElement && doc.activeElement !== doc.body)) {
      return;
    }

    const items = refTabList.querySelectorAll(".bx--tabs__nav-link");
    if (items.length === 0) return;
    const next = /** @type {HTMLElement} */ (
      items[Math.min(tab.index, items.length - 1)]
    );
    next.focus({ preventScroll: true });
    scrollTabIntoView(next);
  }

  /**
   * Keep a focused tab clear of the overflow chevrons / edge fades.
   * @type {number}
   */
  const SCROLL_INTO_VIEW_MARGIN = 48;

  /**
   * Scroll the tab list so `tab` is fully visible, inset from each edge so it is
   * not tucked under an overflow button. The browser's native focus scroll moves
   * a fixed step that lags variable-width tabs, eventually pushing the focused
   * tab off-screen, so selection is scrolled explicitly instead.
   * @type {(tab: HTMLElement | undefined) => void}
   */
  function scrollTabIntoView(tab) {
    scrollIntoViewX(refTabList, tab, SCROLL_INTO_VIEW_MARGIN);
  }

  /**
   * Focus a tab at an absolute index without changing selection.
   * @type {(index: number) => Promise<void>}
   */
  async function focusTab(index) {
    if (index < 0 || index >= $tabs.length) return;
    focusedIndex = index;

    await tick();
    const activeTab = /** @type {HTMLElement | undefined} */ (
      refTabList?.querySelectorAll("[role='tab']")[index]
    );
    activeTab?.focus({ preventScroll: true });
    scrollTabIntoView(activeTab);
  }

  /**
   * Arrow keys move from the tab that holds focus. Fall back to the
   * manual-mode focus index, then the selection, when focus is elsewhere.
   * @type {() => number}
   */
  function getActiveIndex() {
    const items = refTabList
      ? Array.from(refTabList.querySelectorAll("[role='tab']"))
      : [];
    const index = items.indexOf(
      /** @type {Element} */ (refTabList?.ownerDocument.activeElement),
    );
    if (index >= 0) return index;
    return focusedIndex >= 0 ? focusedIndex : selectedIndex;
  }

  /**
   * Move selection/focus to a tab at an absolute index. Roving focus resolves
   * the index (skipping disabled, wrapping); selection follows focus.
   * @type {(index: number) => Promise<void>}
   */
  async function selectTab(index) {
    focusedIndex = -1;
    if (index !== selectedIndex) {
      if (selectedId === undefined) {
        selectedIndex = index;
      } else {
        const tab = $tabs[index];
        if (!tab) return;
        selectedId = tab.id;
      }
    }

    await tick();
    const activeTab = /** @type {HTMLElement | undefined} */ (
      refTabList?.querySelectorAll("[role='tab']")[index]
    );
    activeTab?.focus({ preventScroll: true });
    scrollTabIntoView(activeTab);
  }

  const tabsContext = {
    tabs,
    tabsById,
    contentById,
    contentByIndex,
    selectedTab,
    selectedContent,
    iconOnly: useIconOnly,
    useAutoWidth,
    useFullWidth,
    useDismissible,
    useDismissText,
    useContainer,
    navigation: useNavigation,
    secondaryLabelSupported: useContainer,
    hasSecondaryLabel,
    add,
    remove,
    addContent,
    removeContent,
    claimTab,
    claimPanel,
    update,
    dismiss,
  };

  setContext("carbon:Tabs", tabsContext);

  // Lets `TabContent` in a `PageHeader` body pair with tabs slotted into
  // its header; panels then live in the body, not beside these tabs.
  /** @type {undefined | { getBody: () => HTMLElement | null; setType: (type: string) => void; unregister: () => void }} */
  const pageHeader = getContext("carbon:PageHeader")?.registerTabs(tabsContext);

  $: pageHeader?.setType(type);

  /**
   * Sort the tab and panel registries into DOM order.
   * @type {() => void}
   */
  function syncOrder() {
    tabs.update((currentTabs) =>
      syncDomOrder({
        root: refTabList,
        selector: ".bx--tabs__nav-link",
        items: currentTabs,
      }),
    );

    const pageHeaderBody = pageHeader?.getBody();

    if (pageHeaderBody) {
      content.update((currentContent) =>
        syncDomOrder({
          root: pageHeaderBody,
          selector: ":scope > [role='tabpanel']",
          items: currentContent,
        }),
      );
    } else if (refRoot?.parentElement) {
      content.update((currentContent) =>
        syncDomOrder({
          root: refRoot.parentElement,
          selector: "[role='tabpanel']",
          items: currentContent,
        }),
      );
    }

    // Re-resolve after reorder so `selectedId` keeps the same logical tab.
    if (selectedId !== undefined) {
      syncSelection();
    }
  }

  afterUpdate(() => {
    // Sync DOM order with stores only when tabs are added/removed.
    // This avoids infinite loops in Svelte 5 by not running on every update.
    if (needsDomSync && refTabList) {
      needsDomSync = false;
      syncOrder();
    }

    if (selected !== selectedIndex) {
      selected = selectedIndex;
    }

    if (prevIndex > -1 && prevIndex !== selectedIndex) {
      dispatch("change", selectedIndex);
    }

    // Seed only once tabs register: until then, a `selectedId` past the
    // first tab can't resolve, and its resolution would look like a change.
    if ($tabs.length > 0) prevIndex = selectedIndex;
  });

  onMount(() => {
    initialClaims.close();
    mounted = true;
    observeOverflow();
    // A keyed reorder moves tabs without re-registering them. Keep the
    // selected tab selected at its new index. An insert or removal syncs in
    // afterUpdate instead, which keeps the index.
    const stopObservingOrder = observeDomOrder(refTabList, {
      selector: ".bx--tabs__nav-link",
      getItems: () => get(tabs),
      onReorder: () => {
        if (needsDomSync) return;
        const id = get(selectedTab);
        syncOrder();
        const tab = id === undefined ? undefined : get(tabsById)[id];
        if (selectedId === undefined && tab) selected = tab.index;
      },
    });
    return () => {
      mounted = false;
      stopObserving();
      stopObservingOrder();
      pageHeader?.unregister();
    };
  });

  let selectedIndex = selected;
  let focusedIndex = -1;
  let prevIndex = -1;

  $: {
    if (selectedId === undefined) {
      selectedIndex = selected;
    } else {
      syncSelection();
    }
    focusedIndex = -1;
  }
  $: currentTab = $tabs[selectedIndex] || undefined;
  $: currentContent = $content[selectedIndex] || undefined;
  $: {
    if (currentTab) {
      selectedTab.set(currentTab.id);
    }

    if (currentContent) {
      selectedContent.set(currentContent.id);
    }
  }
  // Recompute overflow when the set of tabs changes (added/removed/relabeled).
  $: if ($tabs) {
    tick().then(remeasureOverflow);
  }
  $: useAutoWidth.set(autoWidth);
  $: useFullWidth.set(fullWidth);
  $: useDismissible.set(dismissible);
  $: useDismissText.set(dismissText);
  $: useContainer.set(type === "container");
  $: useNavigation.set(navigation);
  $: useIconOnly.set(iconOnly);

  $: maxSizeIndex = type === "container" ? 3 : 2;
  $: resolvedSize = resolveTabsSize(size, maxSizeIndex);
</script>

<div
  bind:this={refRoot}
  role="navigation"
  class:bx--tabs={true}
  class:bx--tabs--container={type === "container"}
  class:bx--tabs--line={type !== "container"}
  class:bx--tabs--tall={$hasSecondaryLabel}
  class:bx--tabs--full-width={fullWidth}
  class:bx--tabs--dismissible={dismissible}
  class:bx--tabs--icon-only={iconOnly}
  class:bx--tabs__icon--lg={iconOnly && iconSize === "lg"}
  class:bx--tabs--scrollable={isOverflow}
  class:bx--tabs--scrollable--container={isOverflow && type === "container"}
  class:bx--layout--size-sm={resolvedSize === "sm"}
  class:bx--layout--size-md={resolvedSize === "md"}
  class:bx--layout--size-lg={resolvedSize === "lg"}
  class:bx--layout--size-xl={resolvedSize === "xl"}
  {...$$restProps}
>
  {#if isOverflow}
    <button
      type="button"
      tabindex="-1"
      aria-hidden="true"
      class:bx--tab--overflow-nav-button={true}
      class:bx--tab--overflow-nav-button--previous={true}
      class:bx--tab--overflow-nav-button--hidden={!canScrollBackward}
      on:click={() => scrollByViewport(refTabList, -1)}
    >
      <ChevronLeft />
    </button>
    <div
      class:bx--tabs__overflow-indicator--left={true}
      class:bx--tab--overflow-nav-button--hidden={!canScrollBackward}
    ></div>
  {/if}
  <ul
    bind:this={refTabList}
    role={navigation ? undefined : "tablist"}
    use:rovingFocus={{
      // Navigation links have no tab role, so arrow keys leave them alone.
      selector: "[role='tab']",
      orientation: "horizontal",
      skipDisabled: true,
      getActiveIndex,
      rtl: () => resolveLayoutDirection($layoutDirection, refTabList) === "rtl",
      onMove: (index, event) => {
        // Alt/Ctrl/Meta+Arrow belong to the browser (Alt/Cmd+Left is Back).
        if (hasModifierKey(event)) return;
        // Prevent the arrow keys from also scrolling the page.
        event.preventDefault();
        if (activation === "manual") {
          focusTab(index);
        } else {
          selectTab(index);
        }
      },
    }}
    class:bx--tabs__nav={true}
    on:scroll={updateOverflow}
  >
    <slot />
  </ul>
  {#if isOverflow}
    <div
      class:bx--tabs__overflow-indicator--right={true}
      class:bx--tab--overflow-nav-button--hidden={!canScrollForward}
    ></div>
    <button
      type="button"
      tabindex="-1"
      aria-hidden="true"
      class:bx--tab--overflow-nav-button={true}
      class:bx--tab--overflow-nav-button--next={true}
      class:bx--tab--overflow-nav-button--hidden={!canScrollForward}
      on:click={() => scrollByViewport(refTabList, 1)}
    >
      <ChevronRight />
    </button>
  {/if}
</div>
<slot name="content" />
