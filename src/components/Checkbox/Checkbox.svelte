<script>
  let className = undefined;
  export { className as class };
  export let checked = false;
  export let disabled = false;
  export let hideLabel = false;
  export let id = Math.random();
  export let indeterminate = false;
  export let labelText = '';
  export let name = '';
  export let readonly = false;
  export let style = undefined;
  export let title = '';

  import { createEventDispatcher } from 'svelte';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  $: {
    dispatch('check', checked);
  }
</script>

<div
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--form-item', '--checkbox-wrapper', className)}
  {style}>
  <input
    type="checkbox"
    class={cx('--checkbox')}
    on:change
    on:change={() => {
      checked = !checked;
    }}
    {indeterminate}
    {disabled}
    {checked}
    {name}
    {id}
    {readonly} />
  <label class={cx('--checkbox-label')} for={id} title={title || undefined}>
    <span class={cx('--checkbox-label-text', hideLabel && '--visually-hidden')}>{labelText}</span>
  </label>
</div>
