<script>
  /**
   * @template [T=string]
   */

  /**
   * @event {{ value: string; item: { text?: string; value?: string; href?: string }; event: Event }} select
   * @event {{ value: T }} submit
   * @event {{ trigger: "escape-key" | "outside-click" | "select" | "blur" }} close
   * @restProps {input}
   * @slot {{}} before
   * @slot {{}} noResults
   * @slot {{}} loading
   */

  /**
   * Specify the value of the search input.
   * @type {T}
   * @bindable writable
   */
  export let value = /** @type {T} */ ("");

  /**
   * Whether the results menu is visible. Driven by focus and available content.
   * @bindable readonly
   */
  export let open = false;

  /** Set to `true` to filter items by the search value using fuzzy matching */
  export let shouldFilter = true;

  /**
   * Override how the search value is matched against each item's `text`.
   * Receives the item `text` and the current search value, and returns whether
   * the item `matched` along with the `indices` of characters to highlight.
   * Defaults to fuzzy matching. Supply your own function for custom filtering
   * and highlighting, or pass a no-op like `() => ({ matched: true })` to keep
   * every item and disable highlighting.
   * @type {(text: string, query: string) => { matched: boolean; indices?: number[] }}
   */
  export let match = fuzzyMatch;

  /**
   * Specify the size of the search input.
   * @type {"xs" | "sm" | "lg" | "xl"}
   */
  export let size = "xl";

  /**
   * Specify the size of the results menu, independent of the input `size`.
   * Defaults to the input `size`.
   * @type {"xs" | "sm" | "lg" | "xl"}
   */
  export let menuSize = undefined;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the search input */
  export let disabled = false;

  /**
   * Set to `true` to render a skeleton menu while results are loading, for
   * example while fetching server-side results. Override the placeholder rows
   * with the `loading` slot.
   */
  export let loading = false;

  /** Specify the number of skeleton rows rendered while `loading` */
  export let skeletonCount = 4;

  /** Specify the placeholder text */
  export let placeholder = "Search...";

  /** Specify the label text */
  export let labelText = "";

  /** Specify the close button label text */
  export let closeButtonLabelText = "Clear search input";

  /**
   * Specify the icon to render.
   * @type {any}
   */
  export let icon = undefined;

  /**
   * Specify the direction of the results menu.
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /** Set to `true` to render the menu in a portal to escape `overflow: hidden` containers */
  export let portal = true;

  /** Specify a class passed to the inner Search element */
  export let searchClass = "";

  /** Set an id for the search input */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Obtain a reference to the input HTML element.
   * @type {null | HTMLInputElement}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Obtain a reference to the menu HTML element.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let menuRef = null;

  import { createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import Search from "../Search/Search.svelte";
  import SkeletonText from "../SkeletonText/SkeletonText.svelte";
  import { dismiss } from "../utils/dismiss.js";
  import { fuzzyMatch } from "../utils/fuzzyMatch.js";
  import { isOutsideClick } from "../utils/isOutsideClick.js";

  const dispatch = createEventDispatcher();

  let anchorRef = null;
  let searchAnchorRef = null;
  let focused = false;
  let dismissed = false;
  let refocusOnBlur = false;

  const queryStore = writable("");
  const shouldFilterStore = writable(shouldFilter);
  const matchStore = writable(match);
  const activeId = writable(/** @type {string | null} */ (null));
  const hasPrimaryItemsStore = writable(false);

  let itemIds = new Set();
  let filterableIds = new Set();
  let primaryItemIds = new Set();

  $: queryStore.set(String(value ?? ""));
  $: shouldFilterStore.set(shouldFilter);
  $: matchStore.set(match);

  // Varying widths so the skeleton rows mimic results of different lengths.
  const SKELETON_WIDTHS = ["75%", "90%", "65%", "80%"];
  $: skeletonWidths = Array.from(
    { length: Math.max(0, skeletonCount) },
    (_, i) => SKELETON_WIDTHS[i % SKELETON_WIDTHS.length],
  );

  $: itemCount = itemIds.size;
  $: hasPrimaryItemsStore.set(primaryItemIds.size > 0);
  $: hasQuery = String(value ?? "").length > 0;
  $: showNoResults =
    !loading &&
    hasQuery &&
    filterableIds.size === 0 &&
    itemCount === 0 &&
    $$slots.noResults;
  $: open = !disabled && focused && !dismissed;
  $: menuVisible = open && (loading || itemCount > 0 || showNoResults);
  $: menuDomId = `menu-${id}`;
  $: menuLabel = labelText || placeholder;
  $: menuAnchor = $$slots.before ? searchAnchorRef : anchorRef;
  $: resolvedMenuSize = menuSize ?? size;
  $: menuClass = [
    "bx--search-menu__menu",
    `bx--search-menu__menu--${resolvedMenuSize}`,
    !menuVisible && "bx--search-menu__menu--hidden",
  ]
    .filter(Boolean)
    .join(" ");

  setContext("carbon:SearchMenu", {
    query: queryStore,
    shouldFilter: shouldFilterStore,
    match: matchStore,
    activeId,
    setActiveId(next) {
      activeId.set(next);
    },
    selectItem(detail) {
      value = detail.value ?? value;
      dispatch("select", detail);
      close("select");
      dismissed = true;
      activeId.set(null);
    },
    hasPrimaryItems: hasPrimaryItemsStore,
    registerItem(itemId, filterable, inDividerGroup = false) {
      itemIds.add(itemId);
      if (filterable) filterableIds.add(itemId);
      else filterableIds.delete(itemId);
      if (inDividerGroup) primaryItemIds.delete(itemId);
      else primaryItemIds.add(itemId);
      itemIds = itemIds;
      filterableIds = filterableIds;
      primaryItemIds = primaryItemIds;
    },
    unregisterItem(itemId) {
      itemIds.delete(itemId);
      filterableIds.delete(itemId);
      primaryItemIds.delete(itemId);
      itemIds = itemIds;
      filterableIds = filterableIds;
      primaryItemIds = primaryItemIds;
    },
  });

  // `open` is reactive, so it lags within a tick; derive the live open state
  // synchronously to guard `close` against emitting twice for one dismissal
  // (e.g. a blur immediately followed by an outside-click handler).
  function isMenuOpen() {
    return !disabled && focused && !dismissed;
  }

  function close(trigger) {
    if (isMenuOpen()) dispatch("close", { trigger });
  }

  function getOptionElements() {
    if (!menuRef) return [];
    return Array.from(menuRef.querySelectorAll('[role="option"]')).filter(
      (el) => el.getAttribute("aria-disabled") !== "true",
    );
  }

  function moveActive(step) {
    const els = getOptionElements();
    if (els.length === 0) {
      activeId.set(null);
      return;
    }
    const current = els.findIndex((el) => el.id === $activeId);
    let next = current + step;
    if (next < 0) next = els.length - 1;
    else if (next >= els.length) next = 0;
    activeId.set(els[next].id);
  }

  function setActiveEdge(edge) {
    const els = getOptionElements();
    if (els.length === 0) return;
    activeId.set(els[edge === "first" ? 0 : els.length - 1].id);
  }

  function handleKeydown(event) {
    if (disabled) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        dismissed = false;
        if (menuVisible) moveActive(1);
        break;
      case "ArrowUp":
        if (!menuVisible) return;
        event.preventDefault();
        moveActive(-1);
        break;
      case "Home":
        if (!menuVisible) return;
        event.preventDefault();
        setActiveEdge("first");
        break;
      case "End":
        if (!menuVisible) return;
        event.preventDefault();
        setActiveEdge("last");
        break;
      case "Enter": {
        const active = $activeId
          ? getOptionElements().find((el) => el.id === $activeId)
          : null;
        if (menuVisible && active) {
          event.preventDefault();
          active.click();
        } else {
          dispatch("submit", { value });
        }
        break;
      }
      case "Escape":
        if (open) {
          // Close the menu without letting Search clear the value.
          event.stopImmediatePropagation();
          close("escape-key");
          dismissed = true;
          activeId.set(null);
        }
        break;
    }
  }

  function handleFocus() {
    focused = true;
    dismissed = false;
  }

  function handleBeforeInteraction() {
    close("outside-click");
    dismissed = true;
    activeId.set(null);
  }

  function handleBlur(event) {
    const next = event.relatedTarget;
    if (
      next instanceof Node &&
      (searchAnchorRef?.contains(next) || menuRef?.contains(next))
    ) {
      return;
    }
    // A pointer press on a non-interactive menu area (a group header, padding)
    // blurs the input with no relatedTarget. Keep focus on the input so those
    // are dead click areas; only selecting an item should close the menu.
    if (refocusOnBlur) {
      refocusOnBlur = false;
      ref?.focus();
      return;
    }
    close("blur");
    focused = false;
    activeId.set(null);
  }

  function handleMenuPointerDown() {
    refocusOnBlur = true;
    // Clears on the next frame whether or not a blur followed (e.g. the input
    // was already blurred), so a later outside click still closes the menu.
    requestAnimationFrame(() => {
      refocusOnBlur = false;
    });
  }

  function handleInput() {
    dismissed = false;
  }

  function handleOutsideClick(event) {
    if (open && isOutsideClick(event, [anchorRef, portal ? menuRef : null])) {
      close("outside-click");
      dismissed = true;
      activeId.set(null);
    }
  }
