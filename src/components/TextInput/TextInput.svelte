<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let id = Math.random();
  export let labelText = '';
  export let placeholder = '';
  export let type = '';
  export let value = '';
  export let invalid = false;
  export let invalidText = '';
  export let helperText = '';
  export let hideLabel = false;
  export let light = false;
  export let style = undefined;

  import WarningFilled16 from 'carbon-icons-svelte/lib/WarningFilled16';
  import { cx } from '../../lib';

  $: errorId = `error-${id}`;
</script>

<div class={cx('--form-item', '--text-input-wrapper')} {style}>
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
      class={cx('--text-input', light && '--text-input--light', invalid && '--text-input--invalid', className)}
      on:click
      on:change
      on:input
      on:input={event => {
        value = event.target.value;
      }}
      data-invalid={invalid || undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      {id}
      {placeholder}
      {type}
      {value}
      {disabled} />
  </div>
  {#if invalid}
    <div class={cx('--form-requirement')} id={errorId}>{invalidText}</div>
  {/if}
</div>
