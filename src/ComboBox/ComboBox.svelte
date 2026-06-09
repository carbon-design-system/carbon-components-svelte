<script>
  /**
   * @template {ComboBoxItem<any>} [Item=ComboBoxItem<any>]
   */

  /**
   * @typedef {object} ComboBoxItem<Id=any>
   * @property {Id} id
   * @property {string} text
   * @property {boolean} [disabled] - Whether the item is disabled
   * @property {any} [icon] - Icon component shown left of the item text
   * @event select
   * @type {object}
   * @property {Item["id"]} selectedId
   * @property {Item} selectedItem
   * @event {KeyboardEvent | MouseEvent} clear
   * @slot {{ item: Item; index: number; selected: boolean; highlighted: boolean; }}
   * @slot {{ item: Item; index: number; selected: boolean; highlighted: boolean; }} icon
   * @slot {{ item: Item; index: number; selected: boolean; highlighted: boolean; }} iconRight
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
   * @bindable writable
   */
  export let selectedId = undefined;

  /**
   * Specify the selected combobox value.
   * @bindable writable
   */
  export let value = "";

  /**
   * Specify the direction of the combobox dropdown menu.
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /**
   * Set the size of the combobox.
   * @type {"sm" | "lg" | "xl"}
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

  /**
   * Set to `true` to open the combobox menu dropdown.
   * @bindable writable
   */
  export let open = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

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

  /**
   * Set to `true` to select all text in the input when it receives focus (e.g. on tab or click).
   */
  export let selectTextOnFocus = false;

  /**
   * Set to `true` to reopen the dropdown menu after clearing the selection.
   * This allows users to immediately see all available items after clearing.
   */
  export let openOnClear = false;

  /** Set to `true` to enable autocomplete with typeahead */
  export let typeahead = false;

  /**
   * Control whether the first matching item is automatically highlighted as the user types.
   * - `"none"`: No auto-highlighting (default). The user must use arrow keys or hover to highlight items.
   * - `"first-match"`: Automatically highlight the first non-disabled filtered item on each input change.
   * @type {"none" | "first-match"}
   */
  export let autoHighlight = "none";

  /**
   * Determine if an item should be filtered given the current combobox value.
   * When `typeahead` is enabled and no custom function is provided,
   * the default case-insensitive prefix matching is used.
   * When a custom function is provided, it is used even with `typeahead`.
   * @default () => true
   * @type {(item: Item, value: string) => boolean}
   */
  function defaultShouldFilter() {
    return true;
  }

  export let shouldFilterItem = defaultShouldFilter;

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

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Obtain a reference to the list HTML element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
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
   * - `itemHeight` (default: 40 for md, adjusted for size): Height of each item in pixels. Override when custom slots change row height.
   * - `containerHeight` (default: 300): The maximum height in pixels of the dropdown container.
   * - `overscan` (default: 3): The number of extra items to render above and below the viewport for smoother scrolling. Higher values may cause more flickering during very fast scrolling.
   * - `threshold` (default: 100): The minimum number of items required before virtualization activates. Lists with fewer items will render all items normally without virtualization.
   * - `maxItems` (default: undefined): The maximum number of items to render. When undefined, all visible items are rendered.
   * @type {undefined | boolean | { itemHeight?: number, containerHeight?: number, overscan?: number, threshold?: number, maxItems?: number }}
   */
  export let virtualize = undefined;

  /**
   * Set to `true` to render the dropdown menu in a portal,
   * allowing it to escape containers with `overflow: hidden`.
   * When inside a Modal, defaults to `true` unless explicitly set to `false`.
   * @type {boolean | undefined}
   */
  export let portalMenu = undefined;

  import { afterUpdate, createEventDispatcher, getContext, tick } from "svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import ListBox from "../ListBox/ListBox.svelte";
  import ListBoxMenu from "../ListBox/ListBoxMenu.svelte";
  import ListBoxMenuIcon from "../ListBox/ListBoxMenuIcon.svelte";
  import ListBoxMenuItem from "../ListBox/ListBoxMenuItem.svelte";
  import ListBoxSelection from "../ListBox/ListBoxSelection.svelte";
  import {
    getMenuItemHeight,
    getMenuMaxHeight,
  } from "../ListBox/list-box-utils.js";
  import { isOutsideClick } from "../utils/isOutsideClick.js";
  import { nextEnabledIndex } from "../utils/moveIndex.js";
  import {
    resetVirtualScrollOnClose,
    scrollHighlightedIntoView,
    scrollSelectedIntoView,
    virtualListState,
  } from "../utils/virtualize.js";

  const dispatch = createEventDispatcher();
  const insideModal = getContext("carbon:Modal");

  $: effectivePortalMenu =
    portalMenu === undefined ? !!insideModal : portalMenu;

  let skipWindowClick = false;
  let selectedItem = undefined;
  let prevSelectedId = null;
  let highlightedIndex = -1;
  let prevHighlightedIndex = -1;
  let valueBeforeOpen = "";
  let prevInputLength = 0;
  let listScrollTop = 0;
  let prevOpen = false;

  /** @type {null | HTMLDivElement} */
  let fieldRef = null;

  /**
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

  $: filterFn = typeahead
    ? shouldFilterItem === defaultShouldFilter
      ? autocompleteCustomFilter
      : shouldFilterItem
    : shouldFilterItem;

  function change(step) {
    const navigableItems = filteredItems?.length ? filteredItems : items;
    highlightedIndex = nextEnabledIndex({
      items: navigableItems,
      index: highlightedIndex,
      step,
    });
  }

  /**
   * Clear the combo box programmatically.
   * By default, focuses the combo box after clearing. Set `options.focus` to `false` to prevent focusing.
   * Set `options.open` to `true` to keep the dropdown open after clearing.
   * @type {(options?: { focus?: boolean; open?: boolean; }) => Promise<void>}
   * @example
   * ```svelte
   * <ComboBox bind:this={comboBox} items={items} />
   * <button on:click={() => comboBox.clear()}>Clear</button>
   * <button on:click={() => comboBox.clear({ focus: false })}>Clear (No Focus)</button>
   * ```
   */
  export async function clear(options = {}) {
    if (readonly) return;
    prevSelectedId = null;
    highlightedIndex = -1;
    selectedId = undefined;
    selectedItem = undefined;
    open = false;
    value = "";
    if (options?.open === true) skipWindowClick = true;
    // Ensure binding updates are complete before focusing.
    await tick();
    if (options?.open === true) open = true;
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
          const nextScrollTop = scrollHighlightedIntoView({
            highlightedIndex,
            currentScrollTop: listRef.scrollTop ?? listScrollTop,
            itemCount: filteredItems.length,
            itemHeight: virtualConfig.itemHeight,
            containerHeight: virtualConfig.containerHeight,
            overscan: virtualConfig.overscan ?? 3,
            maxItems: virtualConfig.maxItems,
          });
          if (nextScrollTop !== null) {
            listScrollTop = nextScrollTop;
            listRef.scrollTop = nextScrollTop;
          }
        }
      });
      prevHighlightedIndex = highlightedIndex;
    }

    // Set highlighted index to selected item when menu opens
    if (wasJustOpened && selectedId !== undefined && selectedItem) {
      const selectedIndex = filteredItems.findIndex(
        (item) => item.id === selectedId,
      );
      if (selectedIndex >= 0) {
        // Set highlighted index to selected item so keyboard nav starts there
        highlightedIndex = selectedIndex;
        prevHighlightedIndex = selectedIndex;
      }
    }

    // Scroll to selected item when menu opens with virtualization
    if (wasJustOpened && shouldVirtualize && listRef) {
      tick().then(() => {
        if (listRef && virtualConfig) {
          const selectedIndex =
            selectedId !== undefined && selectedItem
              ? filteredItems.findIndex((item) => item.id === selectedId)
              : -1;
          const nextScrollTop = scrollSelectedIntoView({
            selectedIndex,
            itemCount: filteredItems.length,
            itemHeight: virtualConfig.itemHeight,
            containerHeight: virtualConfig.containerHeight,
          });
          listScrollTop = nextScrollTop;
          listRef.scrollTop = nextScrollTop;
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
        listScrollTop = resetVirtualScrollOnClose();
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
      }
    }
  });

  $: if (selectedId === undefined) {
    prevSelectedId = selectedId;
    selectedItem = undefined;
  } else {
    if (prevSelectedId !== selectedId) {
      // Only dispatch select event if not initial render (prevSelectedId was not null)
      const isInitialRender = prevSelectedId === null;
      prevSelectedId = selectedId;
      selectedItem = itemsById.get(selectedId);
      if (!isInitialRender) {
        dispatch("select", { selectedId, selectedItem });
      }
    }
  }

  $: itemsById = new Map(items.map((item) => [item.id, item]));
  $: ariaLabel = $$props["aria-label"] ?? (labelText || "Choose an item");
  $: menuId = `menu-${id}`;
  $: comboId = `combo-${id}`;
  $: helperId = `helper-${id}`;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
  // Invalid/warn states are suppressed when the combo box is disabled or read-only.
  $: showInvalid = invalid && !disabled && !readonly;
  $: showWarn = warn && !invalid && !disabled && !readonly;
  $: filteredItems = open ? items.filter((item) => filterFn(item, value)) : [];
  $: highlightedId =
    filteredItems[highlightedIndex] == null
      ? undefined
      : `${id}-${filteredItems[highlightedIndex].id}`;

  $: shouldVirtualize =
    virtualize === false
      ? false
      : virtualize !== undefined || items.length > 100;

  $: menuMaxHeight = getMenuMaxHeight(size);

  $: virtualState = virtualListState({
    items: filteredItems,
    scrollTop: listScrollTop,
    shouldVirtualize,
    virtualize,
    defaults: { itemHeight: getMenuItemHeight(size) },
  });
  $: virtualConfig = virtualState.config;
  $: virtualData = virtualState.data;
  $: itemsToRender = virtualState.itemsToRender;

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

  $: if (
    autoHighlight === "first-match" &&
    open &&
    value.length > 0 &&
    filteredItems.length > 0
  ) {
    const lowerValue = value.toLowerCase();
    const firstEnabledIndex = filteredItems.findIndex(
      (item) =>
        !item.disabled &&
        (filterFn !== defaultShouldFilter ||
          itemToString(item).toLowerCase().includes(lowerValue)),
    );
    highlightedIndex = firstEnabledIndex >= 0 ? firstEnabledIndex : -1;
  } else if (
    autoHighlight === "first-match" &&
    open &&
    (value.length === 0 || filteredItems.length === 0)
  ) {
    highlightedIndex = -1;
  }

  $: comboBoxListBoxClass = [
    "bx--combo-box",
    direction === "top" && "bx--list-box--up",
    showWarn && "bx--combo-box--warning",
    readonly && "bx--combo-box--readonly",
  ]
    .filter(Boolean)
    .join(" ");
