<script>
  /**
   * Set the size of the input
   * @type {"sm" | "xl"} [size]
   */
  export let size = undefined;

  /**
   * Specify the input value
   * @type {string} [value=""]
   */
  export let value = "";

  /**
   * Specify the step increment
   * @type {number} [step=1]
   */
  export let step = 1;

  /**
   * Specify the maximum value
   * @type {number} [max]
   */
  export let max = undefined;

  /**
   * Specify the minimum value
   * @type {number} [min]
   */
  export let min = undefined;

  /**
   * Set to `true` to enable the light variant
   * @type {boolean} [light=false]
   */
  export let light = false;

  /**
   * Set to `true` for the input to be read-only
   * @type {boolean} [readonly=false]
   */
  export let readonly = false;

  /**
   * Set to `true` to enable the mobile variant
   * @type {boolean} [mobile=false]
   */
  export let mobile = false;

  /**
   * Set to `true` to allow for an empty value
   * @type {boolean} [allowEmpty=false]
   */
  export let allowEmpty = false;

  /**
   * Set to `true` to disable the input
   * @type {boolean} [disabled=false]
   */
  export let disabled = false;

  /**
   * Specify the ARIA label for the increment icons
   * @type {string} [iconDescription=""]
   */
  export let iconDescription = "";

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

  /**
   * Specify the helper text
   * @type {string} [helperText=""]
   */
  export let helperText = "";

  /**
   * Specify the label text
   * @type {string} [label=""]
   */
  export let label = "";

  /**
   * Set to `true` to visually hide the label text
   * @type {boolean} [hideLabel=false]
   */
  export let hideLabel = false;

  /**
   * @typedef {"increment" | "decrement"} NumberInputTranslationId
   */

  /**
   * Override the default translation ids
   * @type {(id: NumberInputTranslationId) => string} [translateWithId = (id: NumberInputTranslationId) => string]
   */
  export let translateWithId = (id) => defaultTranslations[id];

  /**
   * Default translation ids
   * @constant
   * @type {{ increment: "increment"; decrement: "decrement" }}
   */
  export const translationIds = {
    increment: "increment",
    decrement: "decrement",
  };

  /**
   * Set an id for the input element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the input
   * @type {string} [name]
   */
  export let name = undefined;

  /**
   * Obtain a reference to the input HTML element
   * @type {null | HTMLInputElement} [ref=null]
   */
  export let ref = null;

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
