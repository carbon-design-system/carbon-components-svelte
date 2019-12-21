<script>
  let className = undefined;
  export { className as class };
  export let id = Math.random();
  export let toggled = false;
  export let disabled = false;
  export let labelText = undefined;
  export let labelA = 'Off';
  export let labelB = 'On';
  export let style = undefined;

  import { createEventDispatcher } from 'svelte';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();
  const _class = cx('--form-item', className);
  const ariaLabel = labelText ? undefined : $$props['aria-label'] || 'Toggle';

  let inputRef = undefined;

  $: {
    dispatch('toggle', { id, toggled });

    if (inputRef) {
      inputRef.checked = toggled;
    }
  }
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={_class} {style}>
  <input
    bind:this={inputRef}
    type="checkbox"
    class={cx('--toggle-input')}
    checked={toggled}
    on:change
    on:change={() => {
      toggled = !toggled;
    }}
    on:keyup
    on:keyup={event => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        toggled = !toggled;
      }
    }}
    {disabled}
    {id} />
  <label class={cx('--toggle-input__label')} for={id} aria-label={ariaLabel}>
    {labelText}
    <span class={cx('--toggle__switch')}>
      <span aria-hidden="true" class={cx('--toggle__text--off')}>{labelA}</span>
      <span aria-hidden="true" class={cx('--toggle__text--on')}>{labelB}</span>
    </span>
  </label>
</div>
