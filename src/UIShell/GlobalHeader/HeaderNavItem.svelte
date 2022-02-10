<script>
  /**
   * Specify the `href` attribute
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the text
   * @type {string}
   */
  export let text = undefined;

  /** Set to `true` to select the item */
  export let isSelected = false;

  /** Obtain a reference to the HTML anchor element */
  export let ref = null;

  import { getContext, onMount } from "svelte";

  const id = "ccs-" + Math.random().toString(36);
  const ctx = getContext("HeaderNavMenu");

  let selectedItemIds = [];

  const unsubSelectedItems = ctx?.selectedItems.subscribe((_selectedItems) => {
    selectedItemIds = Object.keys(_selectedItems);
  });

  $: ctx?.updateSelectedItems({ id, isSelected });

  onMount(() => {
    return () => {
      if (unsubSelectedItems) unsubSelectedItems();
    };
  });
</script>

<li role="none">
  <a
    bind:this="{ref}"
    role="menuitem"
    tabindex="0"
    href="{href}"
    rel="{$$restProps.target === '_blank' ? 'noopener noreferrer' : undefined}"
    class:bx--header__menu-item="{true}"
    aria-current="{isSelected ? 'page' : undefined}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keyup
    on:keydown
    on:focus
    on:blur
    on:blur="{() => {
      if (selectedItemIds.indexOf(id) === selectedItemIds.length - 1) {
        ctx?.closeMenu();
      }
    }}"
  >
    <span class:bx--text-truncate--end="{true}">{text}</span>
  </a>
</li>
