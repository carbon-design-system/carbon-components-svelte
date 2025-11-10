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

  import { setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import ChevronDown from "../icons/ChevronDown.svelte";

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
  const updateSelectedItems = (item) => {
    selectedItems.update((_items) => ({
      ..._items,
      [item.id]: item.isSelected,
    }));
  };

  /**
   * @type {(element: HTMLElement) => void}
   */
  const registerMenuItem = (element) => {
    menuItems.update((items) => [...items, element]);
  };

  /**
   * @type {(element: HTMLElement) => void}
   */
  const unregisterMenuItem = (element) => {
    menuItems.update((items) => items.filter((item) => item !== element));
  };

  /**
   * @type {() => Promise<void>}
   */
  const closeMenu = async () => {
    expanded = false;
    await tick();
    ref?.focus();
  };

  setContext("HeaderNavMenu", {
    selectedItems,
    menuItems,
    updateSelectedItems,
    registerMenuItem,
    unregisterMenuItem,
    closeMenu,
  });

  $: isCurrentSubmenu =
    Object.values($selectedItems).filter(Boolean).length > 0;
</script>

<svelte:window
  on:click={({ target }) => {
    if (!ref.contains(target)) {
      expanded = false;
    }
  }}
/>

<li
  role="none"
  class:bx--header__submenu={true}
  class:bx--header__submenu--current={isCurrentSubmenu}
  on:click={(e) => {
    if (!menuRef.contains(e.target)) {
      e.preventDefault();
    }
    expanded = !expanded;
  }}
  on:keydown={(e) => {
    if (e.key === "Enter") {
      e.stopPropagation();
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
    on:keydown={async (e) => {
      if (e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        const wasExpanded = expanded;
        expanded = !expanded;
        if (!wasExpanded && expanded && $menuItems.length > 0) {
          // Only focus first item when opening (not closing)
          await tick();
          $menuItems[0]?.focus();
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        // Let the li handler toggle the expanded state
        // Just focus the first item if opening
        if (!expanded && $menuItems.length > 0) {
          await tick();
          $menuItems[0]?.focus();
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!expanded) {
          expanded = true;
        }
        // Focus first item
        await tick();
        $menuItems[0]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!expanded) {
          expanded = true;
        }
        // Focus last item
        await tick();
        $menuItems[$menuItems.length - 1]?.focus();
      } else if (e.key === "Escape") {
        e.preventDefault();
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
