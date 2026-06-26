<script>
  /**
   * @template {HeaderSearchResult} [Result=HeaderSearchResult]
   * @template [Icon=any]
   */

  /**
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "select"} trigger
   */

  /**
   * @typedef {object} HeaderSearchResult
   * @property {string | number} [id] - Unique result identifier; used as the each-block key when provided
   * @property {string} href
   * @property {string} text
   * @property {string} [description]
   * @event {null} active
   * @event {null} inactive
   * @event {null} clear
   * @event select
   * @type {object}
   * @property {string} value
   * @property {number} selectedResultIndex
   * @property {Result} selectedResult
   * @event {{ value: string }} submit
   * @slot {{ result: Result; index: number; selected: boolean; }}
   * @slot {{}} menu
   * @slot {{}} noResults
   * @slot {{}} loading
   */

  /**
   * Specify the search input value.
   * @bindable writable
   */
  export let value = "";

  /**
   * Set to `true` to activate and focus the search bar.
   * @bindable writable
   */
  export let active = false;

  /**
   * Obtain a reference to the input HTML element.
   * @type {HTMLInputElement | null}
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Render a list of search results.
   * @type {ReadonlyArray<Result>}
   */
  export let results = [];

  /**
   * Specify the selected result index.
   * @bindable readonly
   */
  export let selectedResultIndex = 0;

  /**
   * Specify the icon to render for the search trigger.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (IconSearch);

  /** Specify the `placeholder` attribute of the search input. */
  export let placeholder = "Search...";

  /** Specify the text for the assistive label associated with the search input. */
  export let labelText = "Search";

  /** Specify the label for the clear button. */
  export let closeButtonLabelText = "Clear search input";

  /**
   * Set to `true` to filter `menu`-slot items by the search value using fuzzy
   * matching. Requires the `menu` slot; ignored when using the `results` prop.
   */
  export let shouldFilter = true;

  /**
   * Override how the search value is matched against each `menu`-slot item's
   * `text`. Receives the item `text` and the current search value, and returns
   * whether the item `matched` along with the `indices` of characters to
   * highlight. Defaults to fuzzy matching. Requires the `menu` slot.
   * @type {(text: string, query: string) => { matched: boolean; indices?: number[] }}
   */
  export let match = fuzzyMatch;

  /**
   * Set to `true` to render a skeleton menu while results are loading.
   * Override the placeholder rows with the `loading` slot. Requires the
   * `menu` slot.
   */
  export let loading = false;

  /** Number of skeleton rows while `loading`. Requires the `menu` slot. */
  export let skeletonCount = 4;

  /**
   * Row density for the `menu` slot. Result text stays flush with the header
   * input; smaller sizes shorten rows to fit more results.
   * @type {"sm" | "lg" | "xl"}
   */
  export let size = "sm";

  import { createEventDispatcher, setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import Close from "../icons/Close.svelte";
  import IconSearch from "../icons/IconSearch.svelte";
  import SkeletonText from "../SkeletonText/SkeletonText.svelte";
  import { dismiss } from "../utils/dismiss.js";
  import { fuzzyMatch } from "../utils/fuzzyMatch.js";
  import { isOutsideClick } from "../utils/isOutsideClick.js";

  const dispatch = createEventDispatcher();

  const id = `ccs-${Math.random().toString(36)}`;
  const inputId = `${id}-input`;
  const labelId = `${id}-label`;
  const menuId = `${id}-menu`;

  /** @type {null | HTMLDivElement} */
  let refSearch = null;
  /** @type {null | HTMLElement} */
  let menuRef = null;
  let prevActive;
  // Escape closes the menu but leaves the search bar open.
  let menuDismissed = false;

  // `menu` slot shares SearchMenu context with SearchMenuItem/SearchMenuGroup.
  $: richMenu = Boolean($$slots.menu);

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
  $: hasPrimaryItemsStore.set(primaryItemIds.size > 0);

  const SKELETON_WIDTHS = ["75%", "90%", "65%", "80%"];
  $: skeletonWidths = Array.from(
    { length: Math.max(0, skeletonCount) },
    (_, i) => SKELETON_WIDTHS[i % SKELETON_WIDTHS.length],
  );

  $: itemCount = itemIds.size;
  $: hasQuery = String(value ?? "").length > 0;
  $: showNoResults =
    richMenu &&
    !loading &&
    hasQuery &&
    filterableIds.size === 0 &&
    itemCount === 0 &&
    $$slots.noResults;
  $: richMenuVisible =
    richMenu &&
    active &&
    !menuDismissed &&
    (loading || itemCount > 0 || showNoResults);

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
      reset();
      dispatch("close", { trigger: "select" });
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

  /** Keyboard navigation for the `menu` slot (`role="option"`). */
  function handleRichKeydown(event) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        menuDismissed = false;
        if (richMenuVisible) moveActive(1);
        break;
      case "ArrowUp":
        if (!richMenuVisible) return;
        event.preventDefault();
        moveActive(-1);
        break;
      case "Home":
        if (!richMenuVisible) return;
        event.preventDefault();
        setActiveEdge("first");
        break;
      case "End":
        if (!richMenuVisible) return;
        event.preventDefault();
        setActiveEdge("last");
        break;
      case "Enter": {
        const active = $activeId
          ? getOptionElements().find((el) => el.id === $activeId)
          : null;
        if (richMenuVisible && active) {
          event.preventDefault();
          active.click();
        } else {
          dispatch("submit", { value });
        }
        break;
      }
      case "Escape":
        if (richMenuVisible) {
          // Close the menu but keep the bar active and the value intact.
          menuDismissed = true;
          activeId.set(null);
        } else if (value === "") {
          active = false;
          dispatch("close", { trigger: "escape-key" });
        } else {
          value = "";
        }
        break;
    }
  }

  function reset() {
    active = false;
    value = "";
    selectedResultIndex = 0;
    menuDismissed = false;
    activeId.set(null);
  }

  function selectResult() {
    dispatch("select", { value, selectedResultIndex, selectedResult });
    reset();
    dispatch("close", { trigger: "select" });
  }

  $: if (active && ref) ref.focus();
  $: if (!active && ref) ref.blur();
  $: {
    if (prevActive !== undefined) {
      dispatch(active ? "active" : "inactive");
    }
    prevActive = active;
  }
  $: selectedResult = results[selectedResultIndex];
  $: selectedId = selectedResult
    ? `${id}-menuitem-${selectedResult.id ?? selectedResultIndex}`
    : undefined;

  function handleOutsideMouseup(event) {
    if (active && isOutsideClick(event, refSearch)) {
      active = false;
      activeId.set(null);
      menuDismissed = false;
      dispatch("close", { trigger: "outside-click" });
    }
  }

  // Clicks on group headers or padding blur the input; refocus so only item
  // selection closes the menu.
  function handleMenuPointerDown() {
    ref?.focus();
  }
