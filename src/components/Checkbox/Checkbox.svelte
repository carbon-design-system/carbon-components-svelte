<script>
  let className = undefined;
  export { className as class };
  export let checked = false;
  export let indeterminate = false;
  export let disabled = false;
  export let id = Math.random();
  export let labelText = undefined;
  export let hideLabel = false;
  export let title = '';
  export let wrapperClassName = undefined;
  export { wrapperClassName as wrapperClass };
  export let style = undefined;

  import { createEventDispatcher } from 'svelte';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();
  const _labelClass = cx('--checkbox-label', className);
  const _innerLabelClass = cx('--checkbox-label-text', hideLabel && '--visually-hidden');
  const _wrapperClass = cx('--form-item', '--checkbox-wrapper', wrapperClassName);

  let inputRef = undefined;

  $: {
    dispatch('check', { id, checked });

    if (inputRef) {
      inputRef.checked = checked;
    }
  }
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={_wrapperClass} {style}>
  <input
    bind:this={inputRef}
    type="checkbox"
    class={cx('--checkbox')}
    on:change
    on:change={() => {
      checked = !checked;
    }}
    {indeterminate}
    {disabled}
    {checked}
    {id} />
  <label for={id} class={_labelClass} title={title || null}>
    <span class={_innerLabelClass}>{labelText}</span>
  </label>
</div>
