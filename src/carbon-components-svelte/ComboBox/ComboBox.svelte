<script>
  /**
   * @typedef {any} ComboBoxItemId
   * @typedef {{ id: ComboBoxItemId; text: string; disabled?: boolean; }} ComboBoxItem
   * @event {{ selectedId: ComboBoxItemId; selectedItem: ComboBoxItem }} select
   * @slot {{ item: ComboBoxItem; index: number }}
   */

  /**
   * Set the combobox items
   * @type {ReadonlyArray<ComboBoxItem>}
   */
  export let items = [];

  /**
   * Override the display of a combobox item
   * @type {(item: ComboBoxItem) => string}
   */
  export let itemToString = (item) => item.text || item.id;

  /**
   * Set the selected item by value id
   * @type {ComboBoxItemId}
   */
  export let selectedId = undefined;

  /** Specify the selected combobox value */
  export let value = "";

  /**
   * Specify the direction of the combobox dropdown menu
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /**
   * Set the size of the combobox
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /** Set to `true` to disable the combobox */
  export let disabled = false;

  /** Specify the title text of the combobox */
  export let titleText = "";

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Specify the helper text */
  export let helperText = "";

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Set to `true` to indicate an warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to open the combobox menu dropdown */
  export let open = false;

  /**
   * Determine if an item should be filtered given the current combobox value
   * @type {(item: ComboBoxItem, value: string) => boolean}
   */
  export let shouldFilterItem = () => true;

  /**
   * Override the chevron icon label based on the open state.
   * Defaults to "Open menu" when closed and "Close menu" when open
   * @type {(id: import("../ListBox/ListBoxMenuIcon.svelte").ListBoxMenuIconTranslationId) => string}
   */
  export let translateWithId = undefined;

  /**
   * Override the label of the clear button when the input has a selection.
   * Defaults to "Clear selected item" since a combo box can only have on selection.
   * @type {(id: "clearSelection") => string}
   */
  export let translateWithIdSelection = undefined;

  /** Set an id for the list box component */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the input
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the input HTML element */
  export let ref = null;

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

  let selectedItem = undefined;
  let prevSelectedId = null;
  let highlightedIndex = -1;

  function change(dir) {
    let index = highlightedIndex + dir;
    let _items = !filteredItems?.length ? items : filteredItems;
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
   * @type {(options?: { focus?: boolean; }) => void}
   */
  export function clear(options = {}) {
    prevSelectedId = null;
    highlightedIndex = -1;
    highlightedId = undefined;
    selectedId = undefined;
    selectedItem = undefined;
    open = false;
    value = "";
    if (options?.focus !== false) ref?.focus();
  }

  afterUpdate(() => {
    if (open) {
      ref.focus();
      filteredItems = items.filter((item) => shouldFilterItem(item, value));
    } else {
      highlightedIndex = -1;
      filteredItems = [];
      if (!selectedItem) {
        selectedId = undefined;
        value = "";
        highlightedIndex = -1;
        highlightedId = undefined;
      } else {
        // programmatically set value
        value = itemToString(selectedItem);
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
  $: filteredItems = items.filter((item) => shouldFilterItem(item, value));
</script>

<svelte:window
  on:click="{({ target }) => {
    if (open && ref && !ref.contains(target)) {
      open = false;
    }
  }}"
/>

<div class:bx--list-box__wrapper="{true}">
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
        bind:value
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
        name="{name}"
        {...$$restProps}
        class:bx--text-input="{true}"
        class:bx--text-input--light="{light}"
        class:bx--text-input--empty="{value === ''}"
        on:input="{({ target }) => {
          if (!open && target.value.length > 0) {
            open = true;
          }

          if (!value.length) {
            clear();
            open = true;
          }
        }}"
        on:keydown
        on:keydown|stopPropagation="{(e) => {
          const { key } = e;
          if (['Enter', 'ArrowDown', 'ArrowUp'].includes(key)) {
            e.preventDefault();
          }
          if (key === 'Enter') {
            open = !open;
            if (
              highlightedIndex > -1 &&
              filteredItems[highlightedIndex]?.id !== selectedId
            ) {
              open = false;
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
                    e.text.toLowerCase() === value?.toLowerCase() && !e.disabled
                ) ?? filteredItems.find((e) => !e.disabled);
              if (matchedItem) {
                // typed value has matched or fallback to first enabled item
                open = false;
                selectedItem = matchedItem;
                value = itemToString(selectedItem);
                selectedId = selectedItem.id;
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
          on:clear="{clear}"
          translateWithId="{translateWithIdSelection}"
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
            disabled="{item.disabled}"
            on:click="{(e) => {
              if (item.disabled) {
                e.stopPropagation();
                return;
              }
              selectedId = item.id;
              open = false;

              if (filteredItems[i]) {
                value = itemToString(filteredItems[i]);
              }
            }}"
            on:mouseenter="{() => {
              if (item.disabled) return;
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
