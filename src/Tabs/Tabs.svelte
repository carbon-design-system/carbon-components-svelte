<script>
  /** Specify the selected tab index */
  export let selected = 0;

  /**
   * Set to `true` for tabs to be contained
   */
  export let contained = false;

  /** Set to `true` for tabs to have an auto-width */
  export let autoWidth = false;

  import { createEventDispatcher, afterUpdate, setContext, tick } from "svelte";
  import { writable, derived } from "svelte/store";

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

  let refTabList = null;

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
    },
    change: async (direction) => {
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
    },
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
  class:bx--tabs="{true}"
  class:bx--tabs--contained="{contained}"
  {...$$restProps}
>
  <div bind:this="{refTabList}" role="tablist" class:bx--tab--list="{true}">
    <slot />
  </div>
</div>
<slot name="content" />
