<script>
  /**
   * @typedef {{ id: string; text: string; }} ComboBoxItem
   * @event {{ selectedId: string; selectedIndex: number; selectedItem: ComboBoxItem }} select
   */

  /**
   * Set the combobox items
   * @type {ComboBoxItem[]}
   */
  export let items = [];

  /**
   * Override the display of a combobox item
   * @type {(item: ComboBoxItem) => string}
   */
  export let itemToString = (item) => item.text || item.id;

  /** Set the selected item by value index */
  export let selectedIndex = -1;

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
   * Override the default translation ids
   * @type {(id: any) => string}
   */
  export let translateWithId = undefined;

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
  import WarningFilled16 from "carbon-icons-svelte/lib/WarningFilled16/WarningFilled16.svelte";
  import WarningAltFilled16 from "carbon-icons-svelte/lib/WarningAltFilled16/WarningAltFilled16.svelte";
  import ListBox from "../ListBox/ListBox.svelte";
  import ListBoxField from "../ListBox/ListBoxField.svelte";
  import ListBoxMenu from "../ListBox/ListBoxMenu.svelte";
  import ListBoxMenuIcon from "../ListBox/ListBoxMenuIcon.svelte";
  import ListBoxMenuItem from "../ListBox/ListBoxMenuItem.svelte";
  import ListBoxSelection from "../ListBox/ListBoxSelection.svelte";

  const dispatch = createEventDispatcher();

  let selectedId = undefined;
  let inputValue = "";
  let highlightedIndex = -1;

  function change(dir) {
    let index = highlightedIndex + dir;

    if (index < 0) {
      index = items.length - 1;
    } else if (index >= items.length) {
      index = 0;
    }

    highlightedIndex = index;
  }

  afterUpdate(() => {
    if (open) {
      ref.focus();
      filteredItems = items.filter((item) => shouldFilterItem(item, value));
    } else {
      highlightedIndex = -1;
      inputValue = selectedItem ? selectedItem.text : "";

      if (!selectedItem) {
        selectedId = undefined;
        selectedIndex = -1;
      }
    }
  });

  $: if (selectedIndex > -1) {
    selectedId = items[selectedIndex].id;
    dispatch("select", { selectedId, selectedIndex, selectedItem });
  }
  $: ariaLabel = $$props["aria-label"] || "Choose an item";
  $: menuId = `menu-${id}`;
  $: comboId = `combo-${id}`;
  $: highlightedId = items[highlightedIndex]
    ? items[highlightedIndex].id
    : undefined;
  $: filteredItems = items.filter((item) => shouldFilterItem(item, value));
  $: selectedItem = items[selectedIndex];
  $: inputValue = selectedItem ? selectedItem.text : undefined;
  $: value = inputValue;
</script>

<svelte:body
  on:click="{({ target }) => {
    if (open && ref && !ref.contains(target)) {
      open = false;
    }
  }}" />

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
      name="{name}"
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
        {...$$restProps}
        class:bx--text-input="{true}"
        class:bx--text-input--light="{light}"
        class:bx--text-input--empty="{inputValue === ''}"
        on:input="{({ target }) => {
          inputValue = target.value;
        }}"
        on:keydown
        on:keydown|stopPropagation="{({ key }) => {
          if (key === 'Enter') {
            open = !open;
            if (highlightedIndex > -1 && highlightedIndex !== selectedIndex) {
              selectedIndex = highlightedIndex;
              open = false;
            }
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
        <WarningFilled16 class="bx--list-box__invalid-icon" />
      {/if}
      {#if !invalid && warn}
        <WarningAltFilled16
          class="bx--list-box__invalid-icon bx--list-box__invalid-icon--warning"
        />
      {/if}
      {#if inputValue}
        <ListBoxSelection
          on:clear
          on:clear="{() => {
            selectedIndex = -1;
            open = false;
            ref.focus();
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
            active="{selectedIndex === i || selectedId === item.id}"
            highlighted="{highlightedIndex === i || selectedIndex === i}"
            on:click="{() => {
              selectedIndex = items
                .map(({ id }) => id)
                .indexOf(filteredItems[i].id);
              open = false;
            }}"
            on:mouseenter="{() => {
              highlightedIndex = i;
            }}"
          >
            {itemToString(item)}
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
