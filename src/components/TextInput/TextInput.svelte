<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let helperText = '';
  export let hideLabel = false;
  export let id = Math.random();
  export let name = undefined;
  export let invalid = false;
  export let invalidText = '';
  export let labelText = '';
  export let light = false;
  export let placeholder = '';
  export let style = undefined;
  export let type = '';
  export let value = '';

  import WarningFilled16 from 'carbon-icons-svelte/lib/WarningFilled16';
  import { cx } from '../../lib';

  $: errorId = `error-${id}`;
</script>

<div
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--form-item', '--text-input-wrapper', className)}
  {style}>
  {#if labelText}
    <label
      for={id}
      class={cx('--label', hideLabel && '--visually-hidden', disabled && '--label--disabled')}>
      {labelText}
    </label>
  {/if}
  {#if helperText}
    <div class={cx('--form__helper-text', disabled && '--form__helper-text--disabled')}>
      {helperText}
    </div>
  {/if}
  <div class={cx('--text-input__field-wrapper')} data-invalid={invalid || undefined}>
    {#if invalid}
      <WarningFilled16 class={cx('--text-input__invalid-icon')} />
    {/if}
    <input
      data-invalid={invalid || undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      class={cx('--text-input', light && '--text-input--light', invalid && '--text-input--invalid')}
      on:change
      on:input
      on:input={({ target }) => {
        value = target.value;
      }}
      on:focus
      on:blur
      {id}
      {name}
      {placeholder}
      {type}
      {value}
      {disabled} />
  </div>
  {#if invalid}
    <div class={cx('--form-requirement')} id={errorId}>{invalidText}</div>
  {/if}
</div>
