<script>
  let className = undefined;
  export { className as class };
  export let id = Math.random();
  export let value = '';
  export let labelText = '';
  export let hideLabel = false;
  export let type = 'text';
  export let pattern = '(1[012]|[1-9]):[0-5][0-9](\\s)?';
  export let placeholder = 'hh=mm';
  export let maxlength = 5;
  export let invalidText = 'Invalid time format.';
  export let invalid = false;
  export let disabled = false;
  export let light = false;
  export let style = undefined;

  import { createEventDispatcher } from 'svelte';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={cx('--form-item', className)} {style}>
  <div class={cx('--time-picker', light && '--time-picker--light', light && '--select--light')}>
    <div class={cx('--time-picker__input')}>
      {#if labelText}
        <label
          for={id}
          class={cx('--label', hideLabel && '--visually-hidden', disabled && '--label--disabled')}>
          {labelText}
        </label>
      {/if}
      <input
        data-invalid={invalid || undefined}
        class={cx('--time-picker__input-field', '--text-input', light && '--text-input--light', invalid && '--text-input--invalid')}
        on:input
        on:input={({ target }) => {
          value = target.value;
        }}
        {pattern}
        {placeholder}
        {maxlength}
        {id}
        {type}
        {value}
        {disabled} />

    </div>
    <slot />
  </div>
  {#if invalid}
    <div class={cx('--form-requirement')}>{invalidText}</div>
  {/if}
</div>
