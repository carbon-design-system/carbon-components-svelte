<script>
  let className = undefined;
  export { className as class };
  export let id = Math.random();
  export let inline = false;
  export let labelText = '';
  export let disabled = false;
  export let defaultValue = undefined;
  export let hideLabel = false;
  export let invalid = false;
  export let invalidText = '';
  export let helperText = '';
  export let light = false;
  export let noLabel = false;
  export let style = undefined;

  import { createEventDispatcher, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import ChevronDown16 from 'carbon-icons-svelte/lib/ChevronDown16';
  import WarningFilled16 from 'carbon-icons-svelte/lib/WarningFilled16';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();
  const errorId = `error-${id}`;
  const _class = cx(
    '--select',
    inline && '--select--inline',
    light && '--select--light',
    invalid && '--select--invalid',
    disabled && '--select--disabled',
    className
  );
  const _labelClass = cx(
    '--label',
    hideLabel && '--visually-hidden',
    disabled && '--label--disabled'
  );
  const _helperTextClass = cx('--form__helper-text', disabled && '--form__helper-text--disabled');

  let selected = writable(defaultValue);

  setContext('Select', { selected });

  $: {
    defaultValue = $selected;
    dispatch('change', $selected);
  }
</script>

<div class={cx('--form-item')} {style}>
  <div class={_class}>
    {#if !noLabel}
      <label for={id} class={_labelClass}>{labelText}</label>
    {/if}
    {#if !inline && helperText}
      <div class={_helperTextClass}>{helperText}</div>
    {/if}
    {#if inline}
      <div class={cx('--select-input--inline__wrapper')}>
        <div class={cx('--select-input__wrapper')} data-invalid={invalid || undefined}>
          <select
            class={cx('--select-input')}
            aria-describedby={invalid ? errorId : undefined}
            disabled={disabled || undefined}
            aria-invalid={invalid || undefined}
            on:change={event => {
              selected.set(event.target.value);
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
        <div class={_helperTextClass}>{helperText}</div>
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
          on:change={event => {
            selected.set(event.target.value);
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
