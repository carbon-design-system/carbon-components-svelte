<script>
  let className = undefined;
  export { className as class };
  export let id = Math.random();
  export let value = '';
  export let labelText = '';
  export let hideLabel = true;
  export let iconDescription = 'Open list of options';
  export let disabled = false;
  export let style = undefined;

  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import ChevronDownGlyph from 'carbon-icons-svelte/lib/ChevronDownGlyph';
  import { cx } from '../../lib';

  let selected = writable(value);

  setContext('TimePickerSelect', { selected });

  $: selected.set(value);
  $: value = $selected;
</script>

<div
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--select', '--time-picker__select', className)}
  {style}>
  {#if labelText}
    <label class={cx('--label', hideLabel && '--visually-hidden')} for={id}>{labelText}</label>
  {/if}
  <select
    class={cx('--select-input')}
    on:change={({ target }) => {
      selected.set(target.value);
    }}
    {id}
    {disabled}
    {value}>
    <slot />
  </select>
  <ChevronDownGlyph
    aria-label={iconDescription}
    title={iconDescription}
    class={cx('--select__arrow')} />
</div>
