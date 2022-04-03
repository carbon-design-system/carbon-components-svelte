<script>
  /**
   * @typedef {any} MultiSelectItemId
   * @typedef {string} MultiSelectItemText
   * @typedef {{ id: MultiSelectItemId; text: MultiSelectItemText; }} MultiSelectItem
   * @event {{ selectedIds: MultiSelectItemId[]; selected: MultiSelectItem[]; unselected: MultiSelectItem[]; }} select
   * @event {null} clear
   * @event {FocusEvent | CustomEvent<FocusEvent>} blur
   * @slot {{ item: MultiSelectItem; index: number }}
   */

  /**
   * Set the multiselect items
   * @type {MultiSelectItem[]}
   */
  export let items = [];

  /**
   * Override the display of a multiselect item
   * @type {(item: MultiSelectItem) => any}
   */
  export let itemToString = (item) => item.text || item.id;

  /**
   * Override the item name, title, labelText passed to the checkbox input
   * @type {(item: MultiSelectItem) => { name?: string; labelText?: any; title?: string; }}
   */
  export let itemToInput = (item) => {};

  /**
   * Set the selected ids
   * @type {MultiSelectItemId[]}
   */
  export let selectedIds = [];

  /** Specify the multiselect value */
  export let value = "";

  /**
   * Set the size of the combobox
   * @type {"sm" | "lg" | "xl"}
   */
  export let size = undefined;

  /**
   * Specify the type of multiselect
   * @type {"default" | "inline"}
   */
  export let type = "default";

  /**
   * Specify the direction of the multiselect dropdown menu
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /**
   * Specify the selection feedback after selecting items
   * @type {"top" | "fixed" | "top-after-reopen"}
   */
  export let selectionFeedback = "top-after-reopen";

  /** Set to `true` to disable the dropdown */
  export let disabled = false;

  /** Set to `true` to filter items */
  export let filterable = false;

  /**
   * Override the filtering logic
   * The default filtering is an exact string comparison
   * @type {(item: MultiSelectItem, value: string) => string}
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
   * Override the sorting logic
   * The default sorting compare the item text value
   * @type {((a: MultiSelectItem, b: MultiSelectItem) => MultiSelectItem) | (() => void)}
   */
  export let sortItem = (a, b) =>
    a.text.localeCompare(b.text, locale, { numeric: true });

  /**
   * Override the default translation ids
   * @type {(id: any) => string}
   */
  export let translateWithId = undefined;

  /** Specify the title text */
  export let titleText = "";

  /** Set to `true` to pass the item to `itemToString` in the checkbox */
  export let useTitleInItem = false;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate an warning state */
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
   * Specify a name attribute for the select
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the input HTML element */
  export let inputRef = null;

  /** Obtain a reference to the outer div element */
  export let multiSelectRef = null;

  /**
   * Obtain a reference to the field box element
   * @type {null | HTMLDivElement}
   */
  export let fieldRef = null;

  /**
   * Obtain a reference to the selection element
   * @type {null | HTMLDivElement}
   */
  export let selectionRef = null;

  /**
   * Id of the highlighted ListBoxMenuItem
   * @type {null | MultiSelectItemId}
   */
  export let highlightedId = null;

  import { afterUpdate, createEventDispatcher, setContext } from "svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import Checkbox from "../Checkbox/Checkbox.svelte";
  import {
    ListBox,
    ListBoxField,
    ListBoxMenu,
    ListBoxMenuIcon,
    ListBoxMenuItem,
    ListBoxSelection,
  } from "../ListBox";

  const dispatch = createEventDispatcher();

  let inputValue = "";
  let initialSorted = false;
  let highlightedIndex = -1;
  let prevChecked = [];

  setContext("MultiSelect", {
    declareRef: ({ key, ref }) => {
      switch (key) {
        case "field":
          fieldRef = ref;
          break;
        case "selection":
          selectionRef = ref;
          break;
      }
    },
  });

  function change(direction) {
    let index = highlightedIndex + direction;
    const length = filterable ? filteredItems.length : items.length;
    if (index < 0) {
      index = length - 1;
    } else if (index >= length) {
      index = 0;
    }

    highlightedIndex = index;
  }

  function sort() {
    return [
      ...(checked.length > 1 ? checked.sort(sortItem) : checked),
      ...unchecked.sort(sortItem),
    ];
  }

  afterUpdate(() => {
    if (checked.length !== prevChecked.length) {
      if (selectionFeedback === "top") {
        sortedItems = sort();
      }
      prevChecked = checked;
      selectedIds = checked.map(({ id }) => id);
      dispatch("select", {
        selectedIds,
        selected: checked,
        unselected: unchecked,
      });
    }

    if (!open) {
      if (!initialSorted || selectionFeedback !== "fixed") {
        sortedItems = sort();
        initialSorted = true;
      }

      highlightedIndex = -1;
      inputValue = "";
    }

    items = sortedItems;
  });

  $: menuId = `menu-${id}`;
  $: inline = type === "inline";
  $: ariaLabel = $$props["aria-label"] || "Choose an item";
  $: sortedItems = items.map((item) => ({
    ...item,
    checked: selectedIds.includes(item.id),
  }));
  $: checked = sortedItems.filter(({ checked }) => checked);
  $: unchecked = sortedItems.filter(({ checked }) => !checked);
  $: filteredItems = sortedItems.filter((item) => filterItem(item, value));
  $: highlightedId =
    highlightedIndex > -1
      ? (filterable ? filteredItems : sortedItems)[highlightedIndex]?.id ?? null
      : null;
  $: value = inputValue;