</script>

<div
  bind:this={anchorRef}
  class:bx--search-menu={true}
  class:bx--search-menu--bar={$$slots.before}
  use:dismiss={{ enabled: open, type: "click", handler: handleOutsideClick }}
>
  {#if $$slots.before}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class:bx--search-menu__before={true}
      on:mousedown={handleBeforeInteraction}
      on:focusin={handleBeforeInteraction}
    >
      <slot name="before" />
    </div>
  {/if}
  <div bind:this={searchAnchorRef} class:bx--search-menu__search={true}>
    <Search
      {size}
      {light}
      {disabled}
      {placeholder}
      {labelText}
      {closeButtonLabelText}
      {icon}
      {id}
      {searchClass}
      bind:value
      bind:ref
      role="combobox"
      tabindex="0"
      aria-autocomplete="list"
      aria-expanded={menuVisible}
      aria-controls={menuVisible ? menuDomId : undefined}
      aria-activedescendant={$activeId ?? undefined}
      {...$$restProps}
      on:focus
      on:focus={handleFocus}
      on:blur
      on:blur={handleBlur}
      on:input
      on:input={handleInput}
      on:change
      on:clear
      on:keydown
      on:keydown={handleKeydown}
      on:keyup
      on:paste
    />
    {#if open && !portal}
      <div
        bind:this={menuRef}
        id={menuDomId}
        role="listbox"
        tabindex="-1"
        aria-label={menuLabel}
        aria-busy={loading || undefined}
        class:bx--search-menu__menu--inline={true}
        class={menuClass}
        on:mousedown={handleMenuPointerDown}
      >
        {#if loading}
          <slot name="loading">
            {#each skeletonWidths as width, i (i)}
              <div class="bx--search-menu-item bx--search-menu-item--skeleton">
                <SkeletonText {width} />
              </div>
            {/each}
          </slot>
        {:else}
          <slot />
          {#if showNoResults}
            <div class:bx--search-menu__no-results={true}>
              <slot name="noResults" />
            </div>
          {/if}
        {/if}
      </div>
    {/if}
  </div>
  {#if open && portal}
    <FloatingPortal anchor={menuAnchor} {direction} {open}>
      <div
        bind:this={menuRef}
        id={menuDomId}
        role="listbox"
        tabindex="-1"
        aria-label={menuLabel}
        aria-busy={loading || undefined}
        class={menuClass}
        on:mousedown={handleMenuPointerDown}
      >
        {#if loading}
          <slot name="loading">
            {#each skeletonWidths as width, i (i)}
              <div class="bx--search-menu-item bx--search-menu-item--skeleton">
                <SkeletonText {width} />
              </div>
            {/each}
          </slot>
        {:else}
          <slot />
          {#if showNoResults}
            <div class="bx--search-menu__no-results">
              <slot name="noResults" />
            </div>
          {/if}
        {/if}
      </div>
    </FloatingPortal>
  {/if}
</div>
