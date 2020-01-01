<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let helperText = '';
  export let id = Math.random();
  export let invalid = false;
  export let invalidText = '';
  export let items = [];
  export let itemToString = item => item.text || item.id;
  export let light = false;
  export let open = false;
  export let placeholder = '';
  export let selectedIndex = -1;
  export let shouldFilterItem = () => true;
  export let size = undefined;
  export let style = undefined;
  export let titleText = '';
  export let translateWithId = undefined;
  export let value = '';

  import { afterUpdate } from 'svelte';
  import WarningFilled16 from 'carbon-icons-svelte/lib/WarningFilled16';
  import { cx } from '../../lib';
  import ListBox, {
    ListBoxField,
    ListBoxMenu,
    ListBoxMenuIcon,
    ListBoxMenuItem,
    ListBoxSelection
  } from '../ListBox';

  let selectedId = undefined;
  let inputRef = undefined;
  let inputValue = '';
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
      inputRef.focus();
      filteredItems = items.filter(item => shouldFilterItem(item, value));
    } else {
      highlightedIndex = -1;
      inputValue = selectedItem ? selectedItem.text : '';
    }
  });

  $: ariaLabel = $$props['aria-label'] || 'Choose an item';
  $: menuId = `menu-${id}`;
  $: comboId = `combo-${id}`;
  $: highlightedId = items[highlightedIndex] ? items[highlightedIndex].id : undefined;
  $: filteredItems = items.filter(item => shouldFilterItem(item, value));
  $: selectedItem = items[selectedIndex];
  $: inputValue = selectedItem ? selectedItem.text : undefined;
  $: value = inputValue;
</script>

<svelte:body
  on:click={({ target }) => {
    if (open && inputRef && !inputRef.contains(target)) {
      open = false;
    }
  }} />

<div class={cx('--list-box__wrapper', className)} {style}>
  {#if titleText}
    <label class={cx('--label', disabled && '--label--disabled')} for={id}>{titleText}</label>
  {/if}
  {#if helperText}
    <div class={cx('--form__helper-text', disabled && '--form__helper-text--disabled')}>
      {helperText}
    </div>
  {/if}
  <ListBox
    class={cx('--combo-box')}
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
      {disabled}
      {translateWithId}>
      <input
        bind:this={inputRef}
        tabindex="0"
        autocomplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-activedescendant={highlightedId}
        aria-labelledby={comboId}
        aria-disabled={disabled}
        aria-controls={open ? menuId : undefined}
        aria-owns={open ? menuId : undefined}
        class={cx('--text-input', inputValue === '' && '--text-input--empty')}
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
          }
        }}
        on:focus
        on:blur
        on:blur={({ relatedTarget }) => {
          if (relatedTarget && relatedTarget.getAttribute('role') !== 'button') {
            inputRef.focus();
          }
        }}
        {disabled}
        {placeholder}
        {id}
        value={inputValue} />
      {#if invalid}
        <WarningFilled16 class={cx('--list-box__invalid-icon')} />
      {/if}
      {#if inputValue}
        <ListBoxSelection
          on:clear={() => {
            selectedIndex = -1;
            open = false;
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
            active={selectedIndex === i || selectedId === item.id}
            highlighted={highlightedIndex === i || selectedIndex === i}
            on:click={() => {
              selectedId = item.id;
              selectedIndex = items.map(({ id }) => id).indexOf(filteredItems[i].id);
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
