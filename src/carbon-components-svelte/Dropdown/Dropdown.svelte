<script>
  /**
   * @typedef {any} DropdownItemId
   * @typedef {string} DropdownItemText
   * @typedef {{ id: DropdownItemId; text: DropdownItemText; disabled?: boolean; }} DropdownItem
   * @event {{ selectedId: DropdownItemId, selectedItem: DropdownItem }} select
   * @slot {{ item: DropdownItem; index: number; }}
   */

  /**
   * Set the dropdown items
   * @type {ReadonlyArray<DropdownItem>}
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
  export let selectedId;

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
   * Override the chevron icon label based on the open state.
   * Defaults to "Open menu" when closed and "Close menu" when open
   * @type {(id: import("../ListBox/ListBoxMenuIcon.svelte").ListBoxMenuIconTranslationId) => string}
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

  import { createEventDispatcher, onMount } from "svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import {
    ListBox,
    ListBoxMenu,
    ListBoxMenuIcon,
    ListBoxMenuItem,
  } from "../ListBox";

  const dispatch = createEventDispatcher();

  let highlightedIndex = -1;

  $: inline = type === "inline";
  $: selectedItem = items.find((item) => item.id === selectedId);
  $: if (!open) {
    highlightedIndex = -1;
  }

  function change(dir) {
    let index = highlightedIndex + dir;

    if (items.length === 0) return;
    if (index < 0) {
      index = items.length - 1;
    } else if (index >= items.length) {
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

  const dispatchSelect = () => {
    dispatch("select", {
      selectedId,
      selectedItem: items.find((item) => item.id === selectedId),
    });
  };

  const pageClickHandler = ({ target }) => {
    if (open && ref && !ref.contains(target)) {
      open = false;
    }
  };

  onMount(() => {
    if (parent) {
      parent.addEventListener("click", pageClickHandler);
    }

    return () => {
      if (parent) {
        parent.removeEventListener("click", pageClickHandler);
      }
    };
  });
</script>

<svelte:window on:click="{pageClickHandler}" />

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
    role="{undefined}"
    type="{type}"
    size="{size}"
    name="{name}"
    aria-label="{$$props['aria-label']}"
    class="bx--dropdown 
      {direction === 'top' && 'bx--list-box--up'} 
      {invalid && 'bx--dropdown--invalid'} 
      {!invalid && warn && 'bx--dropdown--warning'} 
      {open && 'bx--dropdown--open'}
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
      <WarningFilled class="bx--list-box__invalid-icon" />
    {/if}
    {#if !invalid && warn}
      <WarningAltFilled
        class="bx--list-box__invalid-icon bx--list-box__invalid-icon--warning"
      />
    {/if}
    <button
      bind:this="{ref}"
      type="button"
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
            dispatchSelect();
            open = false;
          }
        } else if (key === 'Tab') {
          open = false;
          ref.blur();
        } else if (key === 'ArrowDown') {
          if (!open) open = true;
          change(1);
        } else if (key === 'ArrowUp') {
          if (!open) open = true;
          change(-1);
        } else if (key === 'Escape') {
          open = false;
        }
      }}"
      on:keyup="{(e) => {
        const { key } = e;
        if ([' '].includes(key)) {
          e.preventDefault();
        } else {
          return;
        }
        open = !open;

        if (
          highlightedIndex > -1 &&
          items[highlightedIndex].id !== selectedId
        ) {
          selectedId = items[highlightedIndex].id;
          dispatchSelect();
          open = false;
        }
      }}"
      disabled="{disabled}"
      translateWithId="{translateWithId}"
      id="{id}"
    >
      <span class:bx--list-box__label="{true}">
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
            highlighted="{highlightedIndex === i}"
            disabled="{item.disabled}"
            on:click="{(e) => {
              if (item.disabled) {
                e.stopPropagation();
                return;
              }
              selectedId = item.id;
              dispatchSelect();
              ref.focus();
            }}"
            on:mouseenter="{() => {
              if (item.disabled) return;
              highlightedIndex = i;
            }}"
          >
            <slot item="{item}" index="{i}">
              {itemToString(item)}
            </slot>
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
