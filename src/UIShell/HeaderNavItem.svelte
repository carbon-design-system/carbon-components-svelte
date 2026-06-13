<script>
  /**
   * Specify the `href` attribute.
   * @type {string}
   */
  export let href = undefined;

  /**
   * Specify the text.
   * @type {string}
   */
  export let text = undefined;

  /** Set to `true` to select the item */
  export let isSelected = false;

  /**
   * Obtain a reference to the HTML anchor element.
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { moveIndex } from "../utils/moveIndex.js";

  const id = `ccs-${Math.random().toString(36)}`;
  const ctx = getContext("carbon:HeaderNavMenu");

  let selectedItemIds = [];
  let menuItems = [];

  const unsubSelectedItems = ctx?.selectedItems.subscribe((_selectedItems) => {
    selectedItemIds = Object.keys(_selectedItems);
  });

  const unsubMenuItems = ctx?.menuItems.subscribe((_menuItems) => {
    menuItems = _menuItems;
  });

  $: ctx?.updateSelectedItems({ id, isSelected });

  onMount(() => {
    if (ctx && ref) {
      ctx.registerMenuItem(ref);
    }
    return () => {
      if (unsubSelectedItems) unsubSelectedItems();
      if (unsubMenuItems) unsubMenuItems();
      if (ctx && ref) {
        ctx.unregisterMenuItem(ref);
      }
    };
  });
</script>

<li role="none">
  <a
    bind:this={ref}
    role="menuitem"
    tabindex="0"
    {href}
    rel={$$restProps.target === "_blank" ? "noopener noreferrer" : undefined}
    class:bx--header__menu-item={true}
    aria-current={isSelected ? "page" : undefined}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keyup
    on:keydown
    on:keydown={(event) => {
      if (!ctx) return;

      const currentIndex = menuItems.indexOf(ref);
      if (currentIndex === -1) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        // Move to next item, wrap to first
        menuItems[moveIndex(currentIndex, 1, menuItems.length)]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        // Move to previous item, wrap to last
        menuItems[moveIndex(currentIndex, -1, menuItems.length)]?.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        // Focus first item
        menuItems[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        // Focus last item
        menuItems[menuItems.length - 1]?.focus();
      } else if (event.key === "Escape") {
        event.preventDefault();
        ctx.closeMenu("escape-key");
      }
    }}
    on:focus
    on:blur
    on:blur={(event) => {
      // Only close menu if blur is moving focus outside the menu
      // (not when navigating between menu items with arrow keys)
      if (
        selectedItemIds.indexOf(id) === selectedItemIds.length - 1 &&
        (!event.relatedTarget || !menuItems.includes(event.relatedTarget))
      ) {
        ctx?.closeMenu("blur");
      }
    }}
  >
    <span class:bx--text-truncate--end={true}><slot>{text}</slot></span>
  </a>
</li>
