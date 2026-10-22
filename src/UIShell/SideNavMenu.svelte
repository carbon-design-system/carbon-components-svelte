<script>
  /**
   * @template [Icon=any]
   */

  /**
   * @slot {{}} badge
   */

  /**
   * Set to `true` to toggle the expanded state.
   * @bindable writable
   */
  export let expanded = false;

  /** Set to `true` to mark the menu as containing the current page. */
  export let isActive = false;

  /** Set to `true` to use the large variant */
  export let large = false;

  /**
   * Specify the text.
   * @type {string}
   */
  export let text = undefined;

  /**
   * Specify the icon to render.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Obtain a reference to the HTML button element.
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount, setContext } from "svelte";
  import { readable, writable } from "svelte/store";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import { uniqueId } from "../utils/unique-id.js";
  import { isSideNavCollapsed, isSideNavRail } from "./nav-store.js";

  const parentMenu = getContext("carbon:SideNavMenu");
  /** @type {number} */
  const depth = (parentMenu?.depth ?? 0) + 1;
  const parentIconDepth = parentMenu?.iconDepth ?? readable(0);

  /** Menus with an icon from the outermost one through this one. */
  const iconDepth = writable(0);

  /** Descendant links and menus that contain the current page. */
  let currentKeys = new Set();

  function setCurrent(key, selected) {
    if (selected === currentKeys.has(key)) return;
    if (selected) currentKeys.add(key);
    else currentKeys.delete(key);
    currentKeys = currentKeys;
  }

  // A `SideNavFilter` shares its query through the nearest `SideNavItems`. The
  // menu is visible while any of its own items (or nested menus) match, and
  // reports that to its parent menu, else to the list.
  const itemsCtx = getContext("carbon:SideNavItems");
  const query = itemsCtx?.query ?? readable("");
  const filterId = uniqueId();

  /** @type {Map<string, boolean>} */
  const childMatches = new Map();
  const anyChildVisible = writable(false);

  function recomputeChildVisible() {
    anyChildVisible.set(Array.from(childMatches.values()).some(Boolean));
  }

  /**
   * @param {string} childId
   * @param {boolean} isVisible
   */
  function setChildMatch(childId, isVisible) {
    childMatches.set(childId, isVisible);
    recomputeChildVisible();
  }

  /** @param {string} childId */
  function unregisterChild(childId) {
    childMatches.delete(childId);
    recomputeChildVisible();
  }

  setContext("carbon:SideNavMenu", {
    depth,
    iconDepth,
    setCurrent,
    setChildMatch,
    unregisterChild,
  });

  $: groupVisible = $query.length === 0 || $anyChildVisible;
  $: (parentMenu?.setChildMatch ?? itemsCtx?.setItemMatch)?.(
    filterId,
    groupVisible,
  );

  $: iconDepth.set($parentIconDepth + (icon || $$slots.icon ? 1 : 0));

  $: current = currentKeys.size > 0;

  const key = {};

  $: parentMenu?.setCurrent(key, isActive || current);

  let menuRef = null;

  $: if ($isSideNavRail && $isSideNavCollapsed) {
    expanded = false;
  }

  // While a filter has matches in this menu it opens, and it goes back to
  // its prior state once the filter clears. Run from a function so toggling
  // the menu by hand while filtering doesn't re-apply the filter's state.
  let savedExpanded = expanded;
  let wasFiltering = false;

  /**
   * @param {boolean} filtering
   * @param {boolean} hasMatch
   */
  function syncFilterExpansion(filtering, hasMatch) {
    if (filtering && !wasFiltering) savedExpanded = expanded;
    if (filtering) {
      if (hasMatch) expanded = true;
    } else if (wasFiltering) {
      expanded = savedExpanded;
    }
    wasFiltering = filtering;
  }

  $: syncFilterExpansion($query.length > 0, $anyChildVisible);

  onMount(() => {
    if (menuRef?.querySelector('[aria-current="page"]')) {
      expanded = true;
    }

    return () => {
      parentMenu?.setCurrent(key, false);
      (parentMenu?.unregisterChild ?? itemsCtx?.unregisterItem)?.(filterId);
    };
  });
</script>

<li
  hidden={!groupVisible || undefined}
  class:bx--side-nav__item={true}
  class:bx--side-nav__item--icon={icon || $$slots.icon}
  class:bx--side-nav__item--large={large}
  class:bx--side-nav__item--active={(isActive || current) && !expanded}
>
  <button
    type="button"
    bind:this={ref}
    aria-expanded={expanded}
    class:bx--side-nav__submenu={true}
    {...$$restProps}
    on:click
    on:click={() => {
      expanded = !expanded;
    }}
  >
    {#if $$slots.icon || icon}
      <span class:bx--side-nav__icon={true}>
        <slot name="icon"> <svelte:component this={icon} /> </slot>
      </span>
    {/if}
    <span class:bx--side-nav__submenu-title={true}>{text}</span>
    {#if $$slots.badge}
      <div class:bx--side-nav__submenu-badge={true}><slot name="badge" /></div>
    {/if}
    <span
      class:bx--side-nav__icon={true}
      class:bx--side-nav__icon--small={true}
      class:bx--side-nav__submenu-chevron={true}
    >
      <ChevronDown />
    </span>
  </button>
  <ul
    bind:this={menuRef}
    inert={expanded ? undefined : "true"}
    class:bx--side-nav__menu={true}
    style:max-height={expanded ? "none" : undefined}
    style:--ccs-side-nav-menu-depth={depth > 1 ? depth : undefined}
    style:--ccs-side-nav-menu-icon-depth={depth > 1 ? $iconDepth : undefined}
  >
    <slot />
  </ul>
</li>
