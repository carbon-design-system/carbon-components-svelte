<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let id = Math.random();
  export let labelA = 'Off';
  export let labelB = 'On';
  export let labelText = '';
  export let style = undefined;
  export let toggled = false;

  import { cx } from '../../lib';
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={cx('--form-item', className)} {style}>
  <input
    type="checkbox"
    class={cx('--toggle-input', '--toggle-input--small')}
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
    on:focus
    on:blur
    {disabled}
    {id} />
  <label
    aria-label={labelText ? undefined : $$props['aria-label'] || 'Toggle'}
    class={cx('--toggle-input__label')}
    for={id}>
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
