<script>
  /**
   * @typedef {number | string} TabsV2ItemId
   * @typedef {{ id: TabsV2ItemId; label?: string; disabled?: boolean; }} TabsV2Item
   * @event {{ selectedIndex: number; selectedId: TabsV2ItemId; currentItem: TabsV2Item }} change
   * @slot {{ id: TabsV2ItemId; index: number; item: TabsV2Item; }}
   */

  /**
   * Provide the tab items
   * @type {TabsV2Item[]}
   */
  export let items = [];

  /** Specify the selected tab index */
  export let selectedIndex = 0;

  /**
   * Specify the selected tab id
   * @type {TabsV2ItemId}
   */
  export let selectedId = undefined;

  /**
   * Specify the type of tabs
   * @type {"default" | "container"}
   */
  export let type = "default";

  /**
   * Specify the ARIA label for the chevron icon
   * @type {string}
   */
  export let iconDescription = "Show menu options";

  /** Specify the tab trigger href attribute */
  export let triggerHref = "#";

  import { createEventDispatcher, afterUpdate } from "svelte";
  import ChevronDownGlyph from "carbon-icons-svelte/lib/ChevronDownGlyph/ChevronDownGlyph.svelte";

  const dispatch = createEventDispatcher();

  let dropdownHidden = true;
  let prevSelectedIndex = -1;

  $: itemIds = items.map((item) => item.id);
  $: if (items[selectedIndex] === undefined) {
    // if the items array shrinks, `selectedIndex` could be greater than the number of items
    selectedIndex = items.length - 1;
  }
  $: currentItem = items[selectedIndex];
  $: selectedId = currentItem.id;

  afterUpdate(() => {
    if (currentItem.id !== selectedId) {
      selectedIndex = itemIds.indexOf(selectedId);
    }

    if (prevSelectedIndex !== selectedIndex) {
      // only dispatch the "change" event when the current item changes
      dispatch("change", { selectedIndex, selectedId, currentItem });
      prevSelectedIndex = selectedIndex;
    }
  });

  function changeIndex(direction) {
    let index = selectedIndex + direction;

    if (index < 0) {
      index = items.length - 1;
    } else if (index >= items.length) {
      index = 0;
    }

    let disabled = items[index].disabled;

    while (disabled) {
      index = index + direction;

      if (index < 0) {
        index = items.length - 1;
      } else if (index >= items.length) {
        index = 0;
      }

      disabled = items[index].disabled;
    }

    selectedIndex = index;
  }
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
    on:keydown="{() => {
      dropdownHidden = !dropdownHidden;
    }}"
  >
    <a
      tabindex="-1"
      class:bx--tabs-trigger-text="{true}"
      href="{triggerHref}"
      on:click="{() => {
        dropdownHidden = !dropdownHidden;
      }}"
    >
      {#if currentItem}{currentItem.label}{/if}
    </a>
    <ChevronDownGlyph aria-hidden="true" title="{iconDescription}" />
  </div>
  <ul
    role="tablist"
    class:bx--tabs__nav="{true}"
    class:bx--tabs__nav--hidden="{dropdownHidden}"
  >
    {#each items as item, i (item.id)}
      <li
        tabindex="-1"
        role="presentation"
        class:bx--tabs__nav-item="{true}"
        class:bx--tabs__nav-item--disabled="{item.disabled}"
        class:bx--tabs__nav-item--selected="{item.id === currentItem.id}"
        {...$$restProps}
        on:click|preventDefault="{() => {
          if (!item.disabled) selectedIndex = i;
          dropdownHidden = true;
        }}"
        on:keydown="{({ key }) => {
          if (item.disabled || !dropdownHidden) return;
          console.log(key);
          if (key === 'ArrowRight') {
            changeIndex(1);
          } else if (key === 'ArrowLeft') {
            changeIndex(-1);
          }
        }}"
      >
        <a
          role="tab"
          tabindex="{item.disabled ? '-1' : item.tabindex || '0'}"
          aria-selected="{item.id === currentItem.id}"
          aria-disabled="{item.disabled}"
          id="{item.id}"
          href="{item.href || '#'}"
          class:bx--tabs__nav-link="{true}"
        >
          <slot name="tab">{item.label}</slot>
        </a>
      </li>
    {/each}
  </ul>
</div>

{#each items as item, i (item.id)}
  <div
    role="tabpanel"
    aria-labelledby="{item.id}"
    aria-hidden="{item.id !== currentItem.id}"
    hidden="{item.id === currentItem.id ? undefined : 'true'}"
    id="tabpanel-{item.id}"
    class:bx--tab-content="{true}"
  >
    <slot id="{item.id}" index="{i}" item="{item}" />
  </div>
{/each}
