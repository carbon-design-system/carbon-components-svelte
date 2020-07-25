<script>
  export let selectedIndex = -1;
  export let open = false;

  /**
   * Set to `true` to use the inline variant
   * @type {boolean} [inline=false]
   */
  export let inline = false;

  /**
   * Set to `true` to enable the light variant
   * @type {boolean} [light=false]
   */
  export let light = false;
  export let disabled = false;
  export let invalid = false;
  export let items = [];
  export let itemToString = (item) => item.text || item.id;
  export let type = "default"; // "default" | "inline"
  export let size = undefined; // "sm" | "lg" | "xl"

  /**
   * Set an id for the list box component
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);
  export let name = undefined;
  export let invalidText = "";
  export let helperText = "";
  export let label = undefined;
  export let titleText = "";
  export let translateWithId = undefined;
  export let ref = null;

  import { setContext } from "svelte";
  import WarningFilled16 from "carbon-icons-svelte/lib/WarningFilled16";
  import {
    ListBox,
    ListBoxMenu,
    ListBoxMenuIcon,
    ListBoxMenuItem,
  } from "../ListBox";

  let selectedId = undefined;
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

  $: inline = type === "inline";
  $: selectedItem = items[selectedIndex];
  $: if (!open) {
    highlightedIndex = -1;
  }
</script>

<svelte:body
  on:click={({ target }) => {
    if (open && ref && !ref.contains(target)) {
      open = false;
    }
  }} />

<div
  class:bx--dropdown__wrapper={true}
  class:bx--list-box__wrapper={true}
  class:bx--dropdown__wrapper--inline={inline}
  class:bx--list-box__wrapper--inline={inline}
  class:bx--dropdown__wrapper--inline--invalid={inline && invalid}
  {...$$restProps}>
  {#if titleText}
    <label for={id} class:bx--label={true} class:bx--label--disabled={disabled}>
      {titleText}
    </label>
  {/if}
  {#if !inline && helperText}
    <div
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}>
      {helperText}
    </div>
  {/if}
  <ListBox
    {type}
    {size}
    {id}
    {name}
    aria-label={$$props['aria-label']}
    class="bx--dropdown {invalid && 'bx--dropdown--invalid'}
    {open && 'bx--dropdown--open'}
    {inline && 'bx--dropdown--inline'}
    {disabled && 'bx--dropdown--disabled'}
    {light && 'bx--dropdown--light'}"
    on:click={({ target }) => {
      open = ref.contains(target) ? !open : false;
    }}
    {disabled}
    {open}
    {invalid}
    {invalidText}
    {light}>
    {#if invalid}
      <WarningFilled16 class="bx--list-box__invalid-icon" />
    {/if}
    <button
      bind:this={ref}
      class:bx--list-box__field={true}
      tabindex="0"
      role="button"
      aria-expanded={open}
      on:keydown={({ key }) => {
        if (key === 'Enter') {
          open = !open;
          if (highlightedIndex > -1 && highlightedIndex !== selectedIndex) {
            selectedIndex = highlightedIndex;
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
      }}
      on:blur={({ relatedTarget }) => {
        if (relatedTarget) {
          ref.focus();
        }
      }}
      {disabled}
      {translateWithId}
      {id}>
      <span class="bx--list-box__label">
        {#if selectedItem}{itemToString(selectedItem)}{:else}{label}{/if}
      </span>
      <ListBoxMenuIcon {open} {translateWithId} />
    </button>
    {#if open}
      <ListBoxMenu aria-labelledby={id} {id}>
        {#each items as item, i (item.id || i)}
          <ListBoxMenuItem
            id={item.id}
            active={selectedIndex === i || selectedId === item.id}
            highlighted={highlightedIndex === i || selectedIndex === i}
            on:click={() => {
              selectedId = item.id;
              selectedIndex = i;
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
