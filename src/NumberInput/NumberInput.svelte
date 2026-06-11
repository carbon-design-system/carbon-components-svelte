<script>
  /**
   * @typedef {"increment" | "decrement"} NumberInputTranslationId
   * @event {null | number} change
   * @event {null | number} input
   * @event {{ value: null | number, direction: "up" | "down" }} click:stepper
   * @event {{ event: FocusEvent, value: null | number }} blur
   * @event {{ event: FocusEvent, value: null | number, direction: "up" | "down" }} blur:stepper
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
   * @bindable writable
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

  /**
   * Provide the value stepping should begin at when the input is empty.
   * @type {number}
   */
  export let stepStartValue = undefined;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` for the input to be read-only */
  export let readonly = false;

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   */
  export let fluid = false;

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

  /**
   * Specify a BCP 47 locale for number formatting.
   * When set, forces type="text" with inputmode="decimal"
   * and formats the display value using Intl.NumberFormat.
   * @type {string}
   * @example
   * ```svelte
   * <NumberInput locale="de-DE" value={1234.5} />
   * <NumberInput locale="en-US" value={1234.5} />
   * ```
   */
  export let locale = undefined;

  /**
   * Specify Intl.NumberFormat options when `locale` is set.
   * @type {Intl.NumberFormatOptions}
   * @example
   * ```svelte
   * <NumberInput locale="en-US" formatOptions={{ minimumFractionDigits: 2 }} value={1234.5} />
   * ```
   */
  export let formatOptions = undefined;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Set to `true` to hide the input stepper buttons */
  export let hideSteppers = false;

  /** Set to `true` to prevent the scroll wheel from changing the input value */
  export let disableWheel = false;

  /**
   * Custom validation function.
   * Receives the current raw input string and locale.
   * Return `true` to force valid, `false` to force invalid,
   * or `undefined` to defer to built-in validation.
   * @type {(value: string, locale: string | undefined) => boolean | undefined}
   * @example
   * ```svelte
   * <NumberInput validate={(raw) => Number(raw) % 2 === 0} invalidText="Must be even" />
   * ```
   */
  export let validate = undefined;

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
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Specify a name attribute for the input.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, getContext } from "svelte";
  import Add from "../icons/Add.svelte";
  import EditOff from "../icons/EditOff.svelte";
  import Subtract from "../icons/Subtract.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import {
    clamp,
    getDefaultValue,
    parse,
    parseLocaleValue,
    roundToStep,
  } from "../utils/numericFormat.js";

  const defaultTranslations = {
    [translationIds.increment]: "Increment number",
    [translationIds.decrement]: "Decrement number",
  };

  const dispatch = createEventDispatcher();
  const formContext = getContext("carbon:Form");

  function updateValue(isIncrementing) {
    // When the input is empty (null) or zero and stepStartValue is set,
    // jump directly to stepStartValue on the first step.
    if ((value === null || value === 0) && stepStartValue !== undefined) {
      value = stepStartValue;
      if (useTextMode) {
        inputValue = formatter ? formatter.format(value) : value.toString();
      } else if (ref) {
        ref.value = value.toString();
      }
      dispatch("input", value);
      dispatch("change", value);
      return;
    }

    if (useTextMode) {
      const currentValue = value ?? getDefaultValue(stepStartValue, min);
      const newValue = roundToStep(
        isIncrementing
          ? clamp(currentValue + step, undefined, max)
          : clamp(currentValue - step, min, undefined),
        step,
      );

      value = newValue;
      inputValue = formatter ? formatter.format(newValue) : newValue.toString();

      dispatch("input", value);
      dispatch("change", value);
    } else {
      // When allowEmpty is false and value is null, set to default value first
      if (!allowEmpty && value === null) {
        const defaultValue = getDefaultValue(stepStartValue, min);
        if (ref) {
          ref.value = defaultValue.toString();
        }
        value = defaultValue;
      }

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
  $: autoInvalid =
    value !== null &&
    ((min !== undefined && value < min) || (max !== undefined && value > max));
  $: formatter = locale ? new Intl.NumberFormat(locale, formatOptions) : null;
  $: useTextMode = allowDecimal || !!locale;
  $: separatorParts = locale
    ? new Intl.NumberFormat(locale).formatToParts(12345.6)
    : null;
  $: groupSeparator = separatorParts
    ? (separatorParts.find((p) => p.type === "group")?.value ?? "")
    : "";
  $: decimalSeparator = separatorParts
    ? (separatorParts.find((p) => p.type === "decimal")?.value ?? ".")
    : ".";

  let inputValue = value?.toString() ?? "";
  let prevValue;
  let userInputActive = false;

  $: customValid =
    typeof validate === "function"
      ? validate(useTextMode ? inputValue : String(value ?? ""), locale)
      : undefined;
  $: effectiveInvalid =
    (() => {
      if (invalid) return true;
      if (customValid === false) return true;
      if (customValid === true) return false;
      return autoInvalid;
    })() && !readonly;
  // Invalid/warn states are suppressed when the input is disabled or read-only.
  // `effectiveInvalid` already excludes read-only.
  $: showInvalid = effectiveInvalid && !disabled;
  $: showWarn = warn && !effectiveInvalid && !disabled && !readonly;
  $: isFluid = fluid || !!formContext?.isFluid;
  $: hasErrorMessage = showInvalid && !!invalidText;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
  $: helperId = `helper-${id}`;
  $: ariaLabel =
    $$props["aria-label"] ||
    "Numeric input field with increment and decrement buttons";

  // Only use inputValue tracking in text mode (allowDecimal or locale).
  // During user typing, don't interfere with inputValue — formatting
  // happens on blur (onChange) and programmatic changes only.
  $: if (useTextMode) {
    const valueChanged = value !== prevValue;
    prevValue = value;

    if (userInputActive) {
      // Don't interfere with user typing
    } else if (value != null) {
      const valueStr = formatter ? formatter.format(value) : value.toString();
      const parsedInput = locale
        ? parseLocaleValue(inputValue, groupSeparator, decimalSeparator)
        : parse(inputValue);
      // Sync inputValue to value when:
      // - The numeric values differ AND input is valid (preserves "1.0" formatting)
      // - OR value changed programmatically (force sync even if input is temporarily invalid)
      // This allows "1.5." to stay visible while user corrects their typo.
      if ((parsedInput !== value && parsedInput !== null) || valueChanged) {
        inputValue = valueStr;
      }
    } else if (value == null && inputValue !== "") {
      inputValue = "";
    }
  }

  function onInput(event) {
    if (useTextMode) {
      userInputActive = true;
      inputValue = event.target.value;
      const parsed = locale
        ? parseLocaleValue(event.target.value, groupSeparator, decimalSeparator)
        : parse(event.target.value);
      // Preserve last valid value when input is invalid (e.g., "1.5." with two decimals).
      // This provides better UX by letting users see and correct typos without losing data.
      if (
        parsed !== null ||
        event.target.value === "" ||
        event.target.value === "-"
      ) {
        value = parsed;
      }
    } else {
      value = parse(event.target.value);
    }

    dispatch("input", value);
  }

  function onChange(event) {
    userInputActive = false;
    let parsedValue = locale
      ? parseLocaleValue(event.target.value, groupSeparator, decimalSeparator)
      : parse(event.target.value, useTextMode);

    // If allowEmpty is false and value would be null, use default value
    // This prevents the input from staying empty when allowEmpty is false
    if (!allowEmpty && parsedValue === null && event.target.value === "") {
      parsedValue = getDefaultValue(stepStartValue, min);
      // Update the input to show the default value
      if (useTextMode) {
        inputValue = formatter
          ? formatter.format(parsedValue)
          : parsedValue.toString();
        value = parsedValue;
      } else if (ref) {
        ref.value = parsedValue.toString();
        value = parsedValue;
      }
    } else if (
      useTextMode &&
      parsedValue === null &&
      event.target.value !== "" &&
      value !== null
    ) {
      // In text mode, normalize invalid input (e.g., "1.5.") back to
      // the last valid value on blur. This provides a clean UX where typos
      // are corrected when the user leaves the field.
      inputValue = formatter ? formatter.format(value) : value.toString();
    } else {
      value = parsedValue;
      // Format the display value on blur when locale is set
      if (formatter && value !== null) {
        inputValue = formatter.format(value);
      }
    }

    dispatch("change", value);
  }

  function onKeyDown(event) {
    if (useTextMode && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      updateValue(event.key === "ArrowUp");
    }
  }

  function handleBlur(event) {
    dispatch("blur", { event, value });
  }

  function handleStepperBlur(event, direction) {
    dispatch("blur:stepper", { event, value, direction });
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  class:bx--number-input--fluid={isFluid}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div
    data-invalid={showInvalid || undefined}
    class:bx--number={true}
    class:bx--number--helpertext={true}
    class:bx--number--readonly={readonly}
    class:bx--number--light={light}
    class:bx--number--nolabel={hideLabel}
    class:bx--number--nosteppers={hideSteppers}
    class:bx--number--sm={size === "sm"}
    class:bx--number--xl={size === "xl"}
  >
    {#if $$slots.labelChildren || labelText}
      <label
        for={id}
        class:bx--label={true}
        class:bx--label--disabled={disabled}
        class:bx--visually-hidden={hideLabel}
        class:bx--label--slotted={isFluid && $$slots.labelChildren}
      >
        <slot name="labelChildren">{labelText}</slot>
      </label>
    {/if}
    <div
      class:bx--number__input-wrapper={true}
      class:bx--number__input-wrapper--warning={showWarn}
    >
      {#if useTextMode}
        <input
          bind:this={ref}
          value={inputValue}
          type="text"
          inputmode="decimal"
          pattern="[0-9]*"
          aria-describedby={hasErrorMessage
            ? errorId
            : showWarn
              ? warnId
              : helperText && !isFluid
                ? helperId
                : undefined}
          data-invalid={showInvalid || undefined}
          aria-invalid={showInvalid || undefined}
          aria-label={labelText ? undefined : ariaLabel}
          aria-readonly={readonly || undefined}
          {disabled}
          {id}
          {name}
          {max}
          {min}
          {step}
          {readonly}
          {...$$restProps}
          on:change={onChange}
          on:input={onInput}
          on:keydown={onKeyDown}
          on:keydown
          on:keyup
          on:focus
          on:blur={handleBlur}
          on:paste
          on:wheel|nonpassive={(event) => {
            if (disableWheel) event.preventDefault();
          }}
        >
      {:else}
        <input
          bind:this={ref}
          type="number"
          aria-describedby={hasErrorMessage
            ? errorId
            : showWarn
              ? warnId
              : helperText && !isFluid
                ? helperId
                : undefined}
          data-invalid={showInvalid || undefined}
          aria-invalid={showInvalid || undefined}
          aria-label={labelText ? undefined : ariaLabel}
          aria-readonly={readonly || undefined}
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
          on:blur={handleBlur}
          on:paste
          on:wheel|nonpassive={(event) => {
            if (disableWheel) event.preventDefault();
          }}
        >
      {/if}
      {#if readonly && !isFluid}
        <EditOff class="bx--text-input__readonly-icon" />
      {:else if !readonly}
        {#if showInvalid}
          <WarningFilled class="bx--number__invalid" />
        {/if}
        {#if showWarn}
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
              dispatch("click:stepper", { value, direction: "down" });
            }}
            on:blur={(event) => handleStepperBlur(event, "down")}
            disabled={disabled || readonly}
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
              dispatch("click:stepper", { value, direction: "up" });
            }}
            on:blur={(event) => handleStepperBlur(event, "up")}
            disabled={disabled || readonly}
          >
            <Add class="up-icon" />
          </button>
          <div class:bx--number__rule-divider={true}></div>
        </div>
      {/if}
      {#if isFluid}
        <hr class:bx--number-input__divider={true}>
        {#if hasErrorMessage}
          <div id={errorId} class:bx--form-requirement={true}>
            {invalidText}
          </div>
        {/if}
        {#if showWarn}
          <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
        {/if}
      {/if}
    </div>
    {#if !isFluid && !showInvalid && !showWarn && helperText}
      <div
        id={helperId}
        class:bx--form__helper-text={true}
        class:bx--form__helper-text--disabled={disabled}
      >
        {helperText}
      </div>
    {/if}
    {#if !isFluid && hasErrorMessage}
      <div id={errorId} class:bx--form-requirement={true}>{invalidText}</div>
    {/if}
    {#if !isFluid && showWarn}
      <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
    {/if}
  </div>
</div>