</script>

<svelte:window
  on:click={(event) => {
    if (skipWindowClick) {
      skipWindowClick = false;
      return;
    }
    if (open && isOutsideClick(event, [ref, effectivePortalMenu && listRef])) {
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
      <slot name="labelChildren"> {labelText} </slot>
    </label>
  {/if}
  <ListBox
    class={comboBoxListBoxClass}
    id={comboId}
    aria-label={ariaLabel}
    aria-disabled={readonly || undefined}
    {disabled}
    invalid={showInvalid}
    {open}
    {light}
    {size}
    warn={showWarn}
  >
    <div bind:this={fieldRef} class:bx--list-box__field={true}>
      <input
        bind:this={ref}
        bind:value
        type="text"
        role="combobox"
        tabindex="0"
        autocomplete="off"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-activedescendant={highlightedId ?? ""}
        aria-disabled={disabled || readonly}
        aria-readonly={readonly || undefined}
        aria-controls={open ? menuId : undefined}
        aria-owns={open ? menuId : undefined}
        aria-describedby={showInvalid && invalidText
          ? errorId
          : showWarn && warnText
            ? warnId
            : !showInvalid && !showWarn && helperText
              ? helperId
              : undefined}
        {disabled}
        {readonly}
        {placeholder}
        {id}
        {name}
        {...$$restProps}
        class:bx--text-input={true}
        class:bx--text-input--light={light}
        class:bx--text-input--empty={value === ""}
        on:click={() => {
          if (disabled || readonly) return;
          open = true;
        }}
        on:input
        on:input={(event) => {
          if (!open && event.target.value.length > 0) {
            open = true;
          }

          if (!value.length) {
            clear();
            open = true;
          }
        }}
        on:keydown
        on:keydown|stopPropagation={(event) => {
          if (readonly) return;
          if (
            event.key === "Enter" ||
            event.key === "ArrowDown" ||
            event.key === "ArrowUp"
          ) {
            event.preventDefault();
          }
          if (event.key === "Enter") {
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
              // Match typed value case-insensitively against item text
              const inputValue = ref?.value ?? value;
              const matchedItem = filteredItems.find(
                (item) =>
                  item.text.toLowerCase() === inputValue?.toLowerCase() &&
                  !item.disabled,
              );
              if (matchedItem) {
                open = false;
                valueBeforeOpen = "";
                selectedItem = matchedItem;
                value = itemToString(selectedItem);
                selectedId = selectedItem.id;
              }
            }
            highlightedIndex = -1;
          } else if (event.key === "Tab") {
            open = false;
          } else if (event.key === "ArrowDown") {
            change(1);
          } else if (event.key === "ArrowUp") {
            change(-1);
          } else if (event.key === "Escape") {
            clear();
          }
        }}
        on:keyup
        on:focus
        on:focus={() => {
          if (selectTextOnFocus && ref) {
            tick().then(() => ref.select());
          }
        }}
        on:blur
        on:blur={(event) => {
          if (!open || !event.relatedTarget) return;
          if (
            fieldRef?.contains(event.relatedTarget) ||
            listRef?.contains(event.relatedTarget)
          ) {
            ref.focus();
          }
        }}
        on:paste
      >
      {#if showInvalid}
        <WarningFilled class="bx--list-box__invalid-icon" />
      {/if}
      {#if showWarn}
        <WarningAltFilled
          class="bx--list-box__invalid-icon bx--list-box__invalid-icon--warning"
        />
      {/if}
      {#if value}
        <ListBoxSelection
          on:clear
          on:clear={() => clear({ open: openOnClear })}
          translateWithId={translateWithIdSelection}
          {disabled}
          {readonly}
          {open}
        />
      {/if}
      <ListBoxMenuIcon
        aria-hidden={readonly || undefined}
        on:click={(event) => {
          if (disabled || readonly) return;
          event.stopPropagation();
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
        portal={effectivePortalMenu}
        {open}
        anchor={fieldRef}
        {direction}
        on:scroll
        on:scroll={(event) => {
          listScrollTop = event.target.scrollTop;
        }}
        bind:ref={listRef}
        style={effectivePortalMenu
          ? `max-height: ${virtualConfig
              ? `${virtualConfig.containerHeight}px; overflow-y: auto`
              : menuMaxHeight};`
          : virtualConfig
            ? `max-height: ${virtualConfig.containerHeight}px; overflow-y: auto;`
            : undefined}
      >
        {#if virtualData?.isVirtualized}
          <div style="height: {virtualData.totalHeight}px; position: relative;">
            <div style="transform: translateY({virtualData.offsetY}px);">
              {#each itemsToRender as item, index (item.id)}
                {@const actualIndex = virtualData.startIndex + index}
                {@const selected = selectedItem?.id === item.id}
                {@const highlighted = highlightedIndex === actualIndex}
                <ListBoxMenuItem
                  id="{id}-{item.id}"
                  active={selectedId === item.id}
                  {highlighted}
                  disabled={item.disabled}
                  on:click={(event) => {
                    if (item.disabled) {
                      event.stopPropagation();
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
                  {#if $$slots.icon || item.icon}
                    <span
                      class:bx--list-box__menu-item__icon={true}
                      class:bx--list-box__menu-item__icon--left={true}
                    >
                      <slot
                        name="icon"
                        {item}
                        index={actualIndex}
                        {selected}
                        {highlighted}
                      >
                        <svelte:component this={item.icon} />
                      </slot>
                    </span>
                  {/if}
                  <slot {item} index={actualIndex} {selected} {highlighted}>
                    {itemToString(item)}
                  </slot>
                  {#if $$slots.iconRight}
                    <span
                      class:bx--list-box__menu-item__icon={true}
                      class:bx--list-box__menu-item__icon--right={true}
                    >
                      <slot
                        name="iconRight"
                        {item}
                        index={actualIndex}
                        {selected}
                        {highlighted}
                      />
                    </span>
                  {:else if selected}
                    <Checkmark class="bx--list-box__menu-item__selected-icon" />
                  {/if}
                </ListBoxMenuItem>
              {/each}
            </div>
          </div>
        {:else}
          {#each itemsToRender as item, index (item.id)}
            {@const selected = selectedItem?.id === item.id}
            {@const highlighted = highlightedIndex === index}
            <ListBoxMenuItem
              id="{id}-{item.id}"
              active={selectedId === item.id}
              {highlighted}
              disabled={item.disabled}
              on:click={(event) => {
                if (item.disabled) {
                  event.stopPropagation();
                  return;
                }
                selectedId = item.id;
                open = false;
                valueBeforeOpen = "";

                if (filteredItems[index]) {
                  value = itemToString(filteredItems[index]);
                }
              }}
              on:mouseenter={() => {
                if (item.disabled) return;
                highlightedIndex = index;
              }}
            >
              {#if $$slots.icon || item.icon}
                <span
                  class:bx--list-box__menu-item__icon={true}
                  class:bx--list-box__menu-item__icon--left={true}
                >
                  <slot name="icon" {item} {index} {selected} {highlighted}>
                    <svelte:component this={item.icon} />
                  </slot>
                </span>
              {/if}
              <slot {item} {index} {selected} {highlighted}>
                {itemToString(item)}
              </slot>
              {#if $$slots.iconRight}
                <span
                  class:bx--list-box__menu-item__icon={true}
                  class:bx--list-box__menu-item__icon--right={true}
                >
                  <slot
                    name="iconRight"
                    {item}
                    {index}
                    {selected}
                    {highlighted}
                  />
                </span>
              {:else if selected}
                <Checkmark class="bx--list-box__menu-item__selected-icon" />
              {/if}
            </ListBoxMenuItem>
          {/each}
        {/if}
      </ListBoxMenu>
    {/if}
  </ListBox>
  {#if showInvalid && invalidText}
    <div id={errorId} class:bx--form-requirement={true}>{invalidText}</div>
  {/if}
  {#if showWarn && warnText}
    <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
  {/if}
  {#if !showInvalid && !showWarn && helperText}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
</div>
