<script>
  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import { rovingFocus } from "../utils/roving-focus.js";

  const query = writable("");
  const hasVisibleItems = writable(true);

  /** @type {Map<string, boolean>} */
  const matches = new Map();

  function recomputeHasVisibleItems() {
    hasVisibleItems.set(
      matches.size === 0 || Array.from(matches.values()).some(Boolean),
    );
  }

  /**
   * @param {string} id
   * @param {boolean} isVisible
   */
  function setItemMatch(id, isVisible) {
    matches.set(id, isVisible);
    recomputeHasVisibleItems();
  }

  /** @param {string} id */
  function unregisterItem(id) {
    matches.delete(id);
    recomputeHasVisibleItems();
  }

  // Arrow-key navigation only activates once a `SideNavFilter` is present, so
  // an existing `SideNav` without one keeps its previous keyboard behavior.
  let hasFilter = false;

  /** @type {HTMLUListElement | null} */
  let itemsRef = null;

  // Every visible row is a stop: plain links, and a `SideNavMenu` toggle
  // button itself (whether the group is expanded or collapsed). A collapsed
  // group's own items are `inert` (not `hidden`), so they're excluded here
  // rather than being landed on and silently failing to focus.
  const FOCUSABLE_SELECTOR =
    "a.bx--side-nav__link, button.bx--side-nav__submenu";

  function getFocusableItems() {
    if (!itemsRef) return [];
    return Array.from(itemsRef.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
      (item) => !item.closest("[hidden], [inert]"),
    );
  }

  setContext("carbon:SideNavItems", {
    query,
    hasVisibleItems,
    setItemMatch,
    unregisterItem,
    registerFilter() {
      hasFilter = true;
      return () => {
        hasFilter = false;
      };
    },
    /** @param {1 | -1} direction */
    focusEdge(direction) {
      const items = getFocusableItems();
      if (items.length === 0) return;
      (direction === 1 ? items[0] : items[items.length - 1]).focus();
    },
  });
</script>

<ul
  bind:this={itemsRef}
  class:bx--side-nav__items={true}
  use:rovingFocus={{
    selector: FOCUSABLE_SELECTOR,
    getItems: () => (hasFilter ? getFocusableItems() : []),
    getActiveIndex: () => getFocusableItems().indexOf(document.activeElement),
    orientation: "vertical",
    focusOnMove: true,
  }}
>
  <slot />
</ul>
