<script>
  /**
   * @generics {Item extends ComboBoxItem = ComboBoxItem} Item
   * @template {ComboBoxItem} Item
   * @typedef {any} ComboBoxItemId
   * @typedef {object} ComboBoxItem
   * @property {ComboBoxItemId} id
   * @property {string} text
   * @property {boolean} [disabled] - Whether the item is disabled
   * @event select
   * @type {object}
   * @property {ComboBoxItemId} selectedId
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
  export let itemToString = (item) => item.text || item.id;

  /**
   * Set the selected item by value id.
   * @type {ComboBoxItemId}
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
  export let id = "ccs-" + Math.random().toString(36);

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

  import { afterUpdate, createEventDispatcher, tick } from "svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import ListBox from "../ListBox/ListBox.svelte";
  import ListBoxMenu from "../ListBox/ListBoxMenu.svelte";
  import ListBoxMenuIcon from "../ListBox/ListBoxMenuIcon.svelte";
  import ListBoxMenuItem from "../ListBox/ListBoxMenuItem.svelte";
  import ListBoxSelection from "../ListBox/ListBoxSelection.svelte";

  const dispatch = createEventDispatcher();

  let selectedItem = undefined;
  let prevSelectedId = null;
  let highlightedIndex = -1;
  let valueBeforeOpen = "";
  let prevInputLength = 0;

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
   * Clear the combo box programmatically
   * @type {(options?: { focus?: boolean; }) => Promise<void>}
   * @param {object} [options] - Configuration options for clearing
   * @param {boolean} [options.focus=true] - Whether to focus the combo box after clearing
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
    if (open) {
      ref.focus();

      // Store the current value before clearing.
      if (clearFilterOnOpen && value && selectedItem) {
        valueBeforeOpen = value;
        value = "";
      }

      filteredItems = items.filter((item) => filterFn(item, value));
    } else {
      highlightedIndex = -1;
      filteredItems = [];
      if (selectedItem) {
        // Only set value if the input is not focused
        if (!ref.contains(document.activeElement)) {
          // Restore the value if clearFilterOnOpen was used and no new selection was made
          if (clearFilterOnOpen && valueBeforeOpen && value === "") {
            value = valueBeforeOpen;
          } else {
            // programmatically set value
            value = itemToString(selectedItem);
          }
          valueBeforeOpen = "";
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
      prevSelectedId = selectedId;
      if (filteredItems?.length === 1 && open) {
        selectedId = filteredItems[0].id;
        selectedItem = filteredItems[0];
        highlightedIndex = -1;
        highlightedId = undefined;
      } else {
        selectedItem = items.find((item) => item.id === selectedId);
      }
      dispatch("select", { selectedId, selectedItem });
    }
  } else {
    prevSelectedId = selectedId;
    selectedItem = undefined;
  }

  $: ariaLabel = $$props["aria-label"] || "Choose an item";
  $: menuId = `menu-${id}`;
  $: comboId = `combo-${id}`;
  $: highlightedId = items[highlightedIndex] ? items[highlightedIndex].id : 0;
  $: filteredItems = items.filter((item) => filterFn(item, value));

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
      <ListBoxMenu aria-label={ariaLabel} {id} on:scroll bind:ref={listRef}>
        {#each filteredItems as item, i (item.id)}
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
