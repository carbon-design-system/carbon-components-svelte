<script>
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

  import { createEventDispatcher, afterUpdate, setContext } from "svelte";
  import { writable, derived } from "svelte/store";
  import ChevronDownGlyph from "../icons/ChevronDownGlyph.svelte";

  const dispatch = createEventDispatcher();

  const tabs = writable([]);
  const tabsById = derived(tabs, (_) =>
    _.reduce((a, c) => ({ ...a, [c.id]: c }), {})
  );
  const useAutoWidth = writable(autoWidth);
  const selectedTab = writable(undefined);
  const content = writable([]);
  const contentById = derived(content, (_) =>
    _.reduce((a, c) => ({ ...a, [c.id]: c }), {})
  );
  const selectedContent = writable(undefined);

  setContext("Tabs", {
    tabs,
    contentById,
    selectedTab,
    selectedContent,
    useAutoWidth,
    add: (data) => {
      tabs.update((_) => [..._, { ...data, index: _.length }]);
    },
    addContent: (data) => {
      content.update((_) => [..._, { ...data, index: _.length }]);
    },
    update: (id) => {
      currentIndex = $tabsById[id].index;
      dispatch("change", currentIndex);
    },
    change: (direction) => {
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
      dispatch("change", currentIndex);
    },
  });

  afterUpdate(() => {
    selected = currentIndex;
  });

  let dropdownHidden = true;
  let currentIndex = selected;

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
  class:bx--tabs="{true}"
  class:bx--tabs--container="{type === 'container'}"
  {...$$restProps}
>
  <div
    role="listbox"
    tabindex="0"
    class:bx--tabs-trigger="{true}"
    aria-label="{$$props['aria-label'] || 'listbox'}"
    on:click="{() => {
      dropdownHidden = !dropdownHidden;
    }}"
    on:keypress
    on:keypress="{() => {
      dropdownHidden = !dropdownHidden;
    }}"
  >
    <a
      tabindex="-1"
      class:bx--tabs-trigger-text="{true}"
      href="{triggerHref}"
      on:click|preventDefault
      on:click|preventDefault|stopPropagation="{() => {
        dropdownHidden = !dropdownHidden;
      }}"
    >
      {#if currentTab}{currentTab.label}{/if}
    </a>
    <ChevronDownGlyph aria-hidden="true" title="{iconDescription}" />
  </div>
  <ul
    role="tablist"
    class:bx--tabs__nav="{true}"
    class:bx--tabs__nav--hidden="{dropdownHidden}"
  >
    <slot />
  </ul>
</div>
<slot name="content" />
