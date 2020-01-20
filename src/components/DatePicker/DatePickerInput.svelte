<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let hideLabel = false;
  export let iconDescription = '';
  export let id = Math.random();
  export let invalid = false;
  export let invalidText = '';
  export let labelText = '';
  export let pattern = '\\d{1,2}\\/\\d{1,2}\\/\\d{4}';
  export let placeholder = '';
  export let style = undefined;
  export let type = 'text';

  import { getContext, onMount } from 'svelte';
  import Calendar16 from 'carbon-icons-svelte/lib/Calendar16';
  import { cx } from '../../lib';

  const {
    range,
    add,
    hasCalendar,
    declareRef,
    updateValue,
    blurInput,
    openCalendar,
    focusCalendar,
    inputValue
  } = getContext('DatePicker');

  let inputRef = undefined;

  add({ id, labelText });

  onMount(() => {
    declareRef({ id, ref: inputRef });
  });
</script>

<div
  class={cx('--date-picker-container', !labelText && '--date-picker--nolabel', className)}
  {style}>
  {#if labelText}
    <label
      class={cx('--label', hideLabel && '--visually-hidden', disabled && '--label--disabled')}
      for={id}>
      {labelText}
    </label>
  {/if}
  <div class={cx('--date-picker-input__wrapper')}>
    <input
      bind:this={inputRef}
      data-invalid={invalid || undefined}
      class={cx('--date-picker__input')}
      on:input
      on:input={({ target }) => {
        updateValue({ type: 'input', value: target.value });
      }}
      on:change={({ target }) => {
        updateValue({ type: 'change', value: target.value });
      }}
      on:keydown
      on:keydown={({ key }) => {
        if (key === 'ArrowDown') {
          focusCalendar();
        }
      }}
      on:blur
      on:blur={({ relatedTarget }) => {
        blurInput(relatedTarget);
      }}
      {id}
      {placeholder}
      {type}
      {pattern}
      {disabled}
      value={!$range ? $inputValue : undefined} />
    {#if $hasCalendar}
      <Calendar16
        role="img"
        class={cx('--date-picker__icon')}
        aria-label={iconDescription}
        title={iconDescription}
        on:click={openCalendar} />
    {/if}
  </div>
  {#if invalid}
    <div class={cx('--form-requirement')}>{invalidText}</div>
  {/if}
</div>
