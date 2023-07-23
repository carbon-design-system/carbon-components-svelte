<script>
  /**
   * Specify the tab label.
   * Alternatively, use the default slot (e.g., `<Tab><span>Label</span></Tab>`)
   */
  export let label = "";

  /** Specify the href attribute */
  export let href = "#";

  /** Set to `true` to disable the tab */
  export let disabled = false;

  /** Specify the tabindex */
  export let tabindex = "0";

  /** Set an id for the top-level element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Obtain a reference to the anchor HTML element */
  export let ref = null;

  import { getContext } from "svelte";

  const { selectedTab, useAutoWidth, add, update, change } = getContext("Tabs");

  add({ id, label, disabled });

  $: selected = $selectedTab === id;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<li
  tabindex="-1"
  role="presentation"
  class:bx--tabs__nav-item="{true}"
  class:bx--tabs__nav-item--disabled="{disabled}"
  class:bx--tabs__nav-item--selected="{selected}"
  {...$$restProps}
  on:click|preventDefault
  on:click|preventDefault="{() => {
    if (!disabled) {
      update(id);
    }
  }}"
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown="{({ key }) => {
    if (!disabled) {
      if (key === 'ArrowRight') {
        change(1);
      } else if (key === 'ArrowLeft') {
        change(-1);
      } else if (key === ' ' || key === 'Enter') {
        update(id);
      }
    }
  }}"
>
  <a
    bind:this="{ref}"
    role="tab"
    tabindex="{disabled ? '-1' : tabindex}"
    aria-selected="{selected}"
    aria-disabled="{disabled}"
    id="{id}"
    href="{href}"
    class:bx--tabs__nav-link="{true}"
    style:width="{$useAutoWidth ? "auto" : undefined}"
  >
    <slot>{label}</slot>
  </a>
</li>
