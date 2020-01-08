<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let helperText = '';
  export let id = Math.random();
  export let inline = false;
  export let invalid = false;
  export let invalidText = '';
  export let items = [];
  export let itemToString = item => item.text || item.id;
  export let label = undefined;
  export let light = false;
  export let open = false;
  export let selectedIndex = -1;
  export let size = undefined;
  export let style = undefined;
  export let titleText = '';
  export let translateWithId = undefined;
  export let type = 'default';

  import { setContext } from 'svelte';
  import WarningFilled16 from 'carbon-icons-svelte/lib/WarningFilled16';
  import { cx } from '../../lib';
  import ListBox, { ListBoxField, ListBoxMenu, ListBoxMenuIcon, ListBoxMenuItem } from '../ListBox';

  let selectedId = undefined;
  let fieldRef = undefined;
  let highlightedIndex = -1;

  setContext('Dropdown', {
    declareRef: ({ ref }) => {
      fieldRef = ref;
    }
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

  $: inline = type === 'inline';
  $: selectedItem = items[selectedIndex];
  $: if (!open) {
    highlightedIndex = -1;
  }
</script>

<svelte:body
  on:click={({ target }) => {
    if (open && fieldRef && !fieldRef.contains(target)) {
      open = false;
    }
  }} />

<div
  class={cx('--dropdown__wrapper', '--list-box__wrapper', inline && '--dropdown__wrapper--inline', inline && '--list-box__wrapper--inline', inline && invalid && '--dropdown__wrapper--inline--invalid', inline && invalid && '--list-box__wrapper--inline--invalid', className)}
  {style}>
  {#if titleText}
    <label for={id} class={cx('--label', disabled && '--label--disabled')}>{titleText}</label>
  {/if}
  {#if !inline && helperText}
    <div class={cx('--form__helper-text', disabled && '--form__helper-text--disabled')}>
      {helperText}
    </div>
  {/if}
  <ListBox
    {type}
    {size}
    {id}
    aria-label={$$props['aria-label']}
    class={cx('--dropdown', invalid && '--dropdown--invalid', open && '--dropdown--open', inline && '--dropdown--inline', disabled && '--dropdown--disabled', light && '--dropdown--light')}
    on:click={({ target }) => {
      open = fieldRef.contains(target) ? !open : false;
    }}
    {disabled}
    {open}
    {invalid}
    {invalidText}
    {light}>
    {#if invalid}
      <WarningFilled16 class={cx('--list-box__invalid-icon')} />
    {/if}
    <ListBoxField
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
          fieldRef.blur();
        } else if (key === 'ArrowDown') {
          change(1);
        } else if (key === 'ArrowUp') {
          change(-1);
        }
      }}
      on:blur={({ relatedTarget }) => {
        if (relatedTarget) {
          fieldRef.focus();
        }
      }}
      {disabled}
      {translateWithId}
      {id}>
      <span class={cx('--list-box__label')}>
        {#if selectedItem}{itemToString(selectedItem)}{:else}{label}{/if}
      </span>
      <ListBoxMenuIcon {open} {translateWithId} />
    </ListBoxField>
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
