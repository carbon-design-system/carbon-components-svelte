<script>
  /**
   * @typedef {any} AutoCompleteItemId
   * @typedef {string} AutoCompleteItemText
   * @typedef {{ id: AutoCompleteItemId; text: AutoCompleteItemText; }} AutoCompleteItem
   * @event {{ selectedId: AutoCompleteItemId, selectedItem: AutoCompleteItem }} select
   * @slot {{ item: AutoCompleteItem; index: number; }}
   */

  /**
   * Override the display of a dropdown item
   * @type {(item: AutoCompleteItem) => string}
   */
  export let itemToString = (item) => item.text || item.id;

  /**
   * Specify the selected item id
   * @type {AutoCompleteItemId}
   */
  export let selectedId = undefined;

  /**
   * Specify the selected item
   * @type {AutoCompleteItem}
   */
  export let selectedItem = undefined;

  /**
   * Determine if an item should be filtered given the current combobox value
   * @type {(value: string) => {}}
   */
  export let shouldFilterItem = () => {};

  /**
   * Specify the direction of the dropdown menu
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /**
   * Specify the size of the dropdown field
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
  export let titleText = "";

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

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Override the default translation ids
   * @type {(id: any) => string}
   */
  export let translateWithId = undefined;

  /** Set an id for the list box component */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the list box
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the button HTML element */
  export let ref = null;

  /** Specify the placeholder text */
  export let placeholder = null;

  /**
   * Obtain a reference to the list HTML element
   * @type {null | HTMLDivElement}
   */
  export let listRef = null;

  import { createEventDispatcher, afterUpdate, tick } from "svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import ListBox from "../ListBox/ListBox.svelte";
  import ListBoxField from "../ListBox/ListBoxField.svelte";
  import ListBoxMenu from "../ListBox/ListBoxMenu.svelte";
  import ListBoxMenuIcon from "../ListBox/ListBoxMenuIcon.svelte";
  import ListBoxMenuItem from "../ListBox/ListBoxMenuItem.svelte";
  import ListBoxSelection from "../ListBox/ListBoxSelection.svelte";

  const dispatch = createEventDispatcher();

  export let filteredItems = [];
  let inputValue = ""; //value;
  let prevSelectedId = null;
  let highlightedIndex = -1;

  function change(dir) {
    let index = highlightedIndex + dir;
    if (index < 0) {
      index = filteredItems.length - 1;
    } else if (index >= filteredItems.length) {
      index = 0;
    }
    highlightedIndex = index;
  }

  /**
   * Clear the combo box programmatically
   * @type {(options?: { focus?: boolean; }) => void}
   */
  export function clear(options = {}) {
    prevSelectedId = null;
    highlightedIndex = -1;
    highlightedId = undefined;
    selectedId = undefined;
    selectedItem = undefined;
    open = false;
    inputValue = "";
    if (options?.focus !== false) ref?.focus();
  }

  afterUpdate(() => {
    if (open) {
      ref.focus();
      //filteredItems = shouldFilterItem(value);
    } else {
      highlightedIndex = -1;
      filteredItems = [];
      if (!selectedItem) {
        selectedId = undefined;
        inputValue = "";
        highlightedIndex = -1;
        highlightedId = undefined;
      } else {
        // programmatically set inputValue
        inputValue = selectedItem.text;
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
        selectedItem =
          filteredItems?.length > 0
            ? filteredItems.find((item) => item.id === selectedId)
            : null;
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
  $: highlightedId = filteredItems[highlightedIndex]
    ? filteredItems[highlightedIndex].id
    : 0;
  $: if (inputValue) {
    shouldFilterItem(inputValue);
  } else {
    filteredItems = [];
  }
  //$: value = inputValue;
</script>

<svelte:window
  on:click="{({ target }) => {
    if (open && ref && !ref.contains(target)) {
      open = false;
    }
  }}"
/>

<div class:bx--list-box__wrapper="{true}">
  {#if titleText && !hideLabel}
    <label
      for="{id}"
      class:bx--label="{true}"
      class:bx--label--disabled="{disabled}"
    >
      {titleText}
    </label>
  {/if}
  <ListBox
    class="bx--combo-box {direction === 'top' &&
      'bx--list-box--up'} {!invalid && warn && 'bx--combo-box--warning'}"
    id="{comboId}"
    aria-label="{ariaLabel}"
    disabled="{disabled}"
    invalid="{invalid}"
    invalidText="{invalidText}"
    open="{open}"
    light="{light}"
    size="{size}"
    warn="{warn}"
    warnText="{warnText}"
  >
    <ListBoxField
      role="button"
      aria-expanded="{open}"
      on:click="{async () => {
        if (disabled) return;
        open = true;
        await tick();
        ref.focus();
      }}"
      id="{id}"
      disabled="{disabled}"
      translateWithId="{translateWithId}"
    >
      <input
        bind:this="{ref}"
        tabindex="0"
        autocomplete="off"
        aria-autocomplete="list"
        aria-expanded="{open}"
        aria-activedescendant="{highlightedId}"
        aria-labelledby="{comboId}"
        aria-disabled="{disabled}"
        aria-controls="{open ? menuId : undefined}"
        aria-owns="{open ? menuId : undefined}"
        disabled="{disabled}"
        placeholder="{placeholder}"
        id="{id}"
        value="{inputValue}"
        name="{name}"
        {...$$restProps}
        class:bx--text-input="{true}"
        class:bx--text-input--light="{light}"
        class:bx--text-input--empty="{inputValue === ''}"
        on:input="{async ({ target }) => {
          if (!open && target.value.length > 0) {
            open = true;
          }

          inputValue = target.value;
          if (!inputValue.length) {
            clear();
            open = true;
          }
        }}"
        on:keydown
        on:keydown|stopPropagation="{({ key }) => {
          if (key === 'Enter') {
            open = !open;

            if (
              highlightedIndex > -1 &&
              filteredItems[highlightedIndex]?.id !== selectedId
            ) {
              open = false;
              if (filteredItems[highlightedIndex]) {
                inputValue = filteredItems[highlightedIndex].text;
                selectedItem = filteredItems[highlightedIndex];
                selectedId = filteredItems[highlightedIndex].id;
              }
            } else {
              open = false;
              if (filteredItems[0]) {
                inputValue = filteredItems[0].text;
                selectedItem = filteredItems[0];
                selectedId = filteredItems[0].id;
              }
            }
            highlightedIndex = -1;
          } else if (key === 'Tab') {
            open = false;
          } else if (key === 'ArrowDown') {
            change(1);
          } else if (key === 'ArrowUp') {
            change(-1);
          } else if (key === 'Escape') {
            open = false;
          }
        }}"
        on:keyup
        on:focus
        on:blur
        on:blur="{({ relatedTarget }) => {
          if (!open || !relatedTarget) return;
          if (
            relatedTarget &&
            !['INPUT', 'SELECT', 'TEXTAREA'].includes(relatedTarget.tagName) &&
            relatedTarget.getAttribute('role') !== 'button' &&
            relatedTarget.getAttribute('role') !== 'searchbox'
          ) {
            ref.focus();
          }
        }}"
      />
      {#if invalid}
        <WarningFilled class="bx--list-box__invalid-icon" />
      {/if}
      {#if !invalid && warn}
        <WarningAltFilled
          class="bx--list-box__invalid-icon bx--list-box__invalid-icon--warning"
        />
      {/if}
      {#if inputValue}
        <ListBoxSelection
          on:clear
          on:clear="{clear}"
          translateWithId="{translateWithId}"
          disabled="{disabled}"
          open="{open}"
        />
      {/if}
      <ListBoxMenuIcon
        on:click="{(e) => {
          if (disabled) return;
          e.stopPropagation();
          open = !open;
        }}"
        translateWithId="{translateWithId}"
        open="{open}"
      />
    </ListBoxField>
    {#if open}
      <ListBoxMenu
        aria-label="{ariaLabel}"
        id="{id}"
        on:scroll
        bind:ref="{listRef}"
      >
        {#each filteredItems as item, i (item.id)}
          <ListBoxMenuItem
            id="{item.id}"
            active="{selectedId === item.id}"
            highlighted="{highlightedIndex === i}"
            on:click="{() => {
              selectedId = item.id;
              open = false;

              if (filteredItems[i]) {
                inputValue = filteredItems[i].text;
              }
            }}"
            on:mouseenter="{() => {
              highlightedIndex = i;
            }}"
          >
            <slot item="{item}" index="{i}">
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
      class:bx--form__helper-text="{true}"
      class:bx--form__helper-text--disabled="{disabled}"
    >
      {helperText}
    </div>
  {/if}
</div>
