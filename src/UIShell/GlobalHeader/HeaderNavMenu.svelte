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
  import ChevronDown16 from "../../icons/ChevronDown16.svelte";

  const selectedItems = writable({});

  setContext("HeaderNavMenu", {
    updateSelectedItems(item) {
      selectedItems.update((_items) => ({
        ..._items,
        [item.id]: item.isSelected,
      }));
    },
  });

  $: isCurrentSubmenu =
    Object.values($selectedItems).filter(Boolean).length > 0;
</script>

<svelte:window
  on:mouseup="{({ target }) => {
    if (ref.contains(target) || target === ref) {
      expanded = !expanded;
    } else {
      if (expanded) {
        expanded = false;
      }
    }
  }}"
/>

<li
  class:bx--header__submenu="{true}"
  class:bx--header__submenu--current="{isCurrentSubmenu}"
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
    {...$$restProps}
    style="{$$restProps.style}; z-index: 1"
    on:keydown
    on:keydown="{({ key }) => {
      if (key === 'Enter') {
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
    <ChevronDown16 class="bx--header__menu-arrow" />
  </a>
  <ul role="menu" aria-label="{text}" class:bx--header__menu="{true}">
    <slot />
  </ul>
</li>
