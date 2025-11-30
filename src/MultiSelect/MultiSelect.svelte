<script>
  /**
   * @generics {Item extends MultiSelectItem = MultiSelectItem} Item
   * @template {MultiSelectItem} Item
   * @typedef {any} MultiSelectItemId
   * @typedef {string} MultiSelectItemText
   * @typedef {object} MultiSelectItem
   * @property {MultiSelectItemId} id
   * @property {MultiSelectItemText} text
   * @property {boolean} [disabled] - Whether the item is disabled
   * @event select
   * @type {object}
   * @property {MultiSelectItemId[]} selectedIds
   * @property {Item[]} selected
   * @property {Item[]} unselected
   * @event {null} clear
   * @event {FocusEvent | CustomEvent<FocusEvent>} blur
   * @slot {{ item: Item; index: number }}
   */

  /**
   * Set the multiselect items.
   * @type {ReadonlyArray<Item>}
   */
  export let items = [];

  /**
   * Override the display of a multiselect item.
   * @type {(item: Item) => any}
   */
  export let itemToString = (item) => item.text || item.id;

  /**
   * Override the item name, title, labelText, or value passed to the user-selectable checkbox input as well as the hidden inputs.
   * @type {(item: Item) => { name?: string; labelText?: any; title?: string; value?: string }}
   */
  export let itemToInput = (_item) => {};

  /**
   * Set the selected ids.
   * @type {ReadonlyArray<MultiSelectItemId>}
   */
  export let selectedIds = [];

  /** Specify the multiselect value */
  export let value = "";

  /**
   * Set the size of the combobox.
   * @type {"sm" | "lg" | "xl"}
   */
  export let size = undefined;

  /**
   * Specify the type of multiselect.
   * @type {"default" | "inline"}
   */
  export let type = "default";

  /**
   * Specify the direction of the multiselect dropdown menu.
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /**
   * Specify the selection feedback after selecting items.
   * @type {"top" | "fixed" | "top-after-reopen"}
   */
  export let selectionFeedback = "top-after-reopen";

  /** Set to `true` to disable the dropdown */
  export let disabled = false;

  /** Set to `true` to filter items */
  export let filterable = false;

  /**
   * Override the filtering logic.
   * The default filtering is an exact string comparison.
   * @type {(item: Item, value: string) => boolean}
   */
  export let filterItem = (item, value) =>
    item.text.toLowerCase().includes(value.trim().toLowerCase());

  /** Set to `true` to open the dropdown */
  export let open = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Specify the locale */
  export let locale = "en";

  /** Specify the placeholder text */
  export let placeholder = "";

  /**
   * Override the sorting logic.
   * The default sorting compare the item text value.
   * @type {((a: Item, b: Item) => Item) | (() => void)}
   */
  export let sortItem = (a, b) =>
    a.text.localeCompare(b.text, locale, { numeric: true });

  /**
   * Override the chevron icon label based on the open state.
   * Defaults to "Open menu" when closed and "Close menu" when open.
   * @type {(id: import("../ListBox/ListBoxMenuIcon.svelte").ListBoxMenuIconTranslationId) => string}
   */
  export let translateWithId = undefined;

  /**
   * Override the label of the clear button when the input has a selection.
   * Defaults to "Clear selected item" and "Clear all items" if more than one item is selected.
   * @type {(id: import("../ListBox/ListBoxSelection.svelte").ListBoxSelectionTranslationId) => string}
   */
  export let translateWithIdSelection = undefined;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to pass the item to `itemToString` in the checkbox */
  export let useTitleInItem = false;

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

  /** Specify the list box label */
  export let label = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set an id for the list box component */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the select.
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the input HTML element */
  export let inputRef = null;

  /** Obtain a reference to the outer div element */
  export let multiSelectRef = null;

  /**
   * Obtain a reference to the field box element.
   * @type {null | HTMLDivElement}
   */
  export let fieldRef = null;

  /**
   * Obtain a reference to the selection element.
   * @type {null | HTMLDivElement}
   */
  export let selectionRef = null;

  /**
   * Id of the highlighted ListBoxMenuItem.
   * @type {null | MultiSelectItemId}
   */
  export let highlightedId = null;

  import { afterUpdate, createEventDispatcher, setContext } from "svelte";
  import Checkbox from "../Checkbox/Checkbox.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import {
    ListBox,
    ListBoxField,
    ListBoxMenu,
    ListBoxMenuIcon,
    ListBoxMenuItem,
    ListBoxSelection,
  } from "../ListBox";

  const dispatch = createEventDispatcher();

  let highlightedIndex = -1;
  let prevChecked = [];

  /**
   * @type {(data: { key: "field" | "selection"; ref: HTMLDivElement }) => void}
   */
  const declareRef = ({ key, ref }) => {
    switch (key) {
      case "field":
        fieldRef = ref;
        break;
      case "selection":
        selectionRef = ref;
        break;
    }
  };

  setContext("MultiSelect", {
    declareRef,
  });

  function change(direction) {
    let index = highlightedIndex + direction;
    const itemsToUse = filterable ? filteredItems : sortedItems;
    const length = itemsToUse.length;
    if (length === 0) return;
    if (index < 0) {
      index = length - 1;
    } else if (index >= length) {
      index = 0;
    }

    let disabled = itemsToUse[index].disabled;

    while (disabled) {
      index = index + direction;

      if (index < 0) {
        index = length - 1;
      } else if (index >= length) {
        index = 0;
      }

      disabled = itemsToUse[index].disabled;
    }

    highlightedIndex = index;
  }

  afterUpdate(() => {
    if (checked.length !== prevChecked.length) {
      prevChecked = checked;
      selectedIds = checked.map(({ id }) => id);
      dispatch("select", {
        selectedIds,
        selected: checked,
        unselected: unchecked,
      });
    }

    if (!open) {
      highlightedIndex = -1;
      value = "";
    }
  });

  function sort() {
    if (
      selectionFeedback === "top" ||
      selectionFeedback === "top-after-reopen"
    ) {
      const checkedItems = items
        .filter((item) => selectedIds.includes(item.id))
        .map((item) => ({ ...item, checked: true }));
      const uncheckedItems = items
        .filter((item) => !selectedIds.includes(item.id))
        .map((item) => ({ ...item, checked: false }));

      return [
        ...(checkedItems.length > 1
          ? checkedItems.sort(sortItem)
          : checkedItems),
        ...uncheckedItems.sort(sortItem),
      ];
    }

    return items
      .map((item) => ({
        ...item,
        checked: selectedIds.includes(item.id),
      }))
      .sort(sortItem);
  }

  let sortedItems = sort();

  $: menuId = `menu-${id}`;
  $: comboId = `combo-${id}`;
  $: inline = type === "inline";
  $: ariaLabel = $$props["aria-label"] || "Choose an item";
  $: if (
    selectedIds &&
    (selectionFeedback === "top" ||
      (selectionFeedback === "top-after-reopen" && open === false))
  ) {
    sortedItems = sort();
  }
  $: checked = sortedItems.filter(({ checked }) => checked);
  $: unchecked = sortedItems.filter(({ checked }) => !checked);
  $: filteredItems = sortedItems.filter((item) => filterItem(item, value));
  $: highlightedId =
    highlightedIndex > -1
      ? ((filterable ? filteredItems : sortedItems)[highlightedIndex]?.id ??
        null)
      : null;
