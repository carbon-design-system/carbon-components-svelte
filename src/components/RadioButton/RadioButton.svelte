<script>
  let className = undefined;
  export { className as class };
  export let checked = false;
  export let disabled = false;
  export let hideLabel = false;
  export let id = Math.random();
  export let labelPosition = 'right';
  export let labelText = '';
  export let name = '';
  export let style = undefined;
  export let value = '';

  import { getContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { cx } from '../../lib';

  const ctx = getContext('RadioButtonGroup');

  let selectedValue = ctx ? ctx.selectedValue : writable(checked ? value : undefined);

  if (ctx) {
    ctx.add({ id, checked, disabled, value });
  }

  $: checked = $selectedValue === value;
</script>

<div
  class={cx('--radio-button-wrapper', labelPosition !== 'right' && `--radio-button-wrapper--label-${labelPosition}`, className)}
  {style}>
  <input
    type="radio"
    class={cx('--radio-button')}
    on:change
    on:change={() => {
      if (ctx) {
        ctx.update(value);
      }
    }}
    {id}
    {name}
    {checked}
    {disabled}
    {value} />
  <label class={cx('--radio-button__label')} for={id}>
    <span class={cx('--radio-button__appearance')} />
    <span class={cx(hideLabel && '--visually-hidden')}>{labelText}</span>
  </label>
</div>
