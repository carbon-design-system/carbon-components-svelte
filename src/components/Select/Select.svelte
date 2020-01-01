<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let helperText = '';
  export let hideLabel = false;
  export let id = Math.random();
  export let inline = false;
  export let invalid = false;
  export let invalidText = '';
  export let labelText = '';
  export let light = false;
  export let noLabel = false;
  export let selected = undefined;
  export let style = undefined;

  import { createEventDispatcher, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import ChevronDown16 from 'carbon-icons-svelte/lib/ChevronDown16';
  import WarningFilled16 from 'carbon-icons-svelte/lib/WarningFilled16';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  let selectedValue = writable(selected);

  setContext('Select', { selectedValue });

  $: errorId = `error-${id}`;
  $: selected = $selectedValue;
  $: {
    dispatch('change', $selectedValue);
  }
</script>

<div class={cx('--form-item')} {style}>
  <div
    class={cx('--select', inline && '--select--inline', light && '--select--light', invalid && '--select--invalid', disabled && '--select--disabled', className)}>
    {#if !noLabel}
      <label
        for={id}
        class={cx('--label', hideLabel && '--visually-hidden', disabled && '--label--disabled')}>
        {labelText}
      </label>
    {/if}
    {#if !inline && helperText}
      <div class={cx('--form__helper-text', disabled && '--form__helper-text--disabled')}>
        {helperText}
      </div>
    {/if}
    {#if inline}
      <div class={cx('--select-input--inline__wrapper')}>
        <div class={cx('--select-input__wrapper')} data-invalid={invalid || undefined}>
          <select
            class={cx('--select-input')}
            aria-describedby={invalid ? errorId : undefined}
            disabled={disabled || undefined}
            aria-invalid={invalid || undefined}
            on:change={({ target }) => {
              selectedValue.set(target.value);
            }}
            {id}>
            <slot />
          </select>
          <ChevronDown16 class={cx('--select__arrow')} />
          {#if invalid}
            <WarningFilled16 class={cx('--select__invalid-icon')} />
          {/if}
        </div>
        {#if invalid}
          <div class={cx('--form-requirement')} id={errorId}>{invalidText}</div>
        {/if}
      </div>
      {#if helperText}
        <div class={cx('--form__helper-text', disabled && '--form__helper-text--disabled')}>
          {helperText}
        </div>
      {/if}
    {/if}
    {#if !inline}
      <div class={cx('--select-input__wrapper')} data-invalid={invalid || undefined}>
        <select
          class={cx('--select-input')}
          aria-describedby={invalid ? errorId : undefined}
          disabled={disabled || undefined}
          aria-invalid={invalid || undefined}
          on:change
          on:change={({ target }) => {
            selectedValue.set(target.value);
          }}
          {id}>
          <slot />
        </select>
        <ChevronDown16 class={cx('--select__arrow')} />
        {#if invalid}
          <WarningFilled16 class={cx('--select__invalid-icon')} />
        {/if}
      </div>
      {#if invalid}
        <div class={cx('--form-requirement')} id={errorId}>{invalidText}</div>
      {/if}
    {/if}
  </div>
</div>
