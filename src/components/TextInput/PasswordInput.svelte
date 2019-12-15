<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let id = Math.random();
  export let labelText = '';
  export let placeholder = '';
  export let type = 'password';
  export let value = '';
  export let invalid = false;
  export let invalidText = '';
  export let helperText = '';
  export let hideLabel = false;
  export let light = false;
  export let tooltipPosition = 'bottom';
  export let tooltipAlignment = 'center';
  export let hidePasswordLabel = 'Hide password';
  export let showPasswordLabel = 'Show password';
  export let props = {};

  import { createEventDispatcher } from 'svelte';
  import WarningFilled16 from 'carbon-icons-svelte/lib/WarningFilled16';
  import View16 from 'carbon-icons-svelte/lib/View16';
  import ViewOff16 from 'carbon-icons-svelte/lib/ViewOff16';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();
  const errorId = `${id}-error`;
  const passwordIsVisible = type === 'text';
  const _labelClass = cx(
    '--label',
    hideLabel && '--visually-hidden',
    disabled && '--label--disabled'
  );
  const _helperTextClass = cx('--form__helper-text', disabled && '--form__helper-text--disabled');
  const _textInputClass = cx(
    '--text-input',
    '--password-input',
    light && '--text-input--light',
    invalid && '--text-input--invalid',
    className
  );
  const _passwordVisibilityToggleClass = cx(
    '--text-input--password__visibility__toggle',
    '--btn--icon-only',
    '--tooltip__trigger',
    '--tooltip--a11y',
    tooltipPosition && `--tooltip--${tooltipPosition}`,
    tooltipAlignment && `--tooltip--align-${tooltipAlignment}`
  );
</script>

<div class={cx('--form-item', '--text-input-wrapper', '--password-input-wrapper')}>
  {#if labelText}
    <label for={id} class={_labelClass}>{labelText}</label>
  {/if}

  {#if helperText}
    <div class={_helperTextClass}>{helperText}</div>
  {/if}
  <div class={cx('--text-input__field-wrapper')} data-invalid={invalid || undefined}>
    {#if invalid}
      <WarningFilled16 class={cx('--text-input__invalid-icon')} />
    {/if}
    <input
      {...props}
      class={_textInputClass}
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
      data-invalid={invalid || undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      {id}
      {placeholder}
      {type}
      {value}
      {disabled} />
    <button
      type="button"
      class={_passwordVisibilityToggleClass}
      on:click={() => {
        type = type === 'password' ? 'text' : 'password';
      }}>
      <span class={cx('--assistive-text')}>
        {#if passwordIsVisible}{hidePasswordLabel}{:else}{showPasswordLabel}{/if}
      </span>

      {#if passwordIsVisible}
        <ViewOff16 class={cx('--icon-visibility-off')} />
      {:else}
        <View16 class={cx('--icon-visibility-on')} />
      {/if}
    </button>
  </div>
  {#if invalid}
    <div class={cx('--form-requirement')} id={errorId}>{invalidText}</div>
  {/if}
</div>
