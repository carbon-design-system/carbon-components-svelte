<script>
  /**
   * @typedef {"increment" | "decrement"} NumberInputTranslationId
   * @event {null | number} change
   * @event {null | number} input
   */

  /**
   * Set the size of the input.
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /**
   * Specify the input value.
   * Use `null` to denote "no value".
   * @type {null | number}
   */
  export let value = null;

  /** Specify the step increment */
  export let step = 1;

  /**
   * Specify the maximum value.
   * @type {number}
   */
  export let max = undefined;

  /**
   * Specify the minimum value.
   * @type {number}
   */
  export let min = undefined;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` for the input to be read-only */
  export let readonly = false;

  /** Set to `true` to allow for an empty value */
  export let allowEmpty = false;

  /**
   * Set to `true` to preserve decimal input formatting.
   * When enabled, uses type="text" with inputmode="decimal" instead of type="number".
   * @type {boolean}
   * @example
   * ```svelte
   * <NumberInput allowDecimal={true} value="1.0" />
   * <NumberInput allowDecimal={true} value="2.00" />
   * ```
   */
  export let allowDecimal = false;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Set to `true` to hide the input stepper buttons */
  export let hideSteppers = false;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Specify the helper text */
  export let helperText = "";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Override the default translation ids.
   * @type {(id: NumberInputTranslationId) => string}
   */
  export let translateWithId = (id) => defaultTranslations[id];

  /**
   * Default translation ids.
   * @type {{ increment: "increment"; decrement: "decrement" }}
   */
  export const translationIds = {
    increment: "increment",
    decrement: "decrement",
  };

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the input.
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import Add from "../icons/Add.svelte";
  import EditOff from "../icons/EditOff.svelte";
  import Subtract from "../icons/Subtract.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";

  const defaultTranslations = {
    [translationIds.increment]: "Increment number",
    [translationIds.decrement]: "Decrement number",
  };

  const dispatch = createEventDispatcher();

  function updateValue(isIncrementing) {
    if (allowDecimal) {
      const currentValue = value ?? 0;
      let newValue;

      if (isIncrementing) {
        newValue = currentValue + step;
        if (max !== undefined && newValue > max) {
          newValue = max;
        }
      } else {
        newValue = currentValue - step;
        if (min !== undefined && newValue < min) {
          newValue = min;
        }
      }

      // Round to avoid floating point precision issues.
      const decimalPlaces = step.toString().split(".")[1]?.length || 0;
      newValue = Number(newValue.toFixed(decimalPlaces));

      value = newValue;
      inputValue = newValue.toString();

      dispatch("input", value);
      dispatch("change", value);
    } else {
      if (isIncrementing) {
        ref.stepUp();
      } else {
        ref.stepDown();
      }
      value = +ref.value;

      dispatch("input", value);
      dispatch("change", value);
    }
  }

  $: incrementLabel = translateWithId("increment");
  $: decrementLabel = translateWithId("decrement");
  $: hasError = invalid && invalidText && !readonly;
  $: errorId = `error-${id}`;
  $: ariaLabel =
    $$props["aria-label"] ||
    "Numeric input field with increment and decrement buttons";

  let inputValue = value?.toString() ?? "";

  // Only use inputValue tracking in allowDecimal mode
  $: if (allowDecimal) {
    if (value != null) {
      const valueStr = value.toString();
      // Only update inputValue if it's not the same numeric value
      // This allows "1.0" to stay as "1.0" while value is 1
      if (parse(inputValue) !== value) {
        inputValue = valueStr;
      }
    } else if (value == null && inputValue !== "") {
      inputValue = "";
    }
  }

  function parse(raw) {
    if (raw === "" || raw === "-") return null;
    const num = Number(raw);
    return Number.isNaN(num) ? null : num;
  }

  function onInput({ target }) {
    if (allowDecimal) {
      inputValue = target.value;
      value = parse(target.value);
    } else {
      value = parse(target.value);
    }

    dispatch("input", value);
  }

  function onChange({ target }) {
    dispatch("change", parse(target.value));
  }

  function onKeyDown(event) {
    if (
      allowDecimal &&
      (event.key === "ArrowUp" || event.key === "ArrowDown")
    ) {
      event.preventDefault();
      updateValue(event.key === "ArrowUp");
    }
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div
    data-invalid={hasError || undefined}
    class:bx--number={true}
    class:bx--number--helpertext={true}
    class:bx--number--readonly={readonly}
    class:bx--number--light={light}
    class:bx--number--nolabel={hideLabel}
    class:bx--number--nosteppers={hideSteppers}
    class:bx--number--sm={size === "sm"}
    class:bx--number--xl={size === "xl"}
  >
    {#if $$slots.labelText || labelText}
      <label
        for={id}
        class:bx--label={true}
        class:bx--label--disabled={disabled}
        class:bx--visually-hidden={hideLabel}
      >
        <slot name="labelText">{labelText}</slot>
      </label>
    {/if}
    <div
      class:bx--number__input-wrapper={true}
      class:bx--number__input-wrapper--warning={!invalid && warn}
    >
      {#if allowDecimal}
        <input
          bind:this={ref}
          bind:value={inputValue}
          type="text"
          inputmode="decimal"
          aria-describedby={errorId}
          data-invalid={hasError || undefined}
          aria-invalid={hasError || undefined}
          aria-label={labelText ? undefined : ariaLabel}
          {disabled}
          {id}
          {name}
          {readonly}
          {...$$restProps}
          on:change={onChange}
          on:input={onInput}
          on:keydown={onKeyDown}
          on:keydown
          on:keyup
          on:focus
          on:blur
          on:paste
        />
      {:else}
        <input
          bind:this={ref}
          type="number"
          pattern="[0-9]*"
          aria-describedby={errorId}
          data-invalid={hasError || undefined}
          aria-invalid={hasError || undefined}
          aria-label={labelText ? undefined : ariaLabel}
          {disabled}
          {id}
          {name}
          {max}
          {min}
          {step}
          value={value ?? ""}
          {readonly}
          {...$$restProps}
          on:change={onChange}
          on:input={onInput}
          on:keydown={onKeyDown}
          on:keydown
          on:keyup
          on:focus
          on:blur
          on:paste
        />
      {/if}
      {#if readonly}
        <EditOff class="bx--text-input__readonly-icon" />
      {:else}
        {#if invalid}
          <WarningFilled class="bx--number__invalid" />
        {/if}
        {#if !invalid && warn}
          <WarningAltFilled
            class="bx--number__invalid bx--number__invalid--warning"
          />
        {/if}
      {/if}
      {#if !hideSteppers}
        <div class:bx--number__controls={true}>
          <button
            type="button"
            tabindex="-1"
            title={decrementLabel}
            aria-label={decrementLabel}
            class:bx--number__control-btn={true}
            class:down-icon={true}
            on:click={() => {
              updateValue(false);
            }}
            {disabled}
          >
            <Subtract class="down-icon" />
          </button>
          <div class:bx--number__rule-divider={true}></div>
          <button
            type="button"
            tabindex="-1"
            title={incrementLabel}
            aria-label={incrementLabel}
            class:bx--number__control-btn={true}
            class:up-icon={true}
            on:click={() => {
              updateValue(true);
            }}
            {disabled}
          >
            <Add class="up-icon" />
          </button>
          <div class:bx--number__rule-divider={true}></div>
        </div>
      {/if}
    </div>
    {#if !hasError && !warn && helperText}
      <div
        class:bx--form__helper-text={true}
        class:bx--form__helper-text--disabled={disabled}
      >
        {helperText}
      </div>
    {/if}
    {#if hasError}
      <div id={errorId} class:bx--form-requirement={true}>
        {invalidText}
      </div>
    {/if}
    {#if !hasError && warn}
      <div id={errorId} class:bx--form-requirement={true}>{warnText}</div>
    {/if}
  </div>
</div>
