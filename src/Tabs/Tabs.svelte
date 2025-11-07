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

  /**
   * @type {(data: { id: string; label: string; disabled: boolean }) => void}
   */
  const add = (data) => {
    tabs.update((_) => [..._, { ...data, index: _.length }]);
  };

  /**
   * @type {(data: { id: string }) => void}
   */
  const addContent = (data) => {
    content.update((_) => [..._, { ...data, index: _.length }]);
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
    addContent,
    update,
    change,
  });

  afterUpdate(() => {
    selected = currentIndex;

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
