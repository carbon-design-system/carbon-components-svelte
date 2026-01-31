<script>
  /**
   * @generics {Item extends ComboBoxItem<any> = ComboBoxItem<any>} Item
   * @template {ComboBoxItem<any>} Item
   * @typedef {object} ComboBoxItem<Id=any>
   * @property {Id} id
   * @property {string} text
   * @property {boolean} [disabled] - Whether the item is disabled
   * @event select
   * @type {object}
   * @property {Item["id"]} selectedId
   * @property {Item} selectedItem
   * @event {KeyboardEvent | MouseEvent} clear
   * @slot {{ item: Item; index: number }}
   */

  /**
   * Set the combobox items.
   * @type {ReadonlyArray<Item>}
   */
  export let items = [];

  /**
   * Override the display of a combobox item.
   * @type {(item: Item) => string}
   */
  export let itemToString = (item) => item.text ?? item.id;

  /**
   * Set the selected item by value id.
   * @type {Item["id"]}
   */
  export let selectedId = undefined;

  /** Specify the selected combobox value */
  export let value = "";

  /**
   * Specify the direction of the combobox dropdown menu.
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /**
   * Set the size of the combobox.
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /** Set to `true` to disable the combobox */
  export let disabled = false;

  /** Specify the title text of the combobox */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Specify the helper text */
  export let helperText = "";

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to open the combobox menu dropdown */
  export let open = false;

  /**
   * Set to `true` to allow custom values that are not in the items list.
   * By default, user-entered text is cleared when the combobox loses focus without selecting an item.
   * When enabled, custom text is preserved.
   */
  export let allowCustomValue = false;

  /**
   * Set to `true` to clear the input value when opening the dropdown.
   * This allows users to see all available items instead of only filtered results.
   * The original value is restored if the dropdown is closed without making a selection.
   */
  export let clearFilterOnOpen = false;

  /** Set to `true` to enable autocomplete with typeahead */
  export let typeahead = false;

  /**
   * Determine if an item should be filtered given the current combobox value.
   * Will be ignored if `typeahead` is enabled.
   * @type {(item: Item, value: string) => boolean}
   */
  export let shouldFilterItem = () => true;

  /**
   * Override the chevron icon label based on the open state.
   * Defaults to "Open menu" when closed and "Close menu" when open.
   * @type {(id: import("../ListBox/ListBoxMenuIcon.svelte").ListBoxMenuIconTranslationId) => string}
   */
  export let translateWithId = undefined;

  /**
   * Override the label of the clear button when the input has a selection.
   * Defaults to "Clear selected item" since a combo box can only have one selection.
   * @type {(id: "clearSelection") => string}
   */
  export let translateWithIdSelection = undefined;

  /** Set an id for the list box component */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Specify a name attribute for the input.
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  /**
   * Obtain a reference to the list HTML element.
   * @type {null | HTMLDivElement}
   */
  export let listRef = null;

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

  import { afterUpdate, createEventDispatcher, tick } from "svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import ListBox from "../ListBox/ListBox.svelte";
  import ListBoxMenu from "../ListBox/ListBoxMenu.svelte";
  import ListBoxMenuIcon from "../ListBox/ListBoxMenuIcon.svelte";
  import ListBoxMenuItem from "../ListBox/ListBoxMenuItem.svelte";
  import ListBoxSelection from "../ListBox/ListBoxSelection.svelte";
  import { virtualize as virtualizeUtil } from "../utils/virtualize.js";

  const dispatch = createEventDispatcher();

  /** Default item height in pixels for virtualization */
  const DEFAULT_ITEM_HEIGHT = 40;

  let selectedItem = undefined;
  let prevSelectedId = null;
  let highlightedIndex = -1;
  let prevHighlightedIndex = -1;
  let valueBeforeOpen = "";
  let prevInputLength = 0;
  let listScrollTop = 0;
  let prevOpen = false;

  /**
   * @param {Item} item
   * @param {string} inputValue
   * @returns {boolean}
   */
  function autocompleteCustomFilter(item, inputValue) {
    if (inputValue.length === 0) {
      return true;
    }

    const lowercaseItem = item.text.toLowerCase();
    const lowercaseInput = inputValue.toLowerCase();

    return lowercaseItem.startsWith(lowercaseInput);
  }

  $: filterFn = typeahead ? autocompleteCustomFilter : shouldFilterItem;

  function change(dir) {
    let index = highlightedIndex + dir;
    let _items = filteredItems?.length ? filteredItems : items;
    if (_items.length === 0) return;
    if (index < 0) {
      index = _items.length - 1;
    } else if (index >= _items.length) {
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

  /**
   * Clear the combo box programmatically.
   * By default, focuses the combo box after clearing. Set `options.focus` to `false` to prevent focusing.
   * @type {(options?: { focus?: boolean; }) => Promise<void>}
   * @example
   * ```svelte
   * <ComboBox bind:this={comboBox} items={items} />
   * <button on:click={() => comboBox.clear()}>Clear</button>
   * <button on:click={() => comboBox.clear({ focus: false })}>Clear (No Focus)</button>
   * ```
   */
  export async function clear(options = {}) {
    prevSelectedId = null;
    highlightedIndex = -1;
    highlightedId = undefined;
    selectedId = undefined;
    selectedItem = undefined;
    open = false;
    value = "";
    // Ensure binding updates are complete before focusing.
    await tick();
    if (options?.focus !== false) ref?.focus();
  }

  afterUpdate(() => {
    // Scroll to highlighted item when it changes via keyboard navigation
    // Only scroll if the item is outside the visible viewport
    const wasJustOpened = open && !prevOpen;
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
            filteredItems.length,
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
              filteredItems.length * itemHeight - containerHeight,
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
    if (wasJustOpened) {
      if (selectedId !== undefined && selectedItem) {
        const selectedIndex = filteredItems.findIndex(
          (item) => item.id === selectedId,
        );
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
            const selectedIndex = filteredItems.findIndex(
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
                filteredItems.length * itemHeight - containerHeight,
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

    if (open) {
      ref.focus();

      // Store the current value before clearing.
      if (clearFilterOnOpen && value && selectedItem && !valueBeforeOpen) {
        valueBeforeOpen = value;
        value = "";
      }
    } else {
      // Reset scroll position when menu closes
      if (shouldVirtualize) {
        listScrollTop = 0;
      }
      highlightedIndex = -1;
      prevHighlightedIndex = -1;
      if (selectedItem) {
        // Restore the value if clearFilterOnOpen was used and no new selection was made.
        // This must happen regardless of focus state to handle cases like closing via chevron.
        if (clearFilterOnOpen && valueBeforeOpen) {
          value = valueBeforeOpen;
          valueBeforeOpen = "";
        } else if (!ref.contains(document.activeElement)) {
          // Only set value programmatically if the input is not focused
          value = itemToString(selectedItem);
        }
      } else {
        selectedId = undefined;
        // Only reset value if the input is not focused and allowCustomValue is false
        if (!ref.contains(document.activeElement) && !allowCustomValue) {
          value = "";
        }
        highlightedIndex = -1;
        highlightedId = undefined;
      }
    }
  });

  $: if (selectedId !== undefined) {
    if (prevSelectedId !== selectedId) {
      // Only dispatch select event if not initial render (prevSelectedId was not null)
      const isInitialRender = prevSelectedId === null;
      prevSelectedId = selectedId;
      if (filteredItems?.length === 1 && open) {
        selectedId = filteredItems[0].id;
        selectedItem = filteredItems[0];
        highlightedIndex = -1;
        highlightedId = undefined;
      } else {
        selectedItem = items.find((item) => item.id === selectedId);
      }
      if (!isInitialRender) {
        dispatch("select", { selectedId, selectedItem });
      }
    }
  } else {
    prevSelectedId = selectedId;
    selectedItem = undefined;
  }

  $: ariaLabel = $$props["aria-label"] ?? "Choose an item";
  $: menuId = `menu-${id}`;
  $: comboId = `combo-${id}`;
  $: highlightedId = items[highlightedIndex] ? items[highlightedIndex].id : 0;
  $: filteredItems = open ? items.filter((item) => filterFn(item, value)) : [];

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
        items: filteredItems,
        scrollTop: listScrollTop,
        ...virtualConfig,
      })
    : null;

  $: itemsToRender = virtualData?.isVirtualized
    ? virtualData.visibleItems
    : filteredItems;

  $: if (typeahead) {
    const showNewSuggestion =
      value.length > prevInputLength && filteredItems.length > 0;

    prevInputLength = value.length;

    if (ref && showNewSuggestion) {
      const suggestion = itemToString(filteredItems[0]).slice(value.length);
      const selectionStart = value.length;
      const selectionEnd = selectionStart + suggestion.length;

      tick().then(() => {
        ref.value = value + suggestion;
        ref.setSelectionRange(selectionStart, selectionEnd);
      });
    }
  }
</script>

<svelte:window
  on:click={({ target }) => {
    if (open && ref && !ref.contains(target)) {
      open = false;
    }
  }}
/>

<div class:bx--list-box__wrapper={true}>
  {#if labelText || $$slots.labelChildren}
    <label
      for={id}
      class:bx--label={true}
      class:bx--label--disabled={disabled}
      class:bx--visually-hidden={hideLabel}
    >
      <slot name="labelChildren">
        {labelText}
      </slot>
    </label>
  {/if}
  <ListBox
    class="bx--combo-box {direction === 'top' &&
      'bx--list-box--up'} {!invalid && warn && 'bx--combo-box--warning'}"
    id={comboId}
    aria-label={ariaLabel}
    {disabled}
    {invalid}
    {invalidText}
    {open}
    {light}
    {size}
    {warn}
    {warnText}
  >
    <div class:bx--list-box__field={true}>
      <input
        bind:this={ref}
        bind:value
        type="text"
        role="combobox"
        tabindex="0"
        autocomplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-activedescendant={highlightedId}
        aria-labelledby={comboId}
        aria-disabled={disabled}
        aria-controls={open ? menuId : undefined}
        aria-owns={open ? menuId : undefined}
        {disabled}
        {placeholder}
        {id}
        {name}
        {...$$restProps}
        class:bx--text-input={true}
        class:bx--text-input--light={light}
        class:bx--text-input--empty={value === ""}
        on:click={() => {
          if (disabled) return;
          open = true;
        }}
        on:input
        on:input={({ target }) => {
          if (!open && target.value.length > 0) {
            open = true;
          }

          if (!value.length) {
            clear();
            open = true;
          }
        }}
        on:keydown
        on:keydown|stopPropagation={(e) => {
          const { key } = e;
          if (["Enter", "ArrowDown", "ArrowUp"].includes(key)) {
            e.preventDefault();
          }
          if (key === "Enter") {
            open = !open;
            if (
              highlightedIndex > -1 &&
              filteredItems[highlightedIndex]?.id !== selectedId
            ) {
              open = false;
              valueBeforeOpen = "";
              if (filteredItems[highlightedIndex]) {
                value = itemToString(filteredItems[highlightedIndex]);
                selectedItem = filteredItems[highlightedIndex];
                selectedId = filteredItems[highlightedIndex].id;
              }
            } else {
              // searching typed value in text list with lowercase
              const matchedItem =
                filteredItems.find(
                  (e) =>
                    e.text.toLowerCase() === value?.toLowerCase() &&
                    !e.disabled,
                ) ?? filteredItems.find((e) => !e.disabled);
              if (matchedItem) {
                // typed value has matched or fallback to first enabled item
                open = false;
                valueBeforeOpen = "";
                selectedItem = matchedItem;
                value = itemToString(selectedItem);
                selectedId = selectedItem.id;
              }
            }
            highlightedIndex = -1;
          } else if (key === "Tab") {
            open = false;
          } else if (key === "ArrowDown") {
            change(1);
          } else if (key === "ArrowUp") {
            change(-1);
          } else if (key === "Escape") {
            clear();
          }
        }}
        on:keyup
        on:focus
        on:blur
        on:blur={({ relatedTarget }) => {
          if (!open || !relatedTarget) return;
          if (
            relatedTarget &&
            !["INPUT", "SELECT", "TEXTAREA"].includes(relatedTarget.tagName) &&
            relatedTarget.getAttribute("role") !== "button" &&
            relatedTarget.getAttribute("role") !== "searchbox"
          ) {
            ref.focus();
          }
        }}
        on:paste
      />
      {#if invalid}
        <WarningFilled class="bx--list-box__invalid-icon" />
      {/if}
      {#if !invalid && warn}
        <WarningAltFilled
          class="bx--list-box__invalid-icon bx--list-box__invalid-icon--warning"
        />
      {/if}
      {#if value}
        <ListBoxSelection
          on:clear
          on:clear={clear}
          translateWithId={translateWithIdSelection}
          {disabled}
          {open}
        />
      {/if}
      <ListBoxMenuIcon
        on:click={(e) => {
          if (disabled) return;
          e.stopPropagation();
          open = !open;
        }}
        {translateWithId}
        {open}
      />
    </div>
    {#if open}
      <ListBoxMenu
        aria-label={ariaLabel}
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
                    open = false;
                    valueBeforeOpen = "";

                    if (filteredItems[actualIndex]) {
                      value = itemToString(filteredItems[actualIndex]);
                    }
                  }}
                  on:mouseenter={() => {
                    if (item.disabled) return;
                    highlightedIndex = actualIndex;
                  }}
                >
                  <slot {item} index={actualIndex}>
                    {itemToString(item)}
                  </slot>
                  {#if selectedItem && selectedItem.id === item.id}
                    <Checkmark class="bx--list-box__menu-item__selected-icon" />
                  {/if}
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
                open = false;
                valueBeforeOpen = "";

                if (filteredItems[i]) {
                  value = itemToString(filteredItems[i]);
                }
              }}
              on:mouseenter={() => {
                if (item.disabled) return;
                highlightedIndex = i;
              }}
            >
              <slot {item} index={i}>
                {itemToString(item)}
              </slot>
              {#if selectedItem && selectedItem.id === item.id}
                <Checkmark class="bx--list-box__menu-item__selected-icon" />
              {/if}
            </ListBoxMenuItem>
          {/each}
        {/if}
      </ListBoxMenu>
    {/if}
  </ListBox>
  {#if !invalid && helperText && !warn}
    <div
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
</div>
