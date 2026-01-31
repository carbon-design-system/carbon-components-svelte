<script>
  /**
   * @generics {Item extends DropdownItem<any> = DropdownItem<any>} Item
   * @template {DropdownItem<any>} Item
   * @typedef {object} DropdownItem<Id=any>
   * @property {Id} id
   * @property {string} text
   * @property {boolean} [disabled] - Whether the item is disabled
   * @event select
   * @type {object}
   * @property {Item["id"]} selectedId
   * @property {Item} selectedItem
   * @slot {{ item: Item; index: number; }}
   */

  /**
   * Set the dropdown items.
   * @type {ReadonlyArray<Item>}
   */
  export let items = [];

  /**
   * Override the display of a dropdown item.
   * @type {(item: Item) => string}
   */
  export let itemToString = (item) => item.text ?? item.id;

  /**
   * Specify the selected item id.
   * @type {Item["id"]}
   */
  export let selectedId;

  /**
   * Specify the type of dropdown.
   * @type {"default" | "inline"}
   */
  export let type = "default";

  /**
   * Specify the direction of the dropdown menu.
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /**
   * Specify the size of the dropdown field.
   * @type {"sm" | "lg" | "xl"}
   */
  export let size = undefined;

  /** Set to `true` to open the dropdown */
  export let open = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the dropdown */
  export let disabled = false;

  /** Specify the title text */
  export let labelText = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Specify the helper text */
  export let helperText = "";

  /**
   * Specify the list box label.
   * @type {string}
   */
  export let label = undefined;

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Override the chevron icon label based on the open state.
   * Defaults to "Open menu" when closed and "Close menu" when open.
   * @type {(id: import("../ListBox/ListBoxMenuIcon.svelte").ListBoxMenuIconTranslationId) => string}
   */
  export let translateWithId = undefined;

  /**
   * Enable virtualization for large lists. Virtualization renders only the items currently visible in the viewport, improving performance for large lists.
   *
   * By default, virtualization is automatically enabled for lists with more than 100 items.
   *
   * Set `virtualize={false}` to explicitly disable virtualization, even for large lists.
   *
   * Set `virtualize={true}` to explicitly enable virtualization with default settings.
   *
   * Provide an object to customize virtualization behavior:
   * - `itemHeight` (default: 40): The height in pixels of each item. Specify a custom value when using custom slots with multi-line items or different heights.
   * - `containerHeight` (default: 300): The maximum height in pixels of the dropdown container.
   * - `overscan` (default: 3): The number of extra items to render above and below the viewport for smoother scrolling. Higher values may cause more flickering during very fast scrolling.
   * - `threshold` (default: 100): The minimum number of items required before virtualization activates. Lists with fewer items will render all items normally without virtualization.
   * - `maxItems` (default: undefined): The maximum number of items to render. When undefined, all visible items are rendered.
   * @type {undefined | boolean | { itemHeight?: number, containerHeight?: number, overscan?: number, threshold?: number, maxItems?: number }}
   */
  export let virtualize = undefined;

  /** Set an id for the list box component */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Specify a name attribute for the list box.
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the button HTML element */
  export let ref = null;

  /**
   * Obtain a reference to the list HTML element.
   * @type {null | HTMLDivElement}
   */
  export let listRef = null;

  import { afterUpdate, createEventDispatcher, onMount, tick } from "svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import {
    ListBox,
    ListBoxMenu,
    ListBoxMenuIcon,
    ListBoxMenuItem,
  } from "../ListBox";
  import { virtualize as virtualizeUtil } from "../utils/virtualize.js";

  const dispatch = createEventDispatcher();

  /** Default item height in pixels for virtualization */
  const DEFAULT_ITEM_HEIGHT = 40;

  let highlightedIndex = -1;
  let prevHighlightedIndex = -1;
  let typeaheadBuffer = "";
  let typeaheadTimeout = null;
  let listScrollTop = 0;
  let prevOpen = false;

  const TYPEAHEAD_DELAY = 500;

  onMount(() => {
    return () => {
      if (typeaheadTimeout) {
        clearTimeout(typeaheadTimeout);
      }
    };
  });

  $: inline = type === "inline";
  $: selectedItem = items.find((item) => item.id === selectedId);
  $: if (!open) {
    highlightedIndex = -1;
    prevHighlightedIndex = -1;
    typeaheadBuffer = "";
    if (typeaheadTimeout) {
      clearTimeout(typeaheadTimeout);
      typeaheadTimeout = null;
    }
  }

  $: shouldVirtualize =
    virtualize === false
      ? false
      : virtualize !== undefined || items.length > 100;

  $: virtualConfig = shouldVirtualize
    ? {
        itemHeight: DEFAULT_ITEM_HEIGHT,
        containerHeight: 300,
        overscan: 3,
        threshold: 100,
        maxItems: undefined,
        ...(typeof virtualize === "object" ? virtualize : {}),
      }
    : null;

  $: virtualData = virtualConfig
    ? virtualizeUtil({
        items,
        scrollTop: listScrollTop,
        ...virtualConfig,
      })
    : null;

  $: itemsToRender = virtualData?.isVirtualized
    ? virtualData.visibleItems
    : items;

  afterUpdate(() => {
    // Scroll to highlighted item when it changes via keyboard navigation
    // Only scroll if the item is outside the visible viewport
    if (
      open &&
      shouldVirtualize &&
      virtualConfig &&
      highlightedIndex !== prevHighlightedIndex &&
      highlightedIndex >= 0 &&
      listRef
    ) {
      tick().then(() => {
        if (listRef && virtualConfig && highlightedIndex >= 0) {
          const itemHeight = virtualConfig.itemHeight;
          const containerHeight = virtualConfig.containerHeight;
          const overscan = virtualConfig.overscan ?? 3;

          // Calculate current visible range based on current scroll position
          const currentScrollTop = listRef.scrollTop ?? listScrollTop;
          const visibleStartIndex = Math.max(
            0,
            Math.floor(currentScrollTop / itemHeight) - overscan,
          );
          const visibleEndIndex = Math.min(
            items.length,
            Math.ceil((currentScrollTop + containerHeight) / itemHeight) +
              overscan,
          );

          // Only scroll if highlighted item is outside visible range
          if (
            highlightedIndex < visibleStartIndex ||
            highlightedIndex >= visibleEndIndex
          ) {
            const scrollPosition = highlightedIndex * itemHeight;
            // Ensure scroll position is within bounds
            const maxScroll = Math.max(
              0,
              items.length * itemHeight - containerHeight,
            );
            const finalScrollPosition = Math.max(
              0,
              Math.min(scrollPosition, maxScroll),
            );

            listScrollTop = finalScrollPosition;
            listRef.scrollTop = finalScrollPosition;
          }
        }
      });
      prevHighlightedIndex = highlightedIndex;
    }

    // Set highlighted index to selected item when menu opens
    const wasJustOpened = open && !prevOpen;
    if (wasJustOpened) {
      if (selectedId !== undefined && selectedItem) {
        const selectedIndex = items.findIndex((item) => item.id === selectedId);
        if (selectedIndex >= 0) {
          // Set highlighted index to selected item so keyboard nav starts there
          highlightedIndex = selectedIndex;
          prevHighlightedIndex = selectedIndex;
        }
      }
    }

    // Scroll to selected item when menu opens with virtualization
    if (wasJustOpened && shouldVirtualize && listRef) {
      tick().then(() => {
        if (listRef && virtualConfig) {
          if (selectedId !== undefined && selectedItem) {
            // Find the index of the selected item
            const selectedIndex = items.findIndex(
              (item) => item.id === selectedId,
            );
            if (selectedIndex >= 0) {
              // Calculate scroll position to show selected item at the top of viewport
              const itemHeight = virtualConfig.itemHeight;
              const containerHeight = virtualConfig.containerHeight;
              const scrollPosition = selectedIndex * itemHeight;
              // Ensure scroll position is within bounds
              const maxScroll = Math.max(
                0,
                items.length * itemHeight - containerHeight,
              );
              const finalScrollPosition = Math.max(
                0,
                Math.min(scrollPosition, maxScroll),
              );

              listScrollTop = finalScrollPosition;
              listRef.scrollTop = finalScrollPosition;
            } else {
              listRef.scrollTop = 0;
              listScrollTop = 0;
            }
          } else {
            listRef.scrollTop = 0;
            listScrollTop = 0;
          }
        }
      });
    }
    prevOpen = open;

    // Reset scroll position when menu closes
    if (!open && shouldVirtualize) {
      listScrollTop = 0;
    }
  });

  function change(dir) {
    let index = highlightedIndex + dir;

    if (items.length === 0) return;
    if (index < 0) {
      index = items.length - 1;
    } else if (index >= items.length) {
      index = 0;
    }

    let disabled = items[index].disabled;

    while (disabled) {
      index = index + dir;

      if (index < 0) {
        index = items.length - 1;
      } else if (index >= items.length) {
        index = 0;
      }

      disabled = items[index].disabled;
    }

    highlightedIndex = index;
  }

  function typeaheadSearch(char) {
    if (items.length === 0) return;

    if (typeaheadTimeout) {
      clearTimeout(typeaheadTimeout);
    }

    typeaheadBuffer += char.toLowerCase();

    typeaheadTimeout = setTimeout(() => {
      typeaheadBuffer = "";
      typeaheadTimeout = null;
    }, TYPEAHEAD_DELAY);

    // Start search from the next index after current highlight, or from 0 if none highlighted.
    const startIndex = highlightedIndex >= 0 ? highlightedIndex + 1 : 0;

    for (let i = startIndex; i < items.length; i++) {
      const itemText = itemToString(items[i]).toLowerCase();
      if (itemText.startsWith(typeaheadBuffer) && !items[i].disabled) {
        highlightedIndex = i;
        return;
      }
    }

    // Wrap around: search from beginning to startIndex.
    for (let i = 0; i < startIndex; i++) {
      const itemText = itemToString(items[i]).toLowerCase();
      if (itemText.startsWith(typeaheadBuffer) && !items[i].disabled) {
        highlightedIndex = i;
        return;
      }
    }
  }

  const dispatchSelect = () => {
    dispatch("select", {
      selectedId,
      selectedItem: items.find((item) => item.id === selectedId),
    });
  };
