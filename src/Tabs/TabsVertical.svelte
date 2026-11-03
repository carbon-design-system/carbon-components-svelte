<script>
  /**
   * @event {number} change
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
   * Set to `true` to render the tabs as page navigation: a list of links
   * where the selected link has `aria-current="page"`, instead of a tab list
   * that switches panels in place. Links keep the browser's Tab order and
   * arrow keys do not move between them. Give each `Tab` an `href`, set
   * `selected` or `selectedId` from the current route, label the navigation
   * with `aria-label`, and put the page in the `content` slot without
   * `TabContent`.
   */
  export let navigation = false;

  /**
   * Specify the size of the vertical tabs.
   * `"xl"` matches the default height.
   * @type {"sm" | "md" | "lg" | "xl"}
   */
  export let size = "xl";

  /**
   * Specify the orientation of the tab list.
   * By default, the tabs are a vertical column at the `md` breakpoint and up,
   * and collapse into a horizontal, scrollable row below it.
   * Set to `"vertical"` to always render the column, or `"horizontal"` to
   * always render the row.
   * @type {"horizontal" | "vertical" | undefined}
   */
  export let orientation = undefined;

  import {
    afterUpdate,
    createEventDispatcher,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { derived, get, readable, writable } from "svelte/store";
  import { breakpoints } from "../Breakpoint/breakpoints.js";
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

  // Vertical tabs are always the contained type, so a secondary label renders
  // whenever any tab provides one.
  /** @type {import("svelte/store").Readable<boolean>} */
  const hasSecondaryLabel = derived(tabs, (_) =>
    _.some((tab) => tab.hasSecondaryLabel),
  );

  // Below `md` the tabs switch from a vertical column to a horizontal,
  // scrollable row (Carbon React vertical-tabs responsive design), unless
  // `orientation` pins one layout. The query is the one the CSS compiles
  // `breakpoint-down(md)` to, so the keyboard orientation flips at the same
  // width as the layout (672px is already the column). Reading it during
  // init, not on mount, keeps the first render in step with the CSS.
  const belowMdQuery =
    typeof window === "undefined"
      ? undefined
      : window.matchMedia?.(`(max-width: ${breakpoints.md / 16 - 0.02}rem)`);
  let belowMd = belowMdQuery?.matches ?? false;

  // Vertical tabs do not support the auto-width, full-width, dismissible, or
  // icon-only variants. These stores satisfy the shared `Tab` context contract.
  const useAutoWidth = writable(false);
  const useFullWidth = writable(false);
  const useDismissible = writable(false);
  // Vertical tabs are never container type.
  const useContainer = writable(false);
  /**
   * @type {import("svelte/store").Writable<boolean>}
   */
  const useNavigation = writable(navigation);
  const useIconOnly = writable(false);
  // Icon-only tabs hand their tooltips off to each other, and to the rest
  // of an enclosing `TooltipGroup`.
  provideTooltipGroup();

  /** @type {null | HTMLUListElement} */
  let refTabList = null;
  /** @type {null | HTMLDivElement} */
  let refRoot = null;

  // The row layout reuses the same overflow scroll buttons as the horizontal
  // `Tabs`. The buttons only apply there (the column has no horizontal
  // overflow).
  let canScrollBackward = false;
  let canScrollForward = false;
  $: isRow = orientation === undefined ? belowMd : orientation === "horizontal";
  $: isOverflow = isRow && (canScrollBackward || canScrollForward);

  function updateOverflow() {
    if (!refTabList) return;
    const { scrollLeft, scrollWidth, clientWidth } = refTabList;
    // forwardEpsilon absorbs sub-pixel widths, as in `Tabs`. A browser can
    // report scrollWidth 1px larger than clientWidth plus scrollLeft with
    // nowhere left to scroll.
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
      isRow &&
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

  /**
   * Keep a focused tab clear of the overflow chevrons / edge fades.
   * @type {number}
   */
  const SCROLL_INTO_VIEW_MARGIN = 48;

  /**
   * Scroll the horizontal tab row so `tab` is fully visible, inset from each
   * edge so it is not tucked under an overflow button.
   * @type {(tab: HTMLElement | undefined) => void}
   */
  function scrollTabIntoView(tab) {
    scrollIntoViewX(refTabList, tab, SCROLL_INTO_VIEW_MARGIN);
  }

  // Flag to trigger DOM reordering only when tabs change.
  // This is necessary to avoid infinite loops in Svelte 5.
  let needsDomSync = false;

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
  // first render (server included) shows the selection. Otherwise the
  // selected tab renders unselected until registration flushes, and the
  // overflow check on mount reads layout in between, so its color fades in.
  // Closed on mount.
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

  // Vertical tabs are never dismissible; this no-op satisfies the `Tab` context.
  function dismiss() {}

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
    activeTab?.focus({ preventScroll: isRow });
    if (isRow) scrollTabIntoView(activeTab);
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
    // The row scrolls horizontally; disable the native focus scroll (a fixed
    // step that lags variable-width tabs) and scroll explicitly. The column
    // relies on the browser scrolling the page to the tab.
    activeTab?.focus({ preventScroll: isRow });
    if (isRow) scrollTabIntoView(activeTab);
  }

  setContext("carbon:Tabs", {
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
    useContainer,
    navigation: useNavigation,
    secondaryLabelSupported: readable(true),
    hasSecondaryLabel,
    add,
    remove,
    addContent,
    removeContent,
    claimTab,
    claimPanel,
    update,
    dismiss,
  });

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

    if (refRoot) {
      content.update((currentContent) =>
        syncDomOrder({
          root: refRoot,
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

    /** @type {(event: MediaQueryListEvent) => void} */
    const onBreakpointChange = (event) => {
      belowMd = event.matches;
    };
    belowMdQuery?.addEventListener("change", onBreakpointChange);

    return () => {
      mounted = false;
      stopObserving();
      stopObservingOrder();
      belowMdQuery?.removeEventListener("change", onBreakpointChange);
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
  // Roving focus follows the visual orientation: arrow Up/Down in the vertical
  // column, arrow Left/Right in the horizontal row.
  /** @type {"horizontal" | "vertical"} */
  $: listOrientation = isRow ? "horizontal" : "vertical";
  $: useNavigation.set(navigation);
  // Recompute overflow when the tabs change or the layout flips.
  $: if ($tabs || isRow) {
    tick().then(remeasureOverflow);
  }
</script>

<div
  bind:this={refRoot}
  class:bx--tabs--vertical-container={true}
  class:bx--tabs--vertical-container--responsive={orientation === undefined}
  class:bx--tabs--vertical-container--column={orientation === "vertical"}
>
  <div
    role="navigation"
    class:bx--tabs={true}
    class:bx--tabs--vertical={true}
    class:bx--tabs--vertical--responsive={orientation === undefined}
    class:bx--tabs--vertical--row={orientation === "horizontal"}
    class:bx--tabs--vertical--column={orientation === "vertical"}
    class:bx--tabs--tall={$hasSecondaryLabel}
    class:bx--tabs--scrollable={isOverflow}
    class:bx--tabs--scrollable--container={isOverflow}
    class:bx--layout--size-sm={size === "sm"}
    class:bx--layout--size-md={size === "md"}
    class:bx--layout--size-lg={size === "lg"}
    class:bx--layout--size-xl={size === "xl"}
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
      aria-orientation={navigation ? undefined : listOrientation}
      use:rovingFocus={{
        // Navigation links have no tab role, so arrow keys leave them alone.
        selector: "[role='tab']",
        orientation: listOrientation,
        skipDisabled: true,
        getActiveIndex,
        // Only Left and Right swap, in the row layout.
        rtl: () =>
          resolveLayoutDirection($layoutDirection, refTabList) === "rtl",
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
</div>
