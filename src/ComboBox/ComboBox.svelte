<script>
  /**
   * @typedef {{ id: string; text: string; }} ComboBoxItem
   */

  /**
   * Set the combobox items
   * @type {ComboBoxItem[]} [items=[]]
   */
  export let items = [];

  /**
   * Override the display of a combobox item
   * @type {(item: ComboBoxItem) => string} [itemToString = (item: ComboBoxItem) => string]
   */
  export let itemToString = (item) => item.text || item.id;

  /**
   * Set the selected item by value index
   * @type {number} [selectedIndex=-1]
   */
  export let selectedIndex = -1;

  /**
   * Specify the selected combobox value
   * @type {string} [value=""]
   */
  export let value = "";

  /**
   * Set the size of the combobox
   * @type {"sm" | "xl"} [size]
   */
  export let size = undefined;

  /**
   * Set to `true` to disable the combobox
   * @type {boolean} [disabled=false]
   */
  export let disabled = false;

  /**
   * Specify the title text of the combobox
   * @type {string} [titleText=""]
   */
  export let titleText = "";

  /**
   * Specify the placeholder text
   * @type {string} [placeholder=""]
   */
  export let placeholder = "";

  /**
   * Specify the helper text
   * @type {string} [helperText=""]
   */
  export let helperText = "";

  /**
   * Specify the invalid state text
   * @type {string} [invalidText=""]
   */
  export let invalidText = "";

  /**
   * Set to `true` to indicate an invalid state
   * @type {boolean} [invalid=false]
   */
  export let invalid = false;

  /**
   * Set to `true` to enable the light variant
   * @type {boolean} [light=false]
   */
  export let light = false;

  /**
   * Set to `true` to open the combobox menu dropdown
   * @type {boolean} [open=false]
   */
  export let open = false;

  /**
   * Determine if an item should be filtered given the current combobox value
   * @type {(item: ComboBoxItem, value: string) => boolean} [shouldFilterItem=() => true]
   */
  export let shouldFilterItem = () => true;

  /**
   * Override the default translation ids
   * @type {(id: any) => string} [translateWithId]
   */
  export let translateWithId = undefined;

  /**
   * Set an id for the list box component
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the input
   * @type {string} [name]
   */
  export let name = undefined;

  /**
   * Obtain a reference to the input HTML element
   * @type {null | HTMLInputElement} [ref=null]
   */
  export let ref = null;

  import { afterUpdate } from "svelte";
  import WarningFilled16 from "carbon-icons-svelte/lib/WarningFilled16";
  import {
    ListBox,
    ListBoxField,
    ListBoxMenu,
    ListBoxMenuIcon,
    ListBoxMenuItem,
    ListBoxSelection,
  } from "../ListBox";

  let selectedId = undefined;
  let inputValue = "";
  let highlightedIndex = -1;

  function change(direction) {
    let index = highlightedIndex + direction;

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
    }
  });

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
  on:click={({ target }) => {
    if (open && ref && !ref.contains(target)) {
      open = false;
    }
  }} />

<div class:bx--list-box__wrapper={true} {...$$restProps}>
  {#if titleText}
    <label for={id} class:bx--label={true} class:bx--label--disabled={disabled}>
      {titleText}
    </label>
  {/if}
  {#if helperText}
    <div
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}>
      {helperText}
    </div>
  {/if}
  <ListBox
    class="bx--combo-box"
    id={comboId}
    aria-label={ariaLabel}
    {disabled}
    {invalid}
    {invalidText}
    {open}
    {light}
    {size}>
    <ListBoxField
      role="button"
      aria-expanded={open}
      on:click={() => {
        open = true;
      }}
      {id}
      {name}
      {disabled}
      {translateWithId}>
      <input
        bind:this={ref}
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
        class:bx--text-input--empty={inputValue === ''}
        on:input={({ target }) => {
          inputValue = target.value;
        }}
        on:keydown
        on:keydown|stopPropagation={({ key }) => {
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
        }}
        on:focus
        on:blur
        on:blur={({ relatedTarget }) => {
          if (relatedTarget && relatedTarget.getAttribute('role') !== 'button') {
            ref.focus();
          }
        }}
        {disabled}
        {placeholder}
        {id}
        value={inputValue} />
      {#if invalid}
        <WarningFilled16 class="bx--list-box__invalid-icon" />
      {/if}
      {#if inputValue}
        <ListBoxSelection
          on:clear={() => {
            selectedIndex = -1;
            open = false;
            ref.focus();
          }}
          {translateWithId}
          {disabled}
          {open} />
      {/if}
      <ListBoxMenuIcon
        on:click={() => {
          open = !open;
        }}
        {translateWithId}
        {open} />
    </ListBoxField>
    {#if open}
      <ListBoxMenu aria-label={ariaLabel} {id}>
        {#each filteredItems as item, i (item.id || i)}
          <ListBoxMenuItem
            id={item.id}
            active={selectedIndex === i || selectedId === item.id}
            highlighted={highlightedIndex === i || selectedIndex === i}
            on:click={() => {
              selectedId = item.id;
              selectedIndex = items
                .map(({ id }) => id)
                .indexOf(filteredItems[i].id);
              open = false;
            }}
            on:mouseenter={() => {
              highlightedIndex = i;
            }}>
            {itemToString(item)}
          </ListBoxMenuItem>
        {/each}
      </ListBoxMenu>
    {/if}
  </ListBox>
</div>
