<script>
  let className = undefined;
  export { className as class };
  export let id = Math.random();
  export let toggled = false;
  export let disabled = false;
  export let labelText = undefined;
  export let labelA = 'Off';
  export let labelB = 'On';
  export let props = {};

  import { createEventDispatcher } from 'svelte';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();
  const _class = cx('--form-item', className);
  const ariaLabel = labelText ? undefined : $$props['aria-label'] || 'Toggle';
  let inputRef = undefined;

  function handleChange(event) {
    dispatch('change', event);
    dispatch('toggle', { checked: inputRef.checked, id, event });
  }

  function handleKeyUp(event) {
    if (event.key === 'Enter') {
      if (inputRef) {
        inputRef.checked = !inputRef.checked;
      }

      handleChange(event);
    }
  }
</script>

<div class={_class}>
  <input
    {...props}
    type="checkbox"
    class={cx('--toggle-input', '--toggle-input--small')}
    bind:this={inputRef}
    checked={toggled}
    {disabled}
    {id}
    on:change
    on:change={handleChange}
    on:keyup
    on:keyup={handleKeyUp} />

  <label class={cx('--toggle-input__label')} for={id} aria-label={ariaLabel}>
    {labelText}
    <span class={cx('--toggle__switch')}>
      <svg width="6" height="5" viewBox="0 0 6 5" class={cx('--toggle__check')}>
        <path d="M2.2 2.7L5 0 6 1 2.2 5 0 2.7 1 1.5z" />
      </svg>
      <span aria-hidden="true" class={cx('--toggle__text--off')}>{labelA}</span>
      <span aria-hidden="true" class={cx('--toggle__text--on')}>{labelB}</span>
    </span>
  </label>
</div>
