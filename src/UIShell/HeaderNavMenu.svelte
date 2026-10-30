<script>
  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
   */

  /**
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "blur"} trigger
   */

  /**
   * @slot {{}} textChildren - Custom trigger content. Replaces `text`.
   * @deprecated use the `textChildren` slot
   * @slot {{}} text
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
   * Alternatively, use the "textChildren" slot.
   * @type {string | undefined}
   */
  export let text = undefined;

  /**
   * Specify an icon to render after the text, before the chevron.
   * Alternatively, use the "icon" slot.
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

  /**
   * Obtain a reference to the HTML anchor element.
   * @type {HTMLAnchorElement | null}
   * @bindable readonly
   */
  export let ref = null;

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { get, readable, writable } from "svelte/store";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import { dismiss } from "../utils/dismiss.js";
  import { createDomNodeRegistry } from "../utils/dom-node-registry.js";
  import { returnFocus } from "../utils/focus.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import {
    getLayoutDirection,
    inlineKey,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { pickEdgeMenuItem } from "../utils/pick-edge-menu-item.js";
  import {
    createTypeaheadBuffer,
    isTypeaheadKey,
    typeaheadIndex,
  } from "../utils/typeahead.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { verticalListFocus } from "../utils/vertical-list-focus.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

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

  /** @type {null | HTMLUListElement} */
  let menuRef = null;

  // Set when the menu, aligned under its trigger's inline start, would run
  // past the viewport's inline end; it then aligns to the trigger's end.
  let alignEnd = false;
  let wasExpanded = false;

  afterUpdate(() => {
    if (expanded && !wasExpanded && menuRef) {
      const { left, right } = menuRef.getBoundingClientRect();
      alignEnd =
        resolveLayoutDirection($layoutDirection, menuRef) === "rtl"
          ? left < 0
          : right > document.documentElement.clientWidth;
    } else if (!expanded) {
      // Measure from the default position on the next open.
      alignEnd = false;
    }
    wasExpanded = expanded;
  });

  // Present when this menu is a top-level item of a `HeaderNav`.
  const menubar = getContext("carbon:HeaderNav");
  const tabStop = menubar?.tabStop ?? readable(undefined);
  // In a vertical bar (the side nav) Up and Down move between items, so the
  // submenu opens with ArrowRight and closes with ArrowLeft instead.
  const vertical = menubar?.orientation === "vertical";
  // Everything is tabbable until the bar knows its items (and without a bar).
  $: tabindex = $tabStop === undefined || $tabStop === ref ? 0 : -1;

  const generatedId = uniqueId();
  // The menu is named by the trigger, so follow a consumer-provided `id`.
  $: triggerId = $$restProps.id ?? generatedId;

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
  $: if (ref) menubar?.setCurrent(ref, isCurrentSubmenu);

  const typeahead = createTypeaheadBuffer();

  /**
   * Typing focuses the next item whose label starts with the typed text.
   * @param {KeyboardEvent} event
   */
  function handleMenuKeydown(event) {
    if (event.defaultPrevented || !isTypeaheadKey(event)) return;
    const index = $menuItems.indexOf(event.target);
    const next = typeaheadIndex({
      items: $menuItems,
      query: typeahead.push(event.key),
      itemToString: (item) => item.textContent?.trim() ?? "",
      index,
      isDisabled: () => false,
    });
    if (next !== index) {
      event.preventDefault();
      $menuItems[next]?.focus();
    }
  }

  onMount(() => {
    const node = ref;
    if (menubar && node) {
      menubar.registerItem(node, {
        isOpen: () => expanded,
        // Reached by arrowing along the bar from another open menu.
        open: async () => {
          expanded = true;
          await tick();
          ($menuItems[0] ?? node).focus();
        },
        // The bar closes the menu when focus moves on to another item.
        close: () => {
          closeMenu("blur");
        },
      });
    }
    return () => {
      typeahead.clear();
      if (menubar && node) {
        menubar.setCurrent(node, false);
        menubar.unregisterItem(node);
      }
    };
  });

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
    } else if (
      vertical &&
      expanded &&
      inlineKey(event.key, $layoutDirection, menuRef) === "ArrowLeft" &&
      !event.defaultPrevented &&
      !(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) &&
      menuRef.contains(event.target)
    ) {
      // Back out of the submenu, like Escape.
      event.preventDefault();
      closeMenu("escape-key");
    }
  }}
>
  <a
    bind:this={ref}
    role="menuitem"
    {tabindex}
    aria-haspopup="menu"
    aria-expanded={expanded ? "true" : "false"}
    id={triggerId}
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
      } else if (
        // Leave modified keys to the browser: Alt/Cmd+ArrowRight is Forward,
        // Ctrl/Cmd+ArrowDown scrolls. Alt+ArrowDown still opens the menu.
        !(event.ctrlKey || event.metaKey) &&
        (vertical
          ? inlineKey(event.key, $layoutDirection, ref) === "ArrowRight" &&
            !event.altKey
          : event.key === "ArrowDown" || event.key === "ArrowUp")
      ) {
        event.preventDefault();
        if (!expanded) {
          expanded = true;
        }
        await tick();
        pickEdgeMenuItem(
          event.key === "ArrowUp" ? "ArrowUp" : "ArrowDown",
          $menuItems,
        )?.focus();
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
    <slot name="textChildren"><slot name="text">{text}</slot></slot>
    {#if icon || $$slots.icon}
      <slot name="icon">
        <svelte:component this={icon} size={16} />
      </slot>
    {/if}
    <ChevronDown class="bx--header__menu-arrow" />
  </a>
  <ul
    bind:this={menuRef}
    use:verticalListFocus={{ selector: "[role='menuitem']" }}
    role="menu"
    aria-labelledby={triggerId}
    class:bx--header__menu={true}
    class:bx--header__menu--align-end={alignEnd}
    on:keydown={handleMenuKeydown}
  >
    <slot />
  </ul>
</li>
