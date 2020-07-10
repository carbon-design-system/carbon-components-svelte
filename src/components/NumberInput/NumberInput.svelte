<script>
  let className = undefined;
  export { className as class };
  export const translationIds = { increment: 'increment', decrement: 'decrement' };
  export let allowEmpty = false;
  export let disabled = false;
  export let helperText = '';
  export let hideLabel = false;
  export let iconDescription = '';
  export let id = Math.random();
  export let name = undefined;
  export let invalid = false;
  export let invalidText = 'Provide invalidText';
  export let mobile = false;
  export let label = '';
  export let light = false;
  export let max = undefined;
  export let min = undefined;
  export let readonly = false;
  export let step = 1;
  export let style = undefined;
  export let translateWithId = id => defaultTranslations[id];
  export let value = '';

  import { createEventDispatcher, afterUpdate } from 'svelte';
  import CaretDownGlyph from 'carbon-icons-svelte/lib/CaretDownGlyph';
  import CaretUpGlyph from 'carbon-icons-svelte/lib/CaretUpGlyph';
  import WarningFilled16 from 'carbon-icons-svelte/lib/WarningFilled16';
  import { cx } from '../../lib';

  const defaultTranslations = {
    [translationIds.increment]: 'Increment number',
    [translationIds.decrement]: 'Decrement number'
  };

  const dispatch = createEventDispatcher();

  function updateValue(direction) {
    const nextValue = (value += direction * step);

    if (nextValue < min) {
      value = min;
    } else if (nextValue > max) {
      value = max;
    } else {
      value = nextValue;
    }
  }

  afterUpdate(() => {
    dispatch('change', value);
  });

  $: incrementLabel = translateWithId('increment');
  $: decrementLabel = translateWithId('decrement');
  $: value = Number(value);
  $: error = invalid || (!allowEmpty && value === '') || value > max || value < min;
  $: errorId = `error-${id}`;
  $: ariaLabel =
    $$props['aria-label'] || 'Numeric input field with increment and decrement buttons';
</script>

<div on:click on:mouseover on:mouseenter on:mouseleave class={cx('--form-item', className)} {style}>
  <div
    data-invalid={error || undefined}
    class={cx('--number', '--number--helpertext', readonly && '--number--readonly', light && '--number--light', hideLabel && '--number--nolabel', mobile && '--number--mobile')}>
    {#if mobile}
      {#if label}
        <label class={cx('--label', hideLabel && '--visually-hidden')} for={id}>
          <slot name="label">{label}</slot>
        </label>
      {/if}
      {#if helperText}
        <div class={cx('--form__helper-text')}>{helperText}</div>
      {/if}
      <div class={cx('--number__input-wrapper')}>
        <button
          type="button"
          aria-live="polite"
          aria-atomic="true"
          title={decrementLabel}
          aria-label={decrementLabel || iconDescription}
          class={cx('--number__control-btn', 'down-icon')}
          on:click={() => {
            updateValue(-1);
          }}
          {disabled}>
          <CaretDownGlyph class="down-icon" />
        </button>
        <input
          type="number"
          pattern="[0-9]*"
          aria-label={label ? undefined : ariaLabel}
          on:input
          on:input={({ target }) => {
            value = target.value;
          }}
          {disabled}
          {id}
          {name}
          {max}
          {min}
          {step}
          {value}
          {readonly} />
        <button
          type="button"
          aria-live="polite"
          aria-atomic="true"
          title={incrementLabel}
          aria-label={incrementLabel || iconDescription}
          class={cx('--number__control-btn', 'up-icon')}
          on:click={() => {
            updateValue(1);
          }}
          {disabled}>
          <CaretUpGlyph class="up-icon" />
        </button>
      </div>
    {:else}
      {#if label}
        <label class={cx('--label', hideLabel && '--visually-hidden')} for={id}>
          <slot name="label">{label}</slot>
        </label>
      {/if}
      {#if helperText}
        <div class={cx('--form__helper-text')}>{helperText}</div>
      {/if}
      <div class={cx('--number__input-wrapper')}>
        <input
          type="number"
          pattern="[0-9]*"
          aria-describedby={errorId}
          data-invalid={invalid || undefined}
          aria-invalid={invalid || undefined}
          aria-label={label ? undefined : ariaLabel}
          on:input
          on:input={({ target }) => {
            value = target.value;
          }}
          {disabled}
          {id}
          {max}
          {min}
          {step}
          {value}
          {readonly} />
        {#if invalid}
          <WarningFilled16 class={cx('--number__invalid')} />
        {/if}
        <div class={cx('--number__controls')}>
          <button
            type="button"
            aria-live="polite"
            aria-atomic="true"
            title={incrementLabel || iconDescription}
            aria-label={incrementLabel || iconDescription}
            class={cx('--number__control-btn', 'up-icon')}
            on:click={() => {
              updateValue(1);
            }}
            {disabled}>
            <CaretUpGlyph class="up-icon" />
          </button>
          <button
            type="button"
            aria-live="polite"
            aria-atomic="true"
            title={decrementLabel || iconDescription}
            aria-label={decrementLabel || iconDescription}
            class={cx('--number__control-btn', 'down-icon')}
            on:click={() => {
              updateValue(-1);
            }}
            {disabled}>
            <CaretDownGlyph class="down-icon" />
          </button>
        </div>
      </div>
    {/if}
    {#if error}
      <div class={cx('--form-requirement')} id={errorId}>{invalidText}</div>
    {/if}
  </div>
</div>