</script>

<svelte:window
  on:click={(e) => {
    if (open && ref && !ref.contains(e.target)) {
      open = false;
    }
  }}
/>

<div
  class:bx--dropdown__wrapper={true}
  class:bx--list-box__wrapper={true}
  class:bx--dropdown__wrapper--inline={inline}
  class:bx--list-box__wrapper--inline={inline}
  class:bx--dropdown__wrapper--inline--invalid={inline && invalid}
  {...$$restProps}
>
  {#if labelText}
    <label
      for={id}
      class:bx--label={true}
      class:bx--label--disabled={disabled}
      class:bx--visually-hidden={hideLabel}
    >
      {labelText}
    </label>
  {/if}
  <ListBox
    role={undefined}
    {type}
    {size}
    {name}
    aria-label={$$props["aria-label"]}
    class="bx--dropdown
      {direction === 'top' && 'bx--list-box--up'}
      {invalid && 'bx--dropdown--invalid'}
      {!invalid && warn && 'bx--dropdown--warning'}
      {open && 'bx--dropdown--open'}
      {size === 'sm' && 'bx--dropdown--sm'}
      {size === 'xl' && 'bx--dropdown--xl'}
      {inline && 'bx--dropdown--inline'}
      {disabled && 'bx--dropdown--disabled'}
      {light && 'bx--dropdown--light'}"
    on:click={({ target }) => {
      if (disabled) return;
      open = ref.contains(target) ? !open : false;
    }}
    {disabled}
    {open}
    {invalid}
    {invalidText}
    {light}
    {warn}
    {warnText}
  >
    {#if invalid}
      <WarningFilled class="bx--list-box__invalid-icon" />
    {/if}
    {#if !invalid && warn}
      <WarningAltFilled
        class="bx--list-box__invalid-icon bx--list-box__invalid-icon--warning"
      />
    {/if}
    <button
      bind:this={ref}
      type="button"
      class:bx--list-box__field={true}
      tabindex="0"
      aria-expanded={open}
      on:keydown={(e) => {
        if (["Enter", "ArrowDown", "ArrowUp"].includes(e.key)) {
          e.preventDefault();
        }

        if (e.key === "Enter") {
          open = !open;
          if (
            highlightedIndex > -1 &&
            items[highlightedIndex].id !== selectedId
          ) {
            selectedId = items[highlightedIndex].id;
            dispatchSelect();
            open = false;
          }
        } else if (e.key === "Tab") {
          open = false;
        } else if (e.key === "ArrowDown") {
          if (!open) open = true;
          change(1);
        } else if (e.key === "ArrowUp") {
          if (!open) open = true;
          change(-1);
        } else if (e.key === "Escape") {
          open = false;
        } else if (
          open &&
          e.key.length === 1 &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          e.preventDefault();
          typeaheadSearch(e.key);
        }
      }}
      on:keyup={(e) => {
        if ([" "].includes(e.key)) {
          e.preventDefault();
        } else {
          return;
        }
        open = !open;

        if (
          highlightedIndex > -1 &&
          items[highlightedIndex].id !== selectedId
        ) {
          selectedId = items[highlightedIndex].id;
          dispatchSelect();
          open = false;
        }
      }}
      {disabled}
      {translateWithId}
      {id}
    >
      <span class:bx--list-box__label={true}>
        {#if selectedItem}{itemToString(selectedItem)}{:else}{label}{/if}
      </span>
      <ListBoxMenuIcon
        on:click={(e) => {
          e.stopPropagation();
          if (disabled) return;
          open = !open;
        }}
        {translateWithId}
        {open}
      />
    </button>
    {#if open}
      <ListBoxMenu
        aria-labelledby={id}
        {id}
        on:scroll
        on:scroll={(e) => {
          listScrollTop = e.target.scrollTop;
        }}
        bind:ref={listRef}
        style={virtualConfig
          ? `max-height: ${virtualConfig.containerHeight}px; overflow-y: auto;`
          : undefined}
      >
        {#if virtualData?.isVirtualized}
          <div style="height: {virtualData.totalHeight}px; position: relative;">
            <div style="transform: translateY({virtualData.offsetY}px);">
              {#each itemsToRender as item, i (item.id)}
                {@const actualIndex = virtualData.startIndex + i}
                <ListBoxMenuItem
                  id={item.id}
                  active={selectedId === item.id}
                  highlighted={highlightedIndex === actualIndex}
                  disabled={item.disabled}
                  on:click={(e) => {
                    if (item.disabled) {
                      e.stopPropagation();
                      return;
                    }
                    selectedId = item.id;
                    dispatchSelect();
                    ref.focus();
                  }}
                  on:mouseenter={() => {
                    if (item.disabled) return;
                    highlightedIndex = actualIndex;
                  }}
                >
                  <slot {item} index={actualIndex}>
                    {itemToString(item)}
                  </slot>
                </ListBoxMenuItem>
              {/each}
            </div>
          </div>
        {:else}
          {#each itemsToRender as item, i (item.id)}
            <ListBoxMenuItem
              id={item.id}
              active={selectedId === item.id}
              highlighted={highlightedIndex === i}
              disabled={item.disabled}
              on:click={(e) => {
                if (item.disabled) {
                  e.stopPropagation();
                  return;
                }
                selectedId = item.id;
                dispatchSelect();
                ref.focus();
              }}
              on:mouseenter={() => {
                if (item.disabled) return;
                highlightedIndex = i;
              }}
            >
              <slot {item} index={i}>
                {itemToString(item)}
              </slot>
            </ListBoxMenuItem>
          {/each}
        {/if}
      </ListBoxMenu>
    {/if}
  </ListBox>
  {#if !inline && !invalid && !warn && helperText}
    <div
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
</div>
