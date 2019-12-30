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
  export let style = undefined;

  import WarningFilled16 from 'carbon-icons-svelte/lib/WarningFilled16';
  import View16 from 'carbon-icons-svelte/lib/View16';
  import ViewOff16 from 'carbon-icons-svelte/lib/ViewOff16';
  import { cx } from '../../lib';

  $: errorId = `error-${id}`;
</script>

<div
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--form-item', '--text-input-wrapper', '--password-input-wrapper', className)}
  {style}>
  {#if labelText}
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
  <div class={cx('--text-input__field-wrapper')} data-invalid={invalid || undefined}>
    {#if invalid}
      <WarningFilled16 class={cx('--text-input__invalid-icon')} />
    {/if}
    <input
      data-invalid={invalid || undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      class={cx('--text-input', '--password-input', light && '--text-input--light', invalid && '--text-input--invalid')}
      on:change
      on:input
      on:input={({ target }) => {
        value = target.value;
      }}
      on:focus
      on:blur
      {id}
      {placeholder}
      {type}
      {value}
      {disabled} />
    <button
      type="button"
      class={cx('--text-input--password__visibility__toggle', '--btn--icon-only', '--tooltip__trigger', '--tooltip--a11y', tooltipPosition && `--tooltip--${tooltipPosition}`, tooltipAlignment && `--tooltip--align-${tooltipAlignment}`)}
      on:click={() => {
        type = type === 'password' ? 'text' : 'password';
      }}>
      <span class={cx('--assistive-text')}>
        {#if type === 'text'}{hidePasswordLabel}{:else}{showPasswordLabel}{/if}
      </span>
      {#if type === 'text'}
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
