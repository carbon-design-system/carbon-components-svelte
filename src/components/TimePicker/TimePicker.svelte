<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let hideLabel = false;
  export let id = Math.random();
  export let invalid = false;
  export let invalidText = 'Invalid time format.';
  export let labelText = '';
  export let light = false;
  export let maxlength = 5;
  export let pattern = '(1[012]|[1-9]):[0-5][0-9](\\s)?';
  export let placeholder = 'hh=mm';
  export let style = undefined;
  export let type = 'text';
  export let value = '';

  import { cx } from '../../lib';
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={cx('--form-item', className)} {style}>
  <div class={cx('--time-picker', light && '--time-picker--light', light && '--select--light')}>
    <div class={cx('--time-picker__input')}>
      {#if labelText}
        <label
          class={cx('--label', hideLabel && '--visually-hidden', disabled && '--label--disabled')}
          for={id}>
          {labelText}
        </label>
      {/if}
      <input
        data-invalid={invalid || undefined}
        class={cx('--time-picker__input-field', '--text-input', light && '--text-input--light', invalid && '--text-input--invalid')}
        on:change
        on:input
        on:input={({ target }) => {
          value = target.value;
        }}
        on:focus
        on:blur
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
