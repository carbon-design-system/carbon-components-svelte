<script>
  /**
   * @typedef {any} DropdownItemId
   * @typedef {string} DropdownItemText
   * @typedef {{ id: DropdownItemId; text: DropdownItemText; }} DropdownItem
   * @event {{ selectedId: DropdownItemId, selectedItem: DropdownItem }} select
   */

  /**
   * Set the dropdown items
   * @type {DropdownItem[]}
   */
  export let items = [];

  /**
   * Override the display of a dropdown item
   * @type {(item: DropdownItem) => string}
   */
  export let itemToString = (item) => item.text || item.id;

  /**
   * Specify the selected item id
   * @type {DropdownItemId}
   */
  export let selectedId = undefined;

  /**
   * Specify the type of dropdown
   * @type {"default" | "inline"}
   */
  export let type = "default";

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

  /** Set to `true` to use the inline variant */
  export let inline = false;

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

  /**
   * Specify the list box label
   * @type {string}
   */
  export let label = undefined;

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

  import { createEventDispatcher } from "svelte";
  import WarningFilled16 from "../icons/WarningFilled16.svelte";
  import WarningAltFilled16 from "../icons/WarningAltFilled16.svelte";
  import {
    ListBox,
    ListBoxMenu,
    ListBoxMenuIcon,
    ListBoxMenuItem,
  } from "../ListBox";

  const dispatch = createEventDispatcher();

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

  $: if (selectedId !== undefined) {
    dispatch("select", { selectedId, selectedItem });
  }
  $: inline = type === "inline";
  $: selectedItem = items.find((item) => item.id === selectedId);
  $: if (!open) {
    highlightedIndex = -1;
  }
</script>

<svelte:window
  on:click="{({ target }) => {
    if (open && ref && !ref.contains(target)) {
      open = false;
    }
  }}"
/>

<div
  class:bx--dropdown__wrapper="{true}"
  class:bx--list-box__wrapper="{true}"
  class:bx--dropdown__wrapper--inline="{inline}"
  class:bx--list-box__wrapper--inline="{inline}"
  class:bx--dropdown__wrapper--inline--invalid="{inline && invalid}"
  {...$$restProps}
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
    type="{type}"
    size="{size}"
    id="{id}"
    name="{name}"
    aria-label="{$$props['aria-label']}"
    class="bx--dropdown {direction === 'top' && 'bx--list-box--up'} {invalid &&
      'bx--dropdown--invalid'} {!invalid &&
      warn &&
      'bx--dropdown--warning'} {open && 'bx--dropdown--open'}
      {size === 'sm' && 'bx--dropdown--sm'}
      {size === 'xl' && 'bx--dropdown--xl'}
      {inline && 'bx--dropdown--inline'}
      {disabled && 'bx--dropdown--disabled'}
      {light && 'bx--dropdown--light'}"
    on:click="{({ target }) => {
      if (disabled) return;
      open = ref.contains(target) ? !open : false;
    }}"
    disabled="{disabled}"
    open="{open}"
    invalid="{invalid}"
    invalidText="{invalidText}"
    light="{light}"
    warn="{warn}"
    warnText="{warnText}"
  >
    {#if invalid}
      <WarningFilled16 class="bx--list-box__invalid-icon" />
    {/if}
    {#if !invalid && warn}
      <WarningAltFilled16
        class="bx--list-box__invalid-icon bx--list-box__invalid-icon--warning"
      />
    {/if}
    <button
      bind:this="{ref}"
      class:bx--list-box__field="{true}"
      tabindex="0"
      aria-expanded="{open}"
      on:keydown="{(e) => {
        const { key } = e;
        if (['Enter', 'ArrowDown', 'ArrowUp'].includes(key)) {
          e.preventDefault();
        }
        if (key === 'Enter') {
          open = !open;
          if (
            highlightedIndex > -1 &&
            items[highlightedIndex].id !== selectedId
          ) {
            selectedId = items[highlightedIndex].id;
            open = false;
          }
        } else if (key === 'Tab') {
          open = false;
          ref.blur();
        } else if (key === 'ArrowDown') {
          change(1);
        } else if (key === 'ArrowUp') {
          change(-1);
        }
      }}"
      disabled="{disabled}"
      translateWithId="{translateWithId}"
      id="{id}"
    >
      <span class="bx--list-box__label">
        {#if selectedItem}{itemToString(selectedItem)}{:else}{label}{/if}
      </span>
      <ListBoxMenuIcon
        on:click="{(e) => {
          e.stopPropagation();
          if (disabled) return;
          open = !open;
        }}"
        translateWithId="{translateWithId}"
        open="{open}"
      />
    </button>
    {#if open}
      <ListBoxMenu aria-labelledby="{id}" id="{id}">
        {#each items as item, i (item.id)}
          <ListBoxMenuItem
            id="{item.id}"
            active="{selectedId === item.id}"
            highlighted="{highlightedIndex === i || selectedId === item.id}"
            on:click="{() => {
              selectedId = item.id;
              ref.focus();
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
  {#if !inline && !invalid && !warn && helperText}
    <div
      class:bx--form__helper-text="{true}"
      class:bx--form__helper-text--disabled="{disabled}"
    >
      {helperText}
    </div>
  {/if}
</div>