</script>

<div
  bind:this={refSearch}
  use:dismiss={{ enabled: active, type: "mouseup", handler: handleOutsideMouseup }}
  class:bx--header__search={true}
  role="search"
  class:bx--header__search--active={active}
>
  <label class:bx--header__search-label={true} for={inputId} id={labelId}
    >{labelText}</label
  >
  <div
    class:bx--header__search-menu={true}
    aria-owns={menuId}
    aria-haspopup="menu"
  >
    <button
      type="button"
      aria-label="Search"
      aria-expanded={active}
      tabindex={active ? "-1" : "0"}
      class:bx--header-search-button={true}
      class:bx--header__action={true}
      class:bx--header-search-button--disabled={active}
      on:click={() => {
        active = true;
      }}
    >
      <svelte:component this={icon} size={20} title="Search" />
    </button>
    <input
      bind:this={ref}
      type="text"
      autocomplete="off"
      {placeholder}
      tabindex={active ? "0" : "-1"}
      class:bx--header__search-input={true}
      class:bx--header__search--active={active}
      {...$$restProps}
      id={inputId}
      role={richMenu ? "combobox" : undefined}
      aria-autocomplete="list"
      aria-controls={menuId}
      aria-expanded={richMenu ? richMenuVisible : undefined}
      aria-activedescendant={richMenu ? ($activeId ?? undefined) : selectedId}
      bind:value
      on:change
      on:input
      on:input={() => {
        if (richMenu) menuDismissed = false;
      }}
      on:focus
      on:blur
      on:keydown
      on:keydown={(event) => {
        if (richMenu) {
          handleRichKeydown(event);
          return;
        }
        switch (event.key) {
          case "Enter":
            selectResult();
            break;
          case "ArrowDown":
            event.preventDefault();
            if (selectedResultIndex === results.length - 1) {
              selectedResultIndex = 0;
            } else {
              selectedResultIndex += 1;
            }
            break;
          case "ArrowUp":
            event.preventDefault();
            if (selectedResultIndex === 0) {
              selectedResultIndex = results.length - 1;
            } else {
              selectedResultIndex -= 1;
            }
            break;
          case "Escape":
            if (value === "") {
              // If the search bar is empty, deactivate the input.
              active = false;
              dispatch("close", { trigger: "escape-key" });
            }

            // Reset the search query but keep the search bar active.
            // Do not dispatch "clear" event as that should fire only on the "x" button.
            value = "";
            selectedResultIndex = 0;
            break;
        }
      }}
      on:paste
    >
    {#if active}
      <button
        type="button"
        aria-label={closeButtonLabelText}
        tabindex="0"
        class:bx--header__action={true}
        class:bx--header-search-button={true}
        on:click={() => {
          reset();
          dispatch("clear");
        }}
      >
        <Close size={20} title={closeButtonLabelText} />
      </button>
    {/if}
  </div>

  {#if richMenu && active}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      bind:this={menuRef}
      id={menuId}
      role="listbox"
      tabindex="-1"
      aria-label="Search"
      aria-busy={loading || undefined}
      hidden={!richMenuVisible}
      class="bx--header__search-menu-rich bx--header__search-menu-rich--{size}"
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
        <slot name="menu" />
        {#if showNoResults}
          <div class="bx--search-menu__no-results">
            <slot name="noResults" />
          </div>
        {/if}
      {/if}
    </div>
  {:else if active && results.length > 0}
    <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
    <ul
      aria-labelledby={labelId}
      role="menu"
      id={menuId}
      class:bx--header-search-menu={true}
    >
      {#each results as result, index (result.id ?? index)}
        <li role="none">
          <a
            tabindex="-1"
            id="{id}-menuitem-{result.id ?? index}"
            role="menuitem"
            href={result.href}
            class:bx--header-search-menu-item={true}
            class:bx--header-search-menu-item--selected={selectedId ===
              `${id}-menuitem-${result.id ?? index}`}
            on:click|preventDefault={async () => {
              selectedResultIndex = index;
              await tick();
              selectResult();
            }}
          >
            <slot {result} {index} selected={selectedResultIndex === index}>
              {result.text}
              {#if result.description}
                <span class:bx--header-search-menu-description={true}
                  >– {result.description}</span
                >
              {/if}
            </slot>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>
