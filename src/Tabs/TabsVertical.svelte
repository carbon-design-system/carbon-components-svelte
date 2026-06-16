<script>
  /**
   * @event {number} change
   */

  /**
   * Specify the selected tab index.
   * @bindable writable
   */
  export let selected = 0;

  import { afterUpdate, createEventDispatcher, setContext, tick } from "svelte";
  import { derived, writable } from "svelte/store";
  import { breakpointObserver } from "../Breakpoint/breakpointObserver.js";
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

  // Flag to trigger DOM reordering only when tabs change.
  // This is necessary to avoid infinite loops in Svelte 5.
  let needsDomSync = false;

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

  // Vertical tabs are never dismissible; this no-op satisfies the `Tab` context.
  function dismiss() {}

  /**
   * Move selection/focus to a tab at an absolute index. Roving focus resolves
   * the index (skipping disabled, wrapping); selection follows focus.
   * @type {(index: number) => Promise<void>}
   */
  async function selectTab(index) {
    if (index === currentIndex) return;

    currentIndex = index;

    await tick();
    const activeTab = refTabList?.querySelectorAll("[role='tab']")[index];
    activeTab?.focus();
  }

  setContext("carbon:Tabs", {
    tabs,
    contentById,
    selectedTab,
    selectedContent,
    activeTooltip,
    iconOnly: useIconOnly,
    belowMd,
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
    }

    if (selected !== currentIndex) {
      selected = currentIndex;
    }

    if (prevIndex > -1 && prevIndex !== currentIndex) {
      dispatch("change", currentIndex);
    }

    prevIndex = currentIndex;
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
  // Roving focus follows the visual orientation: arrow Up/Down in the vertical
  // column, arrow Left/Right in the horizontal row below `md`.
  $: orientation = $belowMd ? "horizontal" : "vertical";
</script>

<div bind:this={refRoot} class:bx--tabs--vertical-container={true}>
  <div
    role="navigation"
    class:bx--tabs={true}
    class:bx--tabs--vertical={true}
    class:bx--tabs--tall={$hasSecondaryLabel}
    {...$$restProps}
  >
    <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
    <ul
      bind:this={refTabList}
      role="tablist"
      aria-orientation={orientation}
      use:rovingFocus={{
        selector: "[role='tab']",
        orientation,
        skipDisabled: true,
        getActiveIndex: () => currentIndex,
        onMove: (index, event) => {
          // Prevent the arrow keys from also scrolling the page.
          event.preventDefault();
          selectTab(index);
        },
      }}
      class:bx--tabs__nav={true}
    >
      <slot />
    </ul>
  </div>
  <slot name="content" />
</div>
