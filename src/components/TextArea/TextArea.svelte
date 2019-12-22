<script>
  let className = undefined;
  export { className as class };
  export let cols = 50;
  export let disabled = false;
  export let id = Math.random();
  export let labelText = '';
  export let placeholder = '';
  export let rows = 4;
  export let value = '';
  export let invalid = false;
  export let invalidText = '';
  export let helperText = '';
  export let hideLabel = false;
  export let light = false;
  export let style = undefined;

  import { createEventDispatcher } from 'svelte';
  import WarningFilled16 from 'carbon-icons-svelte/lib/WarningFilled16';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();
  const errorId = `${id}-error`;
  const _labelClass = cx(
    '--label',
    hideLabel && '--visually-hidden',
    disabled && '--label--disabled'
  );
  const _helperTextClass = cx('--form__helper-text', disabled && '--form__helper-text--disabled');
  const _textAreaClass = cx(
    '--text-area',
    light && '--text-area--light',
    invalid && '--text-area--invalid',
    className
  );
</script>

<div on:mouseover on:mouseenter on:mouseleave class={cx('--form-item')} {style}>
  {#if labelText && !hideLabel}
    <label for={id} class={_labelClass}>{labelText}</label>
  {/if}
  {#if helperText}
    <div class={_helperTextClass}>{helperText}</div>
  {/if}
  <div class={cx('--text-area__wrapper')} data-invalid={invalid || undefined}>
    {#if invalid}
      <WarningFilled16 class={cx('--text-area__invalid-icon')} />
    {/if}
    <textarea
      on:click={event => {
        if (!disabled) {
          dispatch('click', event);
        }
      }}
      on:change={event => {
        if (!disabled) {
          dispatch('change', event);
        }
      }}
      on:input={event => {
        value = event.target.value;
        if (!disabled) {
          dispatch('input', event);
        }
      }}
      class={_textAreaClass}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      {disabled}
      {id}
      {cols}
      {rows}
      {value}
      {placeholder}
      {value} />
  </div>
  {#if invalid}
    <div class={cx('--form-requirement')} id={errorId}>{invalidText}</div>
  {/if}
</div>
