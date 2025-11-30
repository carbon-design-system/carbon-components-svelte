<script>
  /**
   * @event {number} change
   */

  /** Specify the selected tab index */
  export let selected = 0;

  /**
   * Specify the type of tabs
   * @type {"default" | "container"}
   */
  export let type = "default";

  /** Set to `true` for tabs to have an auto-width */
  export let autoWidth = false;

  /**
   * Specify the ARIA label for the chevron icon
   * @type {string}
   */
  export let iconDescription = "Show menu options";

  /** Specify the tab trigger href attribute */
  export let triggerHref = "#";

  import { afterUpdate, createEventDispatcher, setContext, tick } from "svelte";
  import { derived, writable } from "svelte/store";
  import ChevronDown from "../icons/ChevronDown.svelte";

  const dispatch = createEventDispatcher();

  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<{ id: string; label: string; disabled: boolean; index: number }>>}
   */
  const tabs = writable([]);
  const tabsById = derived(tabs, (_) =>
    _.reduce((a, c) => {
      a[c.id] = c;
      return a;
    }, {}),
  );
  /**
   * @type {import("svelte/store").Writable<boolean>}
   */
  const useAutoWidth = writable(autoWidth);
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
  const contentById = derived(content, (_) =>
    _.reduce((a, c) => {
      a[c.id] = c;
      return a;
    }, {}),
  );
  /**
   * @type {import("svelte/store").Writable<string | undefined>}
   */
  const selectedContent = writable(undefined);

  let refTabList = null;
  let refRoot = null;

  // Flag to trigger DOM reordering only when tabs change.
  // This is necessary to avoid infinite loops in Svelte 5.
  let needsDomSync = false;

  /**
   * @type {(data: { id: string; label: string; disabled: boolean }) => void}
   */
  const add = (data) => {
    needsDomSync = true;
    tabs.update((_) => [..._, { ...data, index: _.length }]);
  };

  /**
   * @type {(id: string) => void}
   */
  const remove = (id) => {
    needsDomSync = true;
    tabs.update((_) => _.filter((tab) => tab.id !== id));
  };

  /**
   * @type {(data: { id: string }) => void}
   */
  const addContent = (data) => {
    needsDomSync = true;
    content.update((_) => [..._, { ...data, index: _.length }]);
  };

  /**
   * @type {(id: string) => void}
   */
  const removeContent = (id) => {
    needsDomSync = true;
    content.update((_) => _.filter((item) => item.id !== id));
  };

  /**
   * @type {(id: string) => void}
   */
  const update = (id) => {
    currentIndex = $tabsById[id].index;
  };

  /**
   * @type {(direction: number) => Promise<void>}
   */
  const change = async (direction) => {
    let index = currentIndex + direction;

    if (index < 0) {
      index = $tabs.length - 1;
    } else if (index >= $tabs.length) {
      index = 0;
    }

    let disabled = $tabs[index].disabled;

    while (disabled) {
      index = index + direction;

      if (index < 0) {
        index = $tabs.length - 1;
      } else if (index >= $tabs.length) {
        index = 0;
      }

      disabled = $tabs[index].disabled;
    }

    currentIndex = index;

    await tick();
    const activeTab =
      refTabList?.querySelectorAll("[role='tab']")[currentIndex];
    activeTab?.focus();
  };

  setContext("Tabs", {
    tabs,
    contentById,
    selectedTab,
    selectedContent,
    useAutoWidth,
    add,
    remove,
    addContent,
    removeContent,
    update,
    change,
  });

  afterUpdate(() => {
    // Sync DOM order with stores only when tabs are added/removed.
    // This avoids infinite loops in Svelte 5 by not running on every update.
    if (needsDomSync && refTabList) {
      needsDomSync = false;

      const domTabs = Array.from(refTabList.querySelectorAll("[role='tab']"));
      const domTabIds = domTabs.map((el) => el.id);

      tabs.update((currentTabs) => {
        const tabsMap = new Map(currentTabs.map((tab) => [tab.id, tab]));
        return domTabIds
          .map((id, index) => {
            const tab = tabsMap.get(id);
            return tab ? { ...tab, index } : undefined;
          })
          .filter(Boolean);
      });

      const contentElements = refRoot?.parentElement
        ? Array.from(
            refRoot.parentElement.querySelectorAll("[role='tabpanel']"),
          )
        : [];
      const contentIds = contentElements.map((el) => el.id);

      content.update((currentContent) => {
        const contentMap = new Map(currentContent.map((c) => [c.id, c]));
        return contentIds
          .map((id, index) => {
            const c = contentMap.get(id);
            return c ? { ...c, index } : undefined;
          })
          .filter(Boolean);
      });
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
</script>

<div
  bind:this={refRoot}
  role="navigation"
  class:bx--tabs={true}
  class:bx--tabs--container={type === "container"}
  {...$$restProps}
>
  <div
    role="listbox"
    tabindex="0"
    class:bx--tabs-trigger={true}
    aria-label={$$props["aria-label"] || "listbox"}
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
      {#if currentTab}{currentTab.label}{/if}
    </a>
    <ChevronDown aria-hidden="true" title={iconDescription} />
  </div>
  <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
  <ul
    bind:this={refTabList}
    role="tablist"
    class:bx--tabs__nav={true}
    class:bx--tabs__nav--hidden={dropdownHidden}
  >
    <slot />
  </ul>
</div>
<slot name="content" />