<script>
  export let size = undefined; // "sm" | "xl"
  export let value = "";
  export let step = 1;
  export let max = undefined;
  export let min = undefined;

  /**
   * Set to `true` to enable the light variant
   * @type {boolean} [light=false]
   */
  export let light = false;

  export let readonly = false;
  export let mobile = false;
  export let allowEmpty = false;
  export let disabled = false;
  export let iconDescription = "";

  /**
   * Set an id for the input element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);
  export let name = undefined;

  /**
   * Set to `true` to indicate an invalid state
   * @type {boolean} [invalid=false]
   */
  export let invalid = false;

  /**
   * Specify the invalid state text
   * @type {string} [invalidText="Provide invalidText"]
   */
  export let invalidText = "";

  export let helperText = "";
  export let label = "";
  export let hideLabel = false;

  /**
   * Obtain a reference to the input HTML element
   * @type {null | HTMLElement} [ref=null]
   */
  export let ref = null;
  export let translateWithId = (id) => defaultTranslations[id];
  export const translationIds = {
    increment: "increment",
    decrement: "decrement",
  };

  import { createEventDispatcher, afterUpdate } from "svelte";
  import CaretDownGlyph from "carbon-icons-svelte/lib/CaretDownGlyph";
  import CaretUpGlyph from "carbon-icons-svelte/lib/CaretUpGlyph";
  import WarningFilled16 from "carbon-icons-svelte/lib/WarningFilled16";

  const defaultTranslations = {
    [translationIds.increment]: "Increment number",
    [translationIds.decrement]: "Decrement number",
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
    dispatch("change", value);
  });

  $: incrementLabel = translateWithId("increment");
  $: decrementLabel = translateWithId("decrement");
  $: value = Number(value);
  $: error =
    invalid || (!allowEmpty && value === "") || value > max || value < min;
  $: errorId = `error-${id}`;
  $: ariaLabel =
    $$props["aria-label"] ||
    "Numeric input field with increment and decrement buttons";
</script>

<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <div
    data-invalid={error || undefined}
    class:bx--number={true}
    class:bx--number--helpertext={true}
    class:bx--number--readonly={readonly}
    class:bx--number--light={light}
    class:bx--number--nolabel={hideLabel}
    class:bx--number--mobile={mobile}
    class={size && `bx--number--${size}`}>
    {#if mobile}
      {#if label}
        <label
          for={id}
          class:bx--label={true}
          class:bx--visually-hidden={hideLabel}>
          <slot name="label">{label}</slot>
        </label>
      {/if}
      {#if helperText}
        <div class:bx--form__helper-text={true}>{helperText}</div>
      {/if}
      <div class:bx--number__input-wrapper={true}>
        <button
          type="button"
          aria-live="polite"
          aria-atomic="true"
          title={decrementLabel}
          aria-label={decrementLabel || iconDescription}
          class:bx--number__control-btn={true}
          class:down-icon={true}
          on:click={() => {
            updateValue(-1);
          }}
          {disabled}>
          <CaretDownGlyph class="down-icon" />
        </button>
        <input
          bind:this={ref}
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
          class:bx--number__control-btn={true}
          class:up-icon={true}
          on:click={() => {
            updateValue(1);
          }}
          {disabled}>
          <CaretUpGlyph class="up-icon" />
        </button>
      </div>
    {:else}
      {#if label}
        <label
          for={id}
          class:bx--label={true}
          class:bx--visually-hidden={hideLabel}>
          <slot name="label">{label}</slot>
        </label>
      {/if}
      {#if helperText}
        <div class:bx--form__helper-text={true}>{helperText}</div>
      {/if}
      <div class:bx--number__input-wrapper={true}>
        <input
          bind:this={ref}
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
          <WarningFilled16 class="bx--number__invalid" />
        {/if}
        <div class:bx--number__controls={true}>
          <button
            type="button"
            aria-live="polite"
            aria-atomic="true"
            title={incrementLabel || iconDescription}
            aria-label={incrementLabel || iconDescription}
            class:bx--number__control-btn={true}
            class:up-icon={true}
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
            class:bx--number__control-btn={true}
            class:down-icon={true}
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
      <div id={errorId} class:bx--form-requirement={true}>{invalidText}</div>
    {/if}
  </div>
</div>
