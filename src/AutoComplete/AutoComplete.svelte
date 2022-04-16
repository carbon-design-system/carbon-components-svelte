<script>
  /**
   * @typedef {any} AutoCompleteItemId
   * @typedef {string} AutoCompleteItemText
   * @typedef {{ id: AutoCompleteItemId; text: AutoCompleteItemText; }} AutoCompleteItem
   * @event {{ selectedId: AutoCompleteItemId, selectedItem: AutoCompleteItem }} select
   * @slot {{ item: AutoCompleteItem; index: number; }}
   */

  /**
   * Set the dropdown items
   * @type {AutoCompleteItem[]}
   */
  export let items = [];

  export let filteredItems = [];

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

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

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

  import { createEventDispatcher } from "svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import { ListBox, ListBoxMenu, ListBoxMenuItem } from "../ListBox";

  const dispatch = createEventDispatcher();

  let highlightedIndex = -1;

  let innerValue = undefined;

  function change(dir) {
    let index = highlightedIndex + dir;

    if (index < 0) {
      index = filteredItems.length - 1;
    } else if (index >= filteredItems.length) {
      index = 0;
    }

    highlightedIndex = index;
  }

  function onKeydown(event) {
    let key = event.key;

    if (["Enter", "ArrowDown", "ArrowUp"].includes(key)) {
      event.preventDefault();
    }

    if (key === "Enter") {
      open = !open;
      if (
        highlightedIndex > -1 &&
        filteredItems[highlightedIndex].id !== selectedId
      ) {
        selectedItem = filteredItems[highlightedIndex];
        selectedId = selectedItem.id;
        innerValue = selectedItem.text;
        open = false;
      }
    } else if (key === "Backspace") {
      selectedItem = undefined;
      selectedId = undefined;
      open = innerValue.length > 0 && filteredItems.length > 0;
    } else if (key === "Tab") {
      open = false;
      ref.blur();
    } else if (key === "ArrowDown") {
      change(1);
    } else if (key === "ArrowUp") {
      change(-1);
    } else if (key === "Escape") {
      innerValue = "";
      dispatch("clear");
      open = false;
    } else {
      if (!open) open = filteredItems.length > 0;
    }
  }

  $: if (selectedId !== undefined) {
    dispatch("select", { selectedId, selectedItem });
  }

  $: filteredItems = items.filter(
    (item) => innerValue?.length > 0 && item.text.startsWith(innerValue)
  );
  $: inline = type === "inline";
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

<div {...$$restProps}>
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
      <WarningFilled class="bx--text-input__invalid-icon" />
    {/if}
    {#if !invalid && warn}
      <WarningAltFilled
        class="bx--text-input__invalid-icon
          bx--text-input__invalid-icon--warning"
      />
    {/if}
    <input
      bind:this="{ref}"
      bind:value="{innerValue}"
      type="text"
      role="searchbox"
      class="
        auto-complete__input
        {size === 'sm' && 'auto-complete__input--sm'}
        {size === 'xl' && 'auto-complete__input--xl'}
      "
      autocomplete="false"
      disabled="{disabled}"
      id="{id}"
      name="{name}"
      placeholder="{placeholder}"
      {...$$restProps}
      on:change
      on:focus
      on:blur
      on:input
      on:keydown="{onKeydown}"
    />
    {#if open}
      <ListBoxMenu aria-labelledby="{id}" id="{id}">
        {#each filteredItems as item, i (item.id)}
          <ListBoxMenuItem
            id="{item.id}"
            active="{selectedId === item.id}"
            highlighted="{highlightedIndex === i || selectedId === item.id}"
            on:click="{() => {
              selectedItem = item;
              selectedId = item.id;
              innerValue = item.text;
              ref.focus();
            }}"
            on:mouseenter="{() => {
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

<style>
  .auto-complete__input {
    font-size: var(--cds-body-short-01-font-size, 0.875rem);
    font-weight: var(--cds-body-short-01-font-weight, 400);
    line-height: var(--cds-body-short-01-line-height, 1.28572);
    letter-spacing: var(--cds-body-short-01-letter-spacing, 0.16px);
    outline: 2px solid transparent;
    outline-offset: -2px;
    width: 100%;
    height: 2.5rem;
    padding: 0 1rem;
    border: none;
    border-bottom-color: currentcolor;
    border-bottom-style: none;
    border-bottom-width: medium;
    border-bottom: 1px solid var(--cds-ui-04, #8d8d8d);
    background-color: var(--cds-field-01, #f4f4f4);
    color: var(--cds-text-01, #161616);
    transition: background-color 70ms cubic-bezier(0.2, 0, 0.38, 0.9),
      outline 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
  }

  .auto-complete__input:focus {
    outline: 2px solid var(--cds-focus, #0f62fe);
    outline-offset: -2px;
  }

  .auto-complete__input--sm {
    height: 2rem;
  }

  .auto-complete__input--xl,
  .auto-complete__input--lg {
    height: 3rem;
  }

  .auto-complete__input:disabled {
    outline: 2px solid transparent;
    outline-offset: -2px;
    border-bottom: 1px solid transparent;
    background-color: var(--cds-field, #f4f4f4);
    color: var(--cds-text-disabled, #c6c6c6);
    cursor: not-allowed;
    -webkit-text-fill-color: var(--cds-disabled-02, #c6c6c6);
  }
</style>
