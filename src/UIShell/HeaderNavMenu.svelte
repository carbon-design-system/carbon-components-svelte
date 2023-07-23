<script>
  /** Set to `true` to toggle the expanded state */
  export let expanded = false;

  /** Specify the `href` attribute */
  export let href = "/";

  /**
   * Specify the text
   * @type {string}
   */
  export let text = undefined;

  /** Obtain a reference to the HTML anchor element */
  export let ref = null;

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import ChevronDown from "../icons/ChevronDown.svelte";

  const selectedItems = writable({});

  let menuRef = null;

  setContext("HeaderNavMenu", {
    selectedItems,
    updateSelectedItems(item) {
      selectedItems.update((_items) => ({
        ..._items,
        [item.id]: item.isSelected,
      }));
    },
    closeMenu() {
      expanded = false;
    },
  });

  $: isCurrentSubmenu =
    Object.values($selectedItems).filter(Boolean).length > 0;
</script>

<svelte:window
  on:click="{({ target }) => {
    if (!ref.contains(target)) {
      expanded = false;
    }
  }}"
/>

<li
  role="none"
  class:bx--header__submenu="{true}"
  class:bx--header__submenu--current="{isCurrentSubmenu}"
  on:click="{(e) => {
    if (!menuRef.contains(e.target)) {
      e.preventDefault();
    }
    expanded = !expanded;
  }}"
  on:keydown="{(e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      expanded = !expanded;
    }
  }}"
>
  <a
    bind:this="{ref}"
    role="menuitem"
    tabindex="0"
    aria-haspopup="menu"
    aria-expanded="{expanded}"
    aria-label="{text}"
    href="{href}"
    class:bx--header__menu-item="{true}"
    class:bx--header__menu-title="{true}"
    style:z-index="{1}"
    {...$$restProps}
    on:keydown
    on:keydown="{(e) => {
      if (e.key === ' ') e.preventDefault();
      if (e.key === 'Enter' || e.key === ' ') {
        expanded = !expanded;
      }
    }}"
    on:click|preventDefault
    on:mouseover
    on:mouseenter
    on:mouseleave
    on:keyup
    on:focus
    on:blur
  >
    {text}
    <ChevronDown class="bx--header__menu-arrow" />
  </a>
  <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
  <ul
    bind:this="{menuRef}"
    role="menu"
    aria-label="{text}"
    class:bx--header__menu="{true}"
  >
    <slot />
  </ul>
</li>
