<script>
  /**
   * Set to `true` to toggle the expanded state.
   * @bindable writable
   */
  export let expanded = false;

  /** Specify the `href` attribute */
  export let href = "/";

  /**
   * Specify the text.
   * @type {string}
   */
  export let text = undefined;

  /**
   * Obtain a reference to the HTML anchor element.
   * @type {HTMLAnchorElement | null}
   * @bindable readonly
   */
  export let ref = null;

  import { setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import { dismiss } from "../utils/dismiss.js";
  import { isOutsideClick } from "../utils/isOutsideClick.js";

  /**
   * @type {import("svelte/store").Writable<Record<string, boolean>>}
   */
  const selectedItems = writable({});
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<HTMLElement>>}
   */
  const menuItems = writable([]);

  let menuRef = null;

  /**
   * @type {(item: { id: string; isSelected: boolean }) => void}
   */
  function updateSelectedItems(item) {
    selectedItems.update((_items) => ({
      ..._items,
      [item.id]: item.isSelected,
    }));
  }

  /**
   * @type {(element: HTMLElement) => void}
   */
  function registerMenuItem(element) {
    menuItems.update((items) => [...items, element]);
  }

  /**
   * @type {(element: HTMLElement) => void}
   */
  function unregisterMenuItem(element) {
    menuItems.update((items) => items.filter((item) => item !== element));
  }

  /**
   * @type {() => Promise<void>}
   */
  async function closeMenu() {
    expanded = false;
    await tick();
    ref?.focus();
  }

  setContext("carbon:HeaderNavMenu", {
    selectedItems,
    menuItems,
    updateSelectedItems,
    registerMenuItem,
    unregisterMenuItem,
    closeMenu,
  });

  $: isCurrentSubmenu =
    Object.values($selectedItems).filter(Boolean).length > 0;

  function handleOutsideClick(event) {
    if (isOutsideClick(event, ref)) expanded = false;
  }
</script>

<li
  role="none"
  use:dismiss={{ enabled: expanded, type: "click", handler: handleOutsideClick }}
  class:bx--header__submenu={true}
  class:bx--header__submenu--current={isCurrentSubmenu}
  on:click={(event) => {
    if (!menuRef.contains(event.target)) {
      event.preventDefault();
    }
    expanded = !expanded;
  }}
  on:keydown={(event) => {
    if (event.key === "Enter") {
      event.stopPropagation();
      expanded = !expanded;
    }
  }}
>
  <a
    bind:this={ref}
    role="menuitem"
    tabindex="0"
    aria-haspopup="menu"
    aria-expanded={expanded}
    aria-label={text}
    {href}
    class:bx--header__menu-item={true}
    class:bx--header__menu-title={true}
    style:z-index={1}
    {...$$restProps}
    on:keydown
    on:keydown={async (event) => {
      if (event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        const wasExpanded = expanded;
        expanded = !expanded;
        if (!wasExpanded && expanded && $menuItems.length > 0) {
          // Only focus first item when opening (not closing)
          await tick();
          $menuItems[0]?.focus();
        }
      } else if (event.key === "Enter") {
        event.preventDefault();
        // Let the li handler toggle the expanded state
        // Just focus the first item if opening
        if (!expanded && $menuItems.length > 0) {
          await tick();
          $menuItems[0]?.focus();
        }
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!expanded) {
          expanded = true;
        }
        // Focus first item
        await tick();
        $menuItems[0]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!expanded) {
          expanded = true;
        }
        // Focus last item
        await tick();
        $menuItems[$menuItems.length - 1]?.focus();
      } else if (event.key === "Escape") {
        event.preventDefault();
        expanded = false;
        await tick();
        ref?.focus();
      }
    }}
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
    bind:this={menuRef}
    role="menu"
    aria-label={text}
    class:bx--header__menu={true}
  >
    <slot />
  </ul>
</li>
