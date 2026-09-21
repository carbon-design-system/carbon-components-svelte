<script>
  /**
   * @template [Icon=any]
   */

  /**
   * Set to `true` to toggle the expanded state.
   * @bindable writable
   */
  export let expanded = false;

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

  const outerFilterCtx = getContext("carbon:SideNavItems");
  const { query, setItemMatch, unregisterItem } = outerFilterCtx ?? {
    query: readable(""),
    setItemMatch: () => {},
    unregisterItem: () => {},
  };
  const id = uniqueId();

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

  // Children (`SideNavMenuItem`) register against this nested context rather
  // than the outer `SideNavItems` one, so only this menu's own descendants
  // count toward whether this menu itself has a visible match.
  setContext("carbon:SideNavMenu", { query, setChildMatch, unregisterChild });

  $: groupVisible = $query.length === 0 || $anyChildVisible;
  $: setItemMatch(id, groupVisible);
  onMount(() => () => unregisterItem(id));

  let savedExpanded = expanded;
  let wasFiltering = false;
  $: {
    const filtering = $query.length > 0;
    if ($isSideNavRail && $isSideNavCollapsed) {
      expanded = false;
    }
    if (filtering && !wasFiltering) {
      savedExpanded = expanded;
    }
    if (filtering) {
      if ($anyChildVisible) expanded = true;
    } else if (wasFiltering) {
      expanded = savedExpanded;
    }
    wasFiltering = filtering;
  }
</script>

<li
  hidden={!groupVisible || undefined}
  class:bx--side-nav__item={true}
  class:bx--side-nav__item--icon={icon}
  class:bx--side-nav__item--large={large}
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
    <span
      class:bx--side-nav__icon={true}
      class:bx--side-nav__icon--small={true}
      class:bx--side-nav__submenu-chevron={true}
    >
      <ChevronDown />
    </span>
  </button>
  <ul
    inert={expanded ? undefined : "true"}
    class:bx--side-nav__menu={true}
    style:max-height={expanded ? "none" : undefined}
  >
    <slot />
  </ul>
</li>
