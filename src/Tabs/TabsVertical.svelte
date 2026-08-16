<script>
  /**
   * @event {number} change
   */

  /**
   * Specify the selected tab index.
   * Ignored when `selectedId` is set.
   * @bindable writable
   */
  export let selected = 0;

  /**
   * Specify the selected tab by id.
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
   * @type {"automatic" | "manual"}
   */
  export let activation = "automatic";

  /**
   * Specify the size of the vertical tabs.
   * `"xl"` matches the default height.
   * @type {"sm" | "md" | "lg" | "xl"}
   */
  export let size = "xl";

  import {
    afterUpdate,
    createEventDispatcher,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { derived, writable } from "svelte/store";
  import { breakpointObserver } from "../Breakpoint/breakpointObserver.js";
  import ChevronLeft from "../icons/ChevronLeft.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import { batchStoreUpdates } from "../utils/batchStoreUpdates.js";
  import { clampIndex } from "../utils/clampIndex.js";
  import { keyBy } from "../utils/keyBy.js";
  import { rovingFocus } from "../utils/rovingFocus.js";
  import { syncDomOrder } from "../utils/syncDomOrder.js";

  const dispatch = createEventDispatcher();

  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<{ id: string; label: string; disabled: boolean; hasSecondaryLabel: boolean; index: number }>>}
   */
  const tabs = writable([]);
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
  const hasSecondaryLabel = derived(tabs, (_) =>
    _.some((tab) => tab.hasSecondaryLabel),
  );

  // Below `md` the tabs switch from a vertical column to a horizontal,
  // scrollable row (Carbon React vertical-tabs responsive design).
  const belowMd = breakpointObserver().smallerThan("md");

  // Vertical tabs do not support the auto-width, full-width, dismissible, or
  // icon-only variants. These stores satisfy the shared `Tab` context contract.
  const useAutoWidth = writable(false);
  const useFullWidth = writable(false);
  const useDismissible = writable(false);
  const useIconOnly = writable(false);
  const activeTooltip = writable(undefined);

  let refTabList = null;
  let refRoot = null;

  // Below `md` the tab column collapses into a horizontal, scrollable row that
  // reuses the same overflow scroll buttons as the horizontal `Tabs`. The
  // buttons only apply there (a `md`+ column has no horizontal overflow).
  let canScrollBackward = false;
  let canScrollForward = false;
  $: isOverflow = $belowMd && (canScrollBackward || canScrollForward);

  function updateOverflow() {
    if (!refTabList) return;
    const { scrollLeft, scrollWidth, clientWidth } = refTabList;
    canScrollBackward = scrollLeft > 0;
    canScrollForward = Math.ceil(scrollLeft + clientWidth) < scrollWidth;
  }

  /**
   * Scroll the tab list by roughly a viewport width in the given direction.
   * @type {(direction: 1 | -1) => void}
   */
  function scrollTabs(direction) {
    if (!refTabList) return;
    refTabList.scrollBy({
      left: direction * refTabList.clientWidth * 0.75,
      behavior: "smooth",
    });
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
    if (!tab || !refTabList) return;

    const navRect = refTabList.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const leftOverflow =
      tabRect.left - (navRect.left + SCROLL_INTO_VIEW_MARGIN);
    const rightOverflow =
      tabRect.right - (navRect.right - SCROLL_INTO_VIEW_MARGIN);

    if (leftOverflow < 0) {
      refTabList.scrollLeft += leftOverflow;
    } else if (rightOverflow > 0) {
      refTabList.scrollLeft += rightOverflow;
    }
  }

  // Flag to trigger DOM reordering only when tabs change.
  // This is necessary to avoid infinite loops in Svelte 5.
  let needsDomSync = false;

  // Batch child registration. Leave afterUpdate's syncDomOrder unbatched
  // so DOM-order correction stays synchronous.
  //
  // Set needsDomSync inside the batched update. afterUpdate runs once
  // after mount before this flush, while tabs is still [].
  const batchedTabsUpdate = batchStoreUpdates(tabs);
  const batchedContentUpdate = batchStoreUpdates(content);

  /**
   * @type {(data: { id: string; label: string; disabled: boolean; hasSecondaryLabel: boolean }) => void}
   */
  function add(data) {
    batchedTabsUpdate((_) => {
      needsDomSync = true;
      return [..._, { ...data, index: _.length }];
    });
  }

  /**
   * @type {(id: string) => void}
   */
  function remove(id) {
    batchedTabsUpdate((_) => {
      needsDomSync = true;
      return _.filter((tab) => tab.id !== id);
    });
  }

  /**
   * @type {(data: { id: string }) => void}
   */
  function addContent(data) {
    batchedContentUpdate((_) => {
      needsDomSync = true;
      return [..._, { ...data, index: _.length }];
    });
  }

  /**
   * @type {(id: string) => void}
   */
  function removeContent(id) {
    batchedContentUpdate((_) => {
      needsDomSync = true;
      return _.filter((item) => item.id !== id);
    });
  }

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
    currentIndex = tab.index;
  }

  /**
   * Resolve selection from `selectedId` when set; otherwise use `selected`.
   * If the selected id was removed, keep the same index (next tab) or clamp.
   * @type {() => void}
   */
  function syncSelection() {
    if (selectedId === undefined) {
      currentIndex = selected;
      return;
    }

    const tab = $tabsById[selectedId];
    if (tab) {
      currentIndex = tab.index;
      return;
    }

    if ($tabs.length === 0) return;

    currentIndex = clampIndex(currentIndex, 0, $tabs.length);
    selectedId = $tabs[currentIndex].id;
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
    activeTab?.focus({ preventScroll: $belowMd });
    if ($belowMd) scrollTabIntoView(activeTab);
  }

  /**
   * Move selection/focus to a tab at an absolute index. Roving focus resolves
   * the index (skipping disabled, wrapping); selection follows focus.
   * @type {(index: number) => Promise<void>}
   */
  async function selectTab(index) {
    if (index === currentIndex) {
      focusedIndex = -1;
      return;
    }

    focusedIndex = -1;
    if (selectedId === undefined) {
      currentIndex = index;
    } else {
      const tab = $tabs[index];
      if (!tab) return;
      selectedId = tab.id;
    }

    await tick();
    const activeTab = /** @type {HTMLElement | undefined} */ (
      refTabList?.querySelectorAll("[role='tab']")[index]
    );
    // Below `md` the row scrolls horizontally; disable the native focus scroll
    // (a fixed step that lags variable-width tabs) and scroll explicitly. At
    // `md`+ the column relies on the browser scrolling the page to the tab.
    activeTab?.focus({ preventScroll: $belowMd });
    if ($belowMd) scrollTabIntoView(activeTab);
  }

  setContext("carbon:Tabs", {
    tabs,
    tabsById,
    contentById,
    contentByIndex,
    selectedTab,
    selectedContent,
    activeTooltip,
    iconOnly: useIconOnly,
    useAutoWidth,
    useFullWidth,
    useDismissible,
    hasSecondaryLabel,
    add,
    remove,
    addContent,
    removeContent,
    update,
    dismiss,
  });

  afterUpdate(() => {
    // Sync DOM order with stores only when tabs are added/removed.
    // This avoids infinite loops in Svelte 5 by not running on every update.
    if (needsDomSync && refTabList) {
      needsDomSync = false;

      tabs.update((currentTabs) =>
        syncDomOrder({
          root: refTabList,
          selector: "[role='tab']",
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

    if (selected !== currentIndex) {
      selected = currentIndex;
    }

    if (prevIndex > -1 && prevIndex !== currentIndex) {
      dispatch("change", currentIndex);
    }

    prevIndex = currentIndex;
  });

  onMount(() => {
    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    if (refTabList) observer.observe(refTabList);
    return () => observer.disconnect();
  });

  let currentIndex = selected;
  let focusedIndex = -1;
  let prevIndex = -1;

  $: {
    if (selectedId === undefined) {
      currentIndex = selected;
    } else {
      syncSelection();
    }
    focusedIndex = -1;
  }
  $: currentTab = $tabs[currentIndex] || undefined;
  $: currentContent = $content[currentIndex] || undefined;
  $: {
    if (currentTab) {
      selectedTab.set(currentTab.id);
    }

    if (currentContent) {
      selectedContent.set(currentContent.id);
    }
  }
  // Roving focus follows the visual orientation: arrow Up/Down in the vertical
  // column, arrow Left/Right in the horizontal row below `md`.
  $: orientation = $belowMd ? "horizontal" : "vertical";
  // Recompute overflow when the tabs change or the layout flips at `md`.
  $: if ($tabs || $belowMd) {
    tick().then(updateOverflow);
  }
</script>

<div bind:this={refRoot} class:bx--tabs--vertical-container={true}>
  <div
    role="navigation"
    class:bx--tabs={true}
    class:bx--tabs--vertical={true}
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
        on:click={() => scrollTabs(-1)}
      >
        <ChevronLeft />
      </button>
      <div
        class:bx--tabs__overflow-indicator--left={true}
        class:bx--tab--overflow-nav-button--hidden={!canScrollBackward}
      ></div>
    {/if}
    <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
    <ul
      bind:this={refTabList}
      role="tablist"
      aria-orientation={orientation}
      use:rovingFocus={{
        selector: "[role='tab']",
        orientation,
        skipDisabled: true,
        getActiveIndex: () => (focusedIndex >= 0 ? focusedIndex : currentIndex),
        onMove: (index, event) => {
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
        on:click={() => scrollTabs(1)}
      >
        <ChevronRight />
      </button>
    {/if}
  </div>
  <slot name="content" />
</div>
