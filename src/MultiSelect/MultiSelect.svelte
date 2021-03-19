<script>
  /**
   * @typedef {string} MultiSelectItemId
   * @typedef {string} MultiSelectItemText
   * @typedef {{ id: MultiSelectItemId; text: MultiSelectItemText; }} MultiSelectItem
   * @event {{ selectedIds: string[]; selected: MultiSelectItem[]; unselected: MultiSelectItem[]; }} select
   * @event {any} clear
   */

  /**
   * Set the multiselect items
   * @type {MultiSelectItem[]}
   */
  export let items = [];

  /**
   * Override the display of a multiselect item
   * @type {(item: MultiSelectItem) => string}
   */
  export let itemToString = (item) => item.text || item.id;

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
    item.text.toLowerCase().includes(value.toLowerCase());

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

  /** Set an id for the list box component */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the select
   * @type {string}
   */
  export let name = undefined;

  import { afterUpdate, createEventDispatcher, setContext } from "svelte";
  import WarningFilled16 from "carbon-icons-svelte/lib/WarningFilled16/WarningFilled16.svelte";
  import WarningAltFilled16 from "carbon-icons-svelte/lib/WarningAltFilled16/WarningAltFilled16.svelte";
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

  let multiSelectRef = null;
  let fieldRef = null;
  let selectionRef = null;
  let inputRef = null;
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

    if (index < 0) {
      index = items.length - 1;
    } else if (index >= items.length) {
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
  $: highlightedId = sortedItems[highlightedIndex]
    ? sortedItems[highlightedIndex].id
    : undefined;
  $: value = inputValue;
</script>

<svelte:body
  on:click="{({ target }) => {
    if (open && multiSelectRef && !multiSelectRef.contains(target)) {
      open = false;
    }
  }}" />

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
    >
      {titleText}
    </label>
  {/if}
  <ListBox
    aria-label="{ariaLabel}"
    id="{id}"
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
      {filterable &&
      'bx--multi-select--filterable'}
      {invalid &&
      'bx--multi-select--invalid'}
      {inline &&
      'bx--multi-select--inline'}
      {checked.length > 0 &&
      'bx--multi-select--selected'}"
  >
    {#if invalid}
      <WarningFilled16 class="bx--list-box__invalid-icon" />
    {/if}
    {#if !invalid && warn}
      <WarningAltFilled16
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
      on:keydown="{({ key }) => {
        if (filterable) {
          return;
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
            sortedItems[highlightedIndex].checked = !sortedItems[
              highlightedIndex
            ].checked;
          }
        }
      }}"
      on:blur="{({ relatedTarget }) => {
        if (
          relatedTarget &&
          !['INPUT', 'SELECT', 'TEXTAREA'].includes(relatedTarget.tagName) &&
          relatedTarget.getAttribute('role') !== 'button' &&
          relatedTarget.getAttribute('role') !== 'searchbox'
        ) {
          fieldRef.focus();
        }
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
            fieldRef.blur();
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
              if (highlightedIndex > -1) {
                sortedItems[highlightedIndex].checked = !sortedItems[
                  highlightedIndex
                ].checked;
              }
            } else if (key === 'Tab') {
              open = false;
            } else if (key === 'ArrowDown') {
              change(1);
            } else if (key === 'ArrowUp') {
              change(-1);
            }
          }}"
          on:focus
          on:blur
          on:blur="{({ relatedTarget }) => {
            if (
              relatedTarget &&
              relatedTarget.getAttribute('role') !== 'button'
            ) {
              inputRef.focus();
            }
          }}"
          disabled="{disabled}"
          placeholder="{placeholder}"
          id="{id}"
          name="{name}"
          value="{inputValue}"
        />
        {#if invalid}
          <WarningFilled16 class="bx--list-box__invalid-icon" />
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
      <ListBoxMenu aria-label="{ariaLabel}" id="{id}">
        {#each filterable ? filteredItems : sortedItems as item, i (item.id)}
          <ListBoxMenuItem
            id="{item.id}"
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
              readonly
              tabindex="-1"
              id="checkbox-{item.id}"
              title="{useTitleInItem ? itemToString(item) : undefined}"
              name="{itemToString(item)}"
              labelText="{itemToString(item)}"
              checked="{item.checked}"
              disabled="{disabled}"
            />
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