</script>

<svelte:window
  on:click="{({ target }) => {
    if (open && multiSelectRef && !multiSelectRef.contains(target)) {
      open = false;
    }
  }}"
/>

<div
  bind:this="{multiSelectRef}"
  class:bx--multi-select__wrapper="{true}"
  class:bx--list-box__wrapper="{true}"
  class:bx--multi-select__wrapper--inline="{inline}"
  class:bx--list-box__wrapper--inline="{inline}"
  class:bx--multi-select__wrapper--inline--invalid="{inline && invalid}"
>
  {#if titleText}
    <label
      for="{id}"
      class:bx--label="{true}"
      class:bx--label--disabled="{disabled}"
      class:bx--visually-hidden="{hideLabel}"
    >
      {titleText}
    </label>
  {/if}
  <ListBox
    role="{undefined}"
    disabled="{disabled}"
    invalid="{invalid}"
    invalidText="{invalidText}"
    open="{open}"
    light="{light}"
    size="{size}"
    warn="{warn}"
    warnText="{warnText}"
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
    <ListBoxField
      role="button"
      tabindex="0"
      aria-expanded="{open}"
      on:click="{() => {
        if (disabled) return;
        if (filterable) {
          open = true;
          inputRef.focus();
        } else {
          open = !open;
        }
      }}"
      on:keydown="{(e) => {
        if (filterable) {
          return;
        }
        const key = e.key;
        if ([' ', 'ArrowUp', 'ArrowDown'].includes(key)) {
          e.preventDefault();
        }
        if (key === ' ') {
          open = !open;
        } else if (key === 'Tab') {
          if (selectionRef && checked.length > 0) {
            selectionRef.focus();
          } else {
            open = false;
            fieldRef.blur();
          }
        } else if (key === 'ArrowDown') {
          change(1);
        } else if (key === 'ArrowUp') {
          change(-1);
        } else if (key === 'Enter') {
          if (highlightedIndex > -1) {
            sortedItems = sortedItems.map((item, i) => {
              if (i !== highlightedIndex) return item;
              return { ...item, checked: !item.checked };
            });
          }
        }
      }}"
      on:focus="{() => {
        if (filterable) {
          open = true;
          if (inputRef) inputRef.focus();
        }
      }}"
      on:blur="{(e) => {
        if (!filterable) dispatch('blur', e);
      }}"
      id="{id}"
      disabled="{disabled}"
      translateWithId="{translateWithId}"
    >
      {#if checked.length > 0}
        <ListBoxSelection
          selectionCount="{checked.length}"
          on:clear
          on:clear="{() => {
            sortedItems = sortedItems.map((item) => ({
              ...item,
              checked: false,
            }));
            if (fieldRef) fieldRef.blur();
          }}"
          translateWithId="{translateWithId}"
          disabled="{disabled}"
        />
      {/if}
      {#if filterable}
        <input
          bind:this="{inputRef}"
          {...$$restProps}
          role="combobox"
          tabindex="0"
          autocomplete="off"
          aria-autocomplete="list"
          aria-expanded="{open}"
          aria-activedescendant="{highlightedId}"
          aria-disabled="{disabled}"
          aria-controls="{menuId}"
          class:bx--text-input="{true}"
          class:bx--text-input--empty="{inputValue === ''}"
          class:bx--text-input--light="{light}"
          on:input="{({ target }) => {
            inputValue = target.value;
          }}"
          on:keydown
          on:keydown|stopPropagation="{({ key }) => {
            if (key === 'Enter') {
              if (highlightedId) {
                const filteredItemIndex = sortedItems.findIndex(
                  (item) => item.id === highlightedId
                );
                sortedItems = sortedItems.map((item, i) => {
                  if (i !== filteredItemIndex) return item;
                  return { ...item, checked: !item.checked };
                });
              }
            } else if (key === 'Tab') {
              open = false;
              inputRef.blur();
            } else if (key === 'ArrowDown') {
              change(1);
            } else if (key === 'ArrowUp') {
              change(-1);
            } else if (key === 'Escape') {
              open = false;
            } else if (key === ' ') {
              if (!open) open = true;
            }
          }}"
          on:keyup
          on:focus
          on:blur
          disabled="{disabled}"
          placeholder="{placeholder}"
          id="{id}"
          name="{name}"
          value="{inputValue}"
        />
        {#if invalid}
          <WarningFilled class="bx--list-box__invalid-icon" />
        {/if}
        {#if inputValue}
          <ListBoxSelection
            on:clear="{() => {
              inputValue = '';
              open = false;
            }}"
            translateWithId="{translateWithId}"
            disabled="{disabled}"
            open="{open}"
          />
        {/if}
        <ListBoxMenuIcon
          style="pointer-events: {open ? 'auto' : 'none'}"
          on:click="{(e) => {
            e.stopPropagation();
            open = !open;
          }}"
          translateWithId="{translateWithId}"
          open="{open}"
        />
      {/if}
      {#if !filterable}
        <span class="bx--list-box__label">{label}</span>
        <ListBoxMenuIcon open="{open}" translateWithId="{translateWithId}" />
      {/if}
    </ListBoxField>
    {#if open}
      <ListBoxMenu
        aria-label="{ariaLabel}"
        id="{id}"
        aria-multiselectable="true"
      >
        {#each filterable ? filteredItems : sortedItems as item, i (item.id)}
          <ListBoxMenuItem
            id="{item.id}"
            role="option"
            aria-labelledby="checkbox-{item.id}"
            aria-selected="{item.checked}"
            active="{item.checked}"
            highlighted="{highlightedIndex === i}"
            on:click="{() => {
              sortedItems = sortedItems.map((_) =>
                _.id === item.id ? { ..._, checked: !_.checked } : _
              );
              fieldRef.focus();
            }}"
            on:mouseenter="{() => {
              highlightedIndex = i;
            }}"
          >
            <Checkbox
              name="{item.id}"
              title="{useTitleInItem ? itemToString(item) : undefined}"
              {...itemToInput(item)}
              readonly
              tabindex="-1"
              id="checkbox-{item.id}"
              checked="{item.checked}"
              disabled="{disabled}"
              on:blur="{() => {
                if (i === filteredItems.length - 1) open = false;
              }}"
            >
              <slot slot="labelText" item="{item}" index="{i}">
                {itemToString(item)}
              </slot>
            </Checkbox>
          </ListBoxMenuItem>
        {/each}
      </ListBoxMenu>
    {/if}
  </ListBox>
  {#if !inline && !invalid && !warn && helperText}
    <div
      class:bx--form__helper-text="{true}"
      class:bx--form__helper-text--disabled="{disabled}"
    >
      {helperText}
    </div>
  {/if}
</div>