</script>

<svelte:window
  on:click={({ target }) => {
    if (open && multiSelectRef && !multiSelectRef.contains(target)) {
      open = false;
    }
  }}
/>

<div
  bind:this={multiSelectRef}
  class:bx--multi-select__wrapper={true}
  class:bx--list-box__wrapper={true}
  class:bx--multi-select__wrapper--inline={inline}
  class:bx--list-box__wrapper--inline={inline}
  class:bx--multi-select__wrapper--inline--invalid={inline && invalid}
>
  {#if labelText || $$slots.labelText}
    <label
      for={id}
      class:bx--label={true}
      class:bx--label--disabled={disabled}
      class:bx--visually-hidden={hideLabel}
    >
      <slot name="labelText">
        {labelText}
      </slot>
    </label>
  {/if}
  <ListBox
    role={undefined}
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
    class="bx--multi-select {direction === 'top' &&
      'bx--list-box--up'} {filterable && 'bx--combo-box'}
      {filterable && 'bx--multi-select--filterable'}
      {invalid && 'bx--multi-select--invalid'}
      {inline && 'bx--multi-select--inline'}
      {checked.length > 0 && 'bx--multi-select--selected'}"
  >
    {#if invalid}
      <WarningFilled class="bx--list-box__invalid-icon" />
    {/if}
    {#if !invalid && warn}
      <WarningAltFilled
        class="bx--list-box__invalid-icon bx--list-box__invalid-icon--warning"
      />
    {/if}
    {#if filterable}
      <div class:bx--list-box__field={true}>
        {#if checked.length > 0}
          <ListBoxSelection
            selectionCount={checked.length}
            on:clear
            on:clear={() => {
              selectedIds = [];
              sortedItems = sortedItems.map((item) => ({
                ...item,
                checked: false,
              }));
            }}
            translateWithId={translateWithIdSelection}
            {disabled}
          />
        {/if}
        <input
          bind:this={inputRef}
          bind:value
          {...$$restProps}
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
          class:bx--text-input={true}
          class:bx--text-input--empty={value === ""}
          class:bx--text-input--light={light}
          on:click={() => {
            if (disabled) return;
            open = true;
          }}
          on:keydown
          on:keydown|stopPropagation={({ key }) => {
            if (key === "Enter") {
              if (highlightedId) {
                const filteredItemIndex = sortedItems.findIndex(
                  (item) => item.id === highlightedId,
                );
                sortedItems = sortedItems.map((item, i) => {
                  if (i !== filteredItemIndex) return item;
                  return { ...item, checked: !item.checked };
                });
              }
            } else if (key === "Tab") {
              open = false;
            } else if (key === "ArrowDown") {
              if (!open) open = true;
              change(1);
            } else if (key === "ArrowUp") {
              if (!open) open = true;
              change(-1);
            } else if (key === "Escape") {
              open = false;
            } else if (key === " ") {
              if (!open) open = true;
            }
          }}
          on:input
          on:input={() => {
            if (!open) open = true;
          }}
          on:keyup
          on:focus
          on:focus={() => {
            if (disabled) return;
            open = true;
          }}
          on:blur
          on:paste
          {disabled}
          {placeholder}
          {id}
          {name}
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
            on:clear={() => {
              value = "";
              open = false;
            }}
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
    {:else}
      <ListBoxField
        role="combobox"
        tabindex="0"
        aria-expanded={open}
        aria-activedescendant={highlightedId}
        aria-controls={open ? menuId : undefined}
        aria-owns={open ? menuId : undefined}
        on:click={() => {
          if (disabled) return;
          open = !open;
        }}
        on:keydown={(e) => {
          const key = e.key;
          if ([" ", "ArrowUp", "ArrowDown"].includes(key)) {
            e.preventDefault();
          }
          if (key === " ") {
            open = !open;
          } else if (key === "Tab") {
            open = false;
          } else if (key === "ArrowDown") {
            if (!open) open = true;
            change(1);
          } else if (key === "ArrowUp") {
            if (!open) open = true;
            change(-1);
          } else if (key === "Enter") {
            if (highlightedIndex > -1) {
              sortedItems = sortedItems.map((item, i) => {
                if (i !== highlightedIndex) return item;
                return { ...item, checked: !item.checked };
              });
            }
          } else if (key === "Escape") {
            open = false;
          }
        }}
        on:blur={(e) => {
          dispatch("blur", e);
        }}
        {id}
        {disabled}
        {translateWithId}
      >
        {#if checked.length > 0}
          <ListBoxSelection
            selectionCount={checked.length}
            on:clear
            on:clear={() => {
              selectedIds = [];
              sortedItems = sortedItems.map((item) => ({
                ...item,
                checked: false,
              }));
            }}
            translateWithId={translateWithIdSelection}
            {disabled}
          />
        {/if}
        <span class:bx--list-box__label={true}>{label}</span>
        <ListBoxMenuIcon {open} {translateWithId} />
      </ListBoxField>
    {/if}
    <div style:display={open ? "block" : "none"}>
      <ListBoxMenu aria-label={ariaLabel} {id} aria-multiselectable="true">
        {#each filterable ? filteredItems : sortedItems as item, i (item.id)}
          <ListBoxMenuItem
            id={item.id}
            role="option"
            aria-labelledby="checkbox-{item.id}"
            aria-selected={item.checked}
            active={item.checked}
            highlighted={highlightedIndex === i}
            disabled={item.disabled}
            on:click={(e) => {
              if (item.disabled) {
                e.stopPropagation();
                return;
              }
              sortedItems = sortedItems.map((_) =>
                _.id === item.id ? { ..._, checked: !_.checked } : _,
              );
              if (filterable) {
                inputRef?.focus();
              } else {
                fieldRef?.focus();
              }
            }}
            on:mouseenter={() => {
              if (item.disabled) return;
              highlightedIndex = i;
            }}
          >
            <Checkbox
              name={item.id}
              title={useTitleInItem ? itemToString(item) : undefined}
              {...itemToInput(item)}
              tabindex="-1"
              id="checkbox-{item.id}"
              checked={item.checked}
              disabled={item.disabled}
              on:blur={() => {
                if (i === filteredItems.length - 1) open = false;
              }}
            >
              <slot slot="labelText" {item} index={i}>
                {itemToString(item)}
              </slot>
            </Checkbox>
          </ListBoxMenuItem>
        {/each}
      </ListBoxMenu>
    </div>
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
