<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let filterable = false;
  export let filterItem = (item, value) => item.text.toLowerCase().includes(value.toLowerCase());
  export let helperText = '';
  export let id = Math.random();
  export let name = Math.random();
  export let invalid = false;
  export let invalidText = '';
  export let items = [];
  export let itemToString = item => item.text || item.id;
  export let label = '';
  export let light = false;
  export let locale = 'en';
  export let open = false;
  export let placeholder = '';
  export let selectedIds = [];
  export let selectionFeedback = 'top-after-reopen';
  export let size = undefined;
  export let sortItem = (a, b) => a.text.localeCompare(b.text, locale, { numeric: true });
  export let style = undefined;
  export let titleText = '';
  export let translateWithId = undefined;
  export let type = 'default';
  export let useTitleInItem = false;
  export let value = '';

  import { afterUpdate, setContext } from 'svelte';
  import WarningFilled16 from 'carbon-icons-svelte/lib/WarningFilled16';
  import { cx } from '../../lib';
  import Checkbox from '../Checkbox';
  import ListBox, {
    ListBoxField,
    ListBoxMenu,
    ListBoxMenuIcon,
    ListBoxMenuItem,
    ListBoxSelection
  } from '../ListBox';

  let multiSelectRef = undefined;
  let fieldRef = undefined;
  let selectionRef = undefined;
  let inputRef = undefined;
  let inputValue = '';
  let initialSorted = false;
  let highlightedIndex = -1;
  let prevChecked = [];

  setContext('MultiSelect', {
    declareRef: ({ key, ref }) => {
      switch (key) {
        case 'field':
          fieldRef = ref;
          break;
        case 'selection':
          selectionRef = ref;
          break;
      }
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

  function sort() {
    return [
      ...(checked.length > 1 ? checked.sort(sortItem) : checked),
      ...unchecked.sort(sortItem)
    ];
  }

  afterUpdate(() => {
    if (checked.length !== prevChecked.length) {
      if (selectionFeedback === 'top') {
        sortedItems = sort();
      }
      prevChecked = checked;
      selectedIds = checked.map(({ id }) => id);
    }

    if (!open) {
      if (!initialSorted || selectionFeedback !== 'fixed') {
        sortedItems = sort();
        initialSorted = true;
      }

      highlightedIndex = -1;
      inputValue = '';
    }

    items = sortedItems;
  });

  $: menuId = `menu-${id}`;
  $: inline = type === 'inline';
  $: ariaLabel = $$props['aria-label'] || 'Choose an item';
  $: sortedItems = items.map(item => ({ ...item, checked: selectedIds.includes(item.id) }));
  $: checked = sortedItems.filter(({ checked }) => checked);
  $: unchecked = sortedItems.filter(({ checked }) => !checked);
  $: filteredItems = sortedItems.filter(item => filterItem(item, value));
  $: highlightedId = sortedItems[highlightedIndex] ? sortedItems[highlightedIndex].id : undefined;
  $: value = inputValue;
</script>

<svelte:body
  on:click={({ target }) => {
    if (open && multiSelectRef && !multiSelectRef.contains(target)) {
      open = false;
    }
  }} />

<div
  bind:this={multiSelectRef}
  class={cx('--multi-select__wrapper', '--list-box__wrapper', inline && '--multi-select__wrapper--inline', inline && '--list-box__wrapper--inline', inline && invalid && '--multi-select__wrapper--inline--invalid', inline && invalid && '--list-box__wrapper--inline--invalid', className)}
  {style}>
  {#if titleText}
    <label class={cx('--label', disabled && '--label--disabled')} for={id}>{titleText}</label>
  {/if}
  {#if !inline && helperText}
    <div class={cx('--form__helper-text', disabled && '--form__helper-text--disabled')}>
      {helperText}
    </div>
  {/if}
  <ListBox
    aria-label={ariaLabel}
    class={cx('--multi-select', filterable && '--combo-box', filterable && '--multi-select--filterable', invalid && '--multi-select--invalid', inline && '--multi-select--inline', checked.length > 0 && '--multi-select--selected')}
    {id}
    {disabled}
    {invalid}
    {invalidText}
    {open}
    {light}
    {size}>
    {#if invalid}
      <WarningFilled16 class={cx('--list-box__invalid-icon')} />
    {/if}
    <ListBoxField
      role="button"
      tabindex="0"
      aria-expanded={open}
      on:click={() => {
        if (filterable) {
          open = true;
          inputRef.focus();
        } else {
          open = !open;
        }
      }}
      on:keydown={({ key }) => {
        if (filterable) {
          return;
        }
        if (key === ' ') {
          open = !open;
        } else if (key === 'Tab') {
          if (selectionRef && checked.length > 0) {
            selectionRef.focus();
          } else {
            open = false;
            fieldRef.blur();
          }
        } else if (key === 'ArrowDown') {
          change(1);
        } else if (key === 'ArrowUp') {
          change(-1);
        } else if (key === 'Enter') {
          if (highlightedIndex > -1) {
            sortedItems[highlightedIndex].checked = !sortedItems[highlightedIndex].checked;
          }
        }
      }}
      on:blur={({ relatedTarget }) => {
        if (relatedTarget && relatedTarget.getAttribute('role') !== 'button') {
          fieldRef.focus();
        }
      }}
      {id}
      {disabled}
      {translateWithId}>
      {#if checked.length > 0}
        <ListBoxSelection
          selectionCount={checked.length}
          on:clear={() => {
            sortedItems = sortedItems.map(item => ({ ...item, checked: false }));
            fieldRef.blur();
          }}
          {translateWithId}
          {disabled} />
      {/if}
      {#if filterable}
        <input
          bind:this={inputRef}
          role="combobox"
          tabindex="0"
          autocomplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-activedescendant={highlightedId}
          aria-disabled={disabled}
          aria-controls={menuId}
          class={cx('--text-input', inputValue === '' && '--text-input--empty')}
          on:input={({ target }) => {
            inputValue = target.value;
          }}
          on:keydown
          on:keydown|stopPropagation={({ key }) => {
            if (key === 'Enter') {
              if (highlightedIndex > -1) {
                sortedItems[highlightedIndex].checked = !sortedItems[highlightedIndex].checked;
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
          {name}
          value={inputValue} />
        {#if invalid}
          <WarningFilled16 class={cx('--list-box__invalid-icon')} />
        {/if}
        {#if inputValue}
          <ListBoxSelection
            on:clear={() => {
              inputValue = '';
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
      {/if}
      {#if !filterable}
        <span class={cx('--list-box__label')}>{label}</span>
        <ListBoxMenuIcon {open} {translateWithId} />
      {/if}
    </ListBoxField>
    {#if open}
      <ListBoxMenu aria-label={ariaLabel} {id}>
        {#each filterable ? filteredItems : sortedItems as item, i (item.id || i)}
          <ListBoxMenuItem
            id={item.id}
            active={item.checked}
            highlighted={highlightedIndex === i}
            on:click={() => {
              sortedItems = sortedItems.map(_ =>
                _.id === item.id ? { ..._, checked: !_.checked } : _
              );
              fieldRef.focus();
            }}
            on:mouseenter={() => {
              highlightedIndex = i;
            }}>
            <Checkbox
              readonly
              tabindex="-1"
              id={`checkbox-${item.id}`}
              title={useTitleInItem ? itemToString(item) : undefined}
              name={itemToString(item)}
              labelText={itemToString(item)}
              checked={item.checked}
              {disabled} />
          </ListBoxMenuItem>
        {/each}
      </ListBoxMenu>
    {/if}
  </ListBox>
</div>
