<script>
  /**
   * @event {number} change
   * @event {{ id: string; label: string; disabled: boolean; hasSecondaryLabel: boolean; index: number }} dismiss
   */

  /**
   * Specify the selected tab index.
   * @bindable writable
   */
  export let selected = 0;

  /**
   * Specify the type of tabs.
   * @type {"default" | "container"}
   */
  export let type = "default";

  /** Set to `true` for tabs to have an auto-width */
  export let autoWidth = false;

  /** Set to `true` to render a dismiss button for each tab */
  export let dismissible = false;

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

  import {
    afterUpdate,
    createEventDispatcher,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { derived, get, writable } from "svelte/store";
  import ChevronLeft from "../icons/ChevronLeft.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
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
   * @type {import("svelte/store").Writable<string | undefined>}
   */
  const selectedContent = writable(undefined);
  /**
   * Tracks which icon-only tab's tooltip is open so only one shows at a time.
   * Scoped per `Tabs` instance.
   * @type {import("svelte/store").Writable<string | undefined>}
   */
  const activeTooltip = writable(undefined);

  let refTabList = null;
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
    canScrollBackward = scrollLeft > 0;
    // Round up to absorb sub-pixel widths so the forward button hides cleanly
    // when the list is scrolled to the end.
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

  // Flag to trigger DOM reordering only when tabs change.
  // This is necessary to avoid infinite loops in Svelte 5.
  let needsDomSync = false;

  const hasSecondaryLabel = derived(
    tabs,
    (_) => type === "container" && _.some((tab) => tab.hasSecondaryLabel),
  );

  /**
   * Mirror the `iconOnly` prop into the context so each `Tab` reacts to it.
   * @type {import("svelte/store").Writable<boolean>}
   */
  const useIconOnly = writable(iconOnly);

  /**
   * @type {(data: { id: string; label: string; disabled: boolean; hasSecondaryLabel: boolean }) => void}
   */
  function add(data) {
    needsDomSync = true;
    tabs.update((_) => [..._, { ...data, index: _.length }]);
  }

  /**
   * @type {(id: string) => void}
   */
  function remove(id) {
    needsDomSync = true;
    tabs.update((_) => _.filter((tab) => tab.id !== id));
  }

  /**
   * @type {(data: { id: string }) => void}
   */
  function addContent(data) {
    needsDomSync = true;
    content.update((_) => [..._, { ...data, index: _.length }]);
  }

  /**
   * @type {(id: string) => void}
   */
  function removeContent(id) {
    needsDomSync = true;
    content.update((_) => _.filter((item) => item.id !== id));
  }

  /**
   * @type {(id: string) => void}
   */
  function update(id) {
    currentIndex = $tabsById[id].index;
  }

  /**
   * @type {(id: string) => void}
   */
  function dismiss(id) {
    const tab = get(tabsById)[id];

    if (tab) {
      dispatch("dismiss", tab);
    }
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

  /**
   * Move selection/focus to a tab at an absolute index. Roving focus resolves
   * the index (skipping disabled, wrapping); selection follows focus.
   * @type {(index: number) => Promise<void>}
   */
  async function selectTab(index) {
    if (index === currentIndex) return;

    currentIndex = index;

    await tick();
    const activeTab = /** @type {HTMLElement | undefined} */ (
      refTabList?.querySelectorAll("[role='tab']")[index]
    );
    activeTab?.focus({ preventScroll: true });
    scrollTabIntoView(activeTab);
  }

  setContext("carbon:Tabs", {
    tabs,
    contentById,
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

      if (refRoot?.parentElement) {
        content.update((currentContent) =>
          syncDomOrder({
            root: refRoot.parentElement,
            selector: "[role='tabpanel']",
            items: currentContent,
          }),
        );
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
  let prevIndex = -1;

  $: currentIndex = selected;
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
  // Recompute overflow when the set of tabs changes (added/removed/relabeled).
  $: if ($tabs) {
    tick().then(updateOverflow);
  }
  $: useAutoWidth.set(autoWidth);
  $: useFullWidth.set(fullWidth);
  $: useDismissible.set(dismissible);
  $: useIconOnly.set(iconOnly);
</script>

<div
  bind:this={refRoot}
  role="navigation"
  class:bx--tabs={true}
  class:bx--tabs--container={type === "container"}
  class:bx--tabs--tall={$hasSecondaryLabel}
  class:bx--tabs--full-width={fullWidth}
  class:bx--tabs--dismissible={dismissible}
  class:bx--tabs--icon-only={iconOnly}
  class:bx--tabs__icon--lg={iconOnly && iconSize === "lg"}
  class:bx--tabs--scrollable={isOverflow}
  class:bx--tabs--scrollable--container={isOverflow && type === "container"}
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
    use:rovingFocus={{
      selector: "[role='tab']",
      orientation: "horizontal",
      skipDisabled: true,
      getActiveIndex: () => currentIndex,
      onMove: (index) => selectTab(index),
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
