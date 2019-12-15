<script>
  let className = undefined;
  export { className as class };
  export let checked = false;
  export let indeterminate = false;
  export let disabled = false;
  export let id = undefined;
  export let labelText = undefined;
  export let hideLabel = false;
  export let title = '';
  export let wrapperClassName = undefined;
  export { wrapperClassName as wrapperClass };
  export let props = {};

  import { createEventDispatcher } from 'svelte';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();
  const _labelClass = cx('--checkbox-label', className);
  const _innerLabelClass = cx('--checkbox-label-text', hideLabel && '--visually-hidden');
  const _wrapperClass = cx('--form-item', '--checkbox-wrapper', wrapperClassName);

  function handleChange(event) {
    dispatch('change', { checked: event.target.checked, id, event });
  }
</script>

<div class={_wrapperClass}>
  <input
    {...props}
    type="checkbox"
    class={cx('--checkbox')}
    on:change={handleChange}
    {indeterminate}
    {disabled}
    {checked}
    {id} />
  <label for={id} class={_labelClass} title={title || null}>
    <span class={_innerLabelClass}>{labelText}</span>
  </label>
</div>
