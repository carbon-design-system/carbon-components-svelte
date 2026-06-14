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
   * Specify the ARIA label for the chevron icon.
   * @type {string}
   */
  export let iconDescription = "Show menu options";

  /** Specify the tab trigger href attribute */
  export let triggerHref = "#";

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

  import { afterUpdate, createEventDispatcher, setContext, tick } from "svelte";
  import { derived, get, writable } from "svelte/store";
  import { breakpointObserver } from "../Breakpoint/breakpointObserver.js";
  import ChevronDown from "../icons/ChevronDown.svelte";
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
  // Below `md` the tabs collapse into the dropdown menu, where the label is
  // visible inline; the icon-only tooltip is redundant there, so it is suppressed.
  const belowMd = breakpointObserver().smallerThan("md");

  let refTabList = null;
  let refRoot = null;

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

  let dropdownHidden = true;
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
  $: if ($selectedTab) {
    dropdownHidden = true;
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
  {...$$restProps}
>
  <div
    role="listbox"
    tabindex="0"
    class:bx--tabs-trigger={true}
    aria-label={$$props["aria-label"] ?? "listbox"}
    on:click={() => {
      dropdownHidden = !dropdownHidden;
    }}
    on:keypress
    on:keypress={() => {
      dropdownHidden = !dropdownHidden;
    }}
  >
    <a
      tabindex="-1"
      class:bx--tabs-trigger-text={true}
      href={triggerHref}
      on:click|preventDefault
      on:click|preventDefault|stopPropagation={() => {
        dropdownHidden = !dropdownHidden;
      }}
    >
      {#if currentTab}
        {currentTab.label}
      {/if}
    </a>
    <ChevronDown aria-hidden="true" title={iconDescription} />
  </div>
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
    class:bx--tabs__nav--hidden={dropdownHidden}
  >
    <slot />
  </ul>
</div>
<slot name="content" />
