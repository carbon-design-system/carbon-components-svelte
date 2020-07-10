<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let hideLabel = true;
  export let iconDescription = 'Open list of options';
  export let id = Math.random();
  export let name = Math.random();
  export let labelText = '';
  export let style = undefined;
  export let value = '';

  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import ChevronDownGlyph from 'carbon-icons-svelte/lib/ChevronDownGlyph';
  import { cx } from '../../lib';

  let selectedValue = writable(value);

  setContext('TimePickerSelect', { selectedValue });

  $: selectedValue.set(value);
  $: value = $selectedValue;
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
  <!-- svelte-ignore a11y-no-onchange -->
  <select
    class={cx('--select-input')}
    on:change={({ target }) => {
      selectedValue.set(target.value);
    }}
    {id}
    {name}
    {disabled}
    {value}>
    <slot />
  </select>
  <ChevronDownGlyph
    aria-label={iconDescription}
    title={iconDescription}
    class={cx('--select__arrow')} />
</div>
