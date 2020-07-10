<script>
  let className = undefined;
  export { className as class };
  export let cols = 50;
  export let disabled = false;
  export let helperText = '';
  export let hideLabel = false;
  export let id = Math.random();
  export let name = Math.random();
  export let invalid = false;
  export let invalidText = '';
  export let labelText = '';
  export let light = false;
  export let placeholder = '';
  export let rows = 4;
  export let style = undefined;
  export let value = '';

  import WarningFilled16 from 'carbon-icons-svelte/lib/WarningFilled16';
  import { cx } from '../../lib';

  $: errorId = `error-${id}`;
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={cx('--form-item')} {style}>
  {#if labelText && !hideLabel}
    <label
      class={cx('--label', hideLabel && '--visually-hidden', disabled && '--label--disabled')}
      for={id}>
      {labelText}
    </label>
  {/if}
  {#if helperText}
    <div class={cx('--form__helper-text', disabled && '--form__helper-text--disabled')}>
      {helperText}
    </div>
  {/if}
  <div class={cx('--text-area__wrapper')} data-invalid={invalid || undefined}>
    {#if invalid}
      <WarningFilled16 class={cx('--text-area__invalid-icon')} />
    {/if}
    <textarea
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      class={cx('--text-area', light && '--text-area--light', invalid && '--text-area--invalid', className)}
      on:change
      on:input
      on:input={({ target }) => {
        value = target.value;
      }}
      on:focus
      on:blur
      {disabled}
      {id}
      {name}
      {cols}
      {rows}
      {value}
      {placeholder} />
  </div>
  {#if invalid}
    <div class={cx('--form-requirement')} id={errorId}>{invalidText}</div>
  {/if}
</div>
