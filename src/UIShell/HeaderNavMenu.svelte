<script>
  /**
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "blur"} trigger
   */

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

  import { createEventDispatcher, setContext, tick } from "svelte";
  import { get, writable } from "svelte/store";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import { dismiss } from "../utils/dismiss.js";
  import { createDomNodeRegistry } from "../utils/dom-node-registry.js";
  import { returnFocus } from "../utils/focus.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import { pickEdgeMenuItem } from "../utils/pick-edge-menu-item.js";

  const dispatch = createEventDispatcher();

  /**
   * Ids of the selected items in the menu.
   * @type {import("svelte/store").Writable<ReadonlySet<string>>}
   */
  const selectedItems = writable(new Set());
  const menuItemRegistry = createDomNodeRegistry();
  /** @type {import("svelte/store").Writable<ReadonlyArray<HTMLElement>>} */
  const menuItems = menuItemRegistry.items;
  /** @type {(node: HTMLElement) => void} */
  const registerMenuItem = menuItemRegistry.register;
  /** @type {(node: HTMLElement) => void} */
  const unregisterMenuItem = menuItemRegistry.unregister;

  let menuRef = null;

  /**
   * @type {(item: { id: string; isSelected: boolean }) => void}
   */
  function updateSelectedItems(item) {
    const ids = get(selectedItems);
    if (ids.has(item.id) === item.isSelected) return;
    const next = new Set(ids);
    if (item.isSelected) next.add(item.id);
    else next.delete(item.id);
    selectedItems.set(next);
  }

  /**
   * @type {(trigger: "escape-key" | "blur") => Promise<void>}
   */
  async function closeMenu(trigger) {
    if (!expanded) return;
    expanded = false;
    dispatch("close", { trigger });
    // Escape hands focus back to the trigger; a blur has already moved it
    // somewhere the user chose.
    if (trigger === "escape-key") {
      await tick();
      ref?.focus();
    }
  }

  setContext("carbon:HeaderNavMenu", {
    selectedItems,
    menuItems,
    updateSelectedItems,
    registerMenuItem,
    unregisterMenuItem,
    closeMenu,
  });

  $: isCurrentSubmenu = $selectedItems.size > 0;

  function handleOutsideClick(event) {
    if (expanded && isOutsideClick(event, ref)) {
      expanded = false;
      dispatch("close", { trigger: "outside-click" });
    }
  }
</script>

<li
  role="none"
  use:dismiss={{
    enabled: expanded,
    type: "click",
    handler: handleOutsideClick,
  }}
  class:bx--header__submenu={true}
  class:bx--header__submenu--current={isCurrentSubmenu}
  on:click={(event) => {
    if (menuRef.contains(event.target)) {
      // Activating an item closes the menu and hides the focused item, so
      // hand focus back to the trigger unless navigation moved it.
      expanded = false;
      tick().then(() => returnFocus(ref, menuRef));
      return;
    }
    event.preventDefault();
    expanded = !expanded;
  }}
  on:keydown={(event) => {
    // Enter on an item fires a click, which the handler above closes on;
    // toggling here as well reopened the menu.
    if (event.key === "Enter" && !menuRef.contains(event.target)) {
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
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!expanded) {
          expanded = true;
        }
        await tick();
        pickEdgeMenuItem(event.key, $menuItems)?.focus();
      } else if (event.key === "Escape") {
        event.preventDefault();
        await closeMenu("escape-key");
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
  <ul
    bind:this={menuRef}
    role="menu"
    aria-label={text}
    class:bx--header__menu={true}
  >
    <slot />
  </ul>
</li>
