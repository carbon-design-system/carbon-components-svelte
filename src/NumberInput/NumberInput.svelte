<script context="module">
  /**
   * Fold the `invalid` prop, a custom `validate` result, and the
   * auto-computed out-of-range state into one effective invalid flag.
   * Explicit `invalid` wins, then a custom validator, then the
   * auto-computed fallback.
   * @param {boolean} isInvalid
   * @param {boolean | undefined} isCustomValid
   * @param {boolean} isAutoInvalid
   * @returns {boolean}
   */
  function computeEffectiveInvalid(isInvalid, isCustomValid, isAutoInvalid) {
    if (isInvalid) return true;
    if (isCustomValid === false) return true;
    if (isCustomValid === true) return false;
    return isAutoInvalid;
  }
</script>

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
   * Inherits the parent `Form` size when unset.
   * Also accepts Carbon v11's `"md"` (the 40px default, which overrides a
   * `Form` size) and `"lg"` (`"xl"`).
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /**
   * Specify the input value.
   * Use `null` to denote "no value".
   * Kept when the owning form resets; with `allowEmpty`, follows the field
   * instead.
   * @type {null | number}
   * @bindable writable
   */
  export let value = null;

  /** Specify the step increment */
  export let step = 1;

  /**
   * Specify the maximum value.
   * @type {number | undefined}
   */
  export let max = undefined;

  /**
   * Specify the minimum value.
   * @type {number | undefined}
   */
  export let min = undefined;

  /**
   * Provide the value stepping should begin at when the input is empty.
   * @type {number | undefined}
   */
  export let stepStartValue = undefined;

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
   * @type {string | undefined}
   * @example
   * ```svelte
   * <NumberInput locale="de-DE" value={1234.5} />
   * <NumberInput locale="en-US" value={1234.5} />
   * ```
   */
  export let locale = undefined;

  /**
   * Specify Intl.NumberFormat options when `locale` is set.
   * @type {Intl.NumberFormatOptions | undefined}
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
   * Set to `true` to change the value by dragging the label left or right.
   * Dragging toward the inline end raises the value: right, or left under
   * `dir="rtl"`. Every 4 pixels of travel moves one `step`; hold Shift to
   * move 10 steps.
   * Typing, arrow keys, and the steppers work as usual.
   */
  export let scrubbable = false;

  /** Set to `true` to select the input's text when it receives focus */
  export let selectTextOnFocus = false;

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
   * @example
   * ```svelte
   * <!-- import { validateNumberSeparators } from "carbon-components-svelte"; -->
   * <NumberInput locale="de-DE" validate={validateNumberSeparators} />
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
  export let translateWithId = function translateWithId(id) {
    return defaultTranslations[id];
  };

  /**
   * Default translation ids.
   * @type {{ increment: "increment"; decrement: "decrement" }}
   */
  export const translationIds = {
    increment: "increment",
    decrement: "decrement",
  };

  /** Set an id for the input element */
  export let id = uniqueId();

  /**
   * Specify a name attribute for the input.
   * With `locale` or `allowDecimal`, the form submits the numeric value
   * (for example `1234.5`), not the formatted display text.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import { writable } from "svelte/store";
  import Decorator from "../AILabel/Decorator.svelte";
  import {
    FORM_CONTEXT_KEY,
    FORM_SIZE_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import {
    STEPPER_REPEAT_DELAY_MS,
    STEPPER_REPEAT_INTERVAL_MS,
  } from "../constants/timing.js";
  import Add from "../icons/Add.svelte";
  import EditOff from "../icons/EditOff.svelte";
  import Subtract from "../icons/Subtract.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { formReset } from "../utils/form-reset.js";
  import { getNumberFormatter } from "../utils/intl-formatter-cache.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import {
    clamp,
    getDefaultValue,
    parse,
    parseLocaleValue,
    roundToStep,
  } from "../utils/numeric-format.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { preserveFocusSelection } from "../utils/preserve-focus-selection.js";
  import { reflectDefaultValue } from "../utils/reflect-default-value.js";
  import { FIELD_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";
  import { titleWhenTruncated } from "../utils/title-when-truncated.js";
  import { uniqueId } from "../utils/unique-id.js";

  const SCRUB_STEP_PIXELS = 4;

  const defaultTranslations = {
    [translationIds.increment]: "Increment number",
    [translationIds.decrement]: "Decrement number",
  };

  const dispatch = createEventDispatcher();
  const formContext = getContext(FORM_CONTEXT_KEY);
  const layoutDirection = getLayoutDirection();
  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = normalizeSize(size ?? $formSize, FIELD_SIZE_ALIASES);

  /**
   * Starts active for a filled slot, so the server renders the AI surface.
   * `Decorator` clears it when no `AILabel` claims the slot.
   * @type {import("svelte/store").Writable<undefined | "active" | "revert">}
   */
  const aiLabelState = writable($$slots.decorator ? "active" : undefined);

  function updateValue(isIncrementing, multiplier = 1) {
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
      const stepAmount = step * multiplier;
      const currentValue = value ?? getDefaultValue(stepStartValue, min);
      const newValue = roundToStep(
        isIncrementing
          ? clamp(currentValue + stepAmount, undefined, max)
          : clamp(currentValue - stepAmount, min, undefined),
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
        ref.stepUp(multiplier);
      } else {
        ref.stepDown(multiplier);
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
  $: formatter = locale ? getNumberFormatter(locale, formatOptions) : null;
  $: useTextMode = allowDecimal || !!locale;
  $: separatorParts = locale
    ? getNumberFormatter(locale, undefined).formatToParts(12345.6)
    : null;
  $: groupSeparator = separatorParts
    ? (separatorParts.find((p) => p.type === "group")?.value ?? "")
    : "";
  $: decimalSeparator = separatorParts
    ? (separatorParts.find((p) => p.type === "decimal")?.value ?? ".")
    : ".";

  let inputValue = value?.toString() ?? "";
  let prevValue;
  let prevFormatter;
  let userInputActive = false;
  let inputFocused = false;

  $: customValid =
    typeof validate === "function"
      ? validate(useTextMode ? inputValue : String(value ?? ""), locale)
      : undefined;

  $: effectiveInvalid = computeEffectiveInvalid(
    invalid,
    customValid,
    autoInvalid,
  );
  // Invalid/warn states are suppressed when the input is disabled or read-only.
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid: effectiveInvalid,
    warn,
    disabled,
    readonly,
  }));
  $: isFluid = fluid || !!formContext?.isFluid;
  $: scrubEnabled = scrubbable && !disabled && !readonly;
  // Neutral = neither invalid nor warn is showing.
  $: neutral = !showInvalid && !showWarn;
  $: hasErrorMessage = showInvalid && !!invalidText;
  $: ({ errorId, warnId, helperId } = buildFieldIds(id));
  $: ariaLabel =
    $$props["aria-label"] ||
    "Numeric input field with increment and decrement buttons";

  // Only use inputValue tracking in text mode (allowDecimal or locale).
  // During user typing, don't interfere with inputValue — formatting
  // happens on blur (handleChange) and programmatic changes only.
  $: if (useTextMode) {
    const valueChanged = value !== prevValue;
    prevValue = value;
    // The formatter cache returns the same instance for equal options, so
    // this only changes when `locale` or `formatOptions` really do.
    const formatterChanged = formatter !== prevFormatter;
    prevFormatter = formatter;

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
      // - OR the formatter changed, so the same value displays differently
      // This allows "1.5." to stay visible while user corrects their typo.
      if (
        (parsedInput !== value && parsedInput !== null) ||
        valueChanged ||
        formatterChanged
      ) {
        inputValue = valueStr;
      }
    } else if (value == null && inputValue !== "") {
      inputValue = "";
    }
  }

  // A form reset restores the field without an input event. Without
  // `allowEmpty` the field cannot be empty, so its value attribute follows
  // the current value (reflectDefaultValue) and a reset keeps it; with
  // `allowEmpty` the reset clears it. Either way, read the field back, and
  // keep a read-only field's state.
  function handleFormReset() {
    if (!ref) return;
    if (readonly) {
      ref.value = useTextMode ? inputValue : String(value ?? "");
      return;
    }
    userInputActive = false;
    const raw = ref.value;
    value =
      useTextMode && locale
        ? parseLocaleValue(raw, groupSeparator, decimalSeparator)
        : parse(raw);
  }

  /** @param {Event} event */
  function handleInput(event) {
    const input = /** @type {HTMLInputElement} */ (event.target);
    if (useTextMode) {
      userInputActive = true;
      inputValue = input.value;
      const parsed = locale
        ? parseLocaleValue(input.value, groupSeparator, decimalSeparator)
        : parse(input.value);
      // Preserve last valid value when input is invalid (e.g., "1.5." with two decimals).
      // This provides better UX by letting users see and correct typos without losing data.
      if (parsed !== null || input.value === "" || input.value === "-") {
        value = parsed;
      }
    } else {
      value = parse(input.value);
    }

    dispatch("input", value);
  }

  /** @param {Event} event */
  function handleChange(event) {
    const input = /** @type {HTMLInputElement} */ (event.target);
    userInputActive = false;
    let parsedValue = locale
      ? parseLocaleValue(input.value, groupSeparator, decimalSeparator)
      : parse(input.value, useTextMode);

    // If allowEmpty is false and value would be null, use default value
    // This prevents the input from staying empty when allowEmpty is false
    if (!allowEmpty && parsedValue === null && input.value === "") {
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
      input.value !== "" &&
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

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (readonly || disabled) return;

    if (useTextMode && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      updateValue(event.key === "ArrowUp");
      return;
    }

    if (event.key === "PageUp" || event.key === "PageDown") {
      // Unlike Arrow keys, native number inputs don't step on Page Up/Down,
      // so handle it here regardless of useTextMode. Steps by 10x `step`,
      // clamped to min/max like a single step.
      event.preventDefault();
      updateValue(event.key === "PageUp", 10);
    }
  }

  let scrubLastX = 0;
  // Travel not yet converted into steps, so a slow drag still adds up and
  // switching Shift mid-drag doesn't jump.
  let scrubRemainder = 0;
  /** @type {null | number} */
  let scrubStartValue = null;
  // 1 when dragging right raises the value, -1 in a right-to-left layout,
  // where the inline end is on the left.
  let scrubSign = 1;

  /**
   * Start a scrub on the label, unless scrubbing is off.
   * @param {PointerEvent} event
   * @returns {false | void} `false` declines the drag.
   */
  function handleScrubStart(event) {
    if (!scrubEnabled) return false;
    // Keep the press from selecting the label text. A click without
    // movement still focuses the input through the label.
    event.preventDefault();
    scrubLastX = event.clientX;
    scrubRemainder = 0;
    scrubStartValue = value;
    const node =
      event.currentTarget instanceof Element ? event.currentTarget : null;
    scrubSign =
      resolveLayoutDirection($layoutDirection, node) === "rtl" ? -1 : 1;
  }

  /**
   * Move the value one `step` per `SCRUB_STEP_PIXELS` of travel toward the
   * inline end, or 10 steps with Shift held.
   * @param {PointerEvent} event
   */
  function handleScrubMove(event) {
    scrubRemainder += (event.clientX - scrubLastX) * scrubSign;
    scrubLastX = event.clientX;
    const steps = Math.trunc(scrubRemainder / SCRUB_STEP_PIXELS);
    if (!steps) return;
    scrubRemainder -= steps * SCRUB_STEP_PIXELS;
    const current = value ?? getDefaultValue(stepStartValue, min);
    const next = roundToStep(
      clamp(current + steps * step * (event.shiftKey ? 10 : 1), min, max),
      step,
    );
    if (next === value) return;
    userInputActive = false;
    value = next;
    dispatch("input", value);
  }

  /** Dispatch `change` once, if the drag moved the value. */
  function handleScrubEnd() {
    if (value !== scrubStartValue) dispatch("change", value);
  }

  function handleInputFocus() {
    if (isFluid) inputFocused = true;
    if (selectTextOnFocus && !disabled) {
      tick().then(() => ref?.select());
    }
  }

  /** @param {FocusEvent} event */
  function handleBlur(event) {
    if (isFluid) inputFocused = false;
    dispatch("blur", { event, value });
  }

  function handleStepperBlur(event, direction) {
    stopRepeat();
    dispatch("blur:stepper", { event, value, direction });
  }

  /** @type {undefined | ReturnType<typeof setTimeout>} */
  let repeatTimer;
  // Set once a held stepper has stepped, so the click that ends the press
  // does not step again.
  let repeated = false;

  /**
   * A press shorter than `STEPPER_REPEAT_DELAY_MS` steps once, on click, so
   * moving off the button before release still cancels it. A longer press
   * steps every `STEPPER_REPEAT_INTERVAL_MS` until release, a min or max,
   * or the field turns disabled or read-only. Keys repeat on their own.
   * @param {PointerEvent} event
   * @param {boolean} isIncrementing
   */
  function startRepeat(event, isIncrementing) {
    stopRepeat();
    repeated = false;
    if (event.button !== 0 || !event.isPrimary || disabled || readonly) return;
    const repeat = () => {
      if (disabled || readonly) return stopRepeat();
      const previous = value;
      updateValue(isIncrementing);
      repeated = true;
      if (value === previous) return stopRepeat();
      repeatTimer = setTimeout(repeat, STEPPER_REPEAT_INTERVAL_MS);
    };
    repeatTimer = setTimeout(repeat, STEPPER_REPEAT_DELAY_MS);
  }

  function stopRepeat() {
    clearTimeout(repeatTimer);
    repeatTimer = undefined;
  }

  /**
   * Stop on leave. A pointer that leaves while pressed ends the press with
   * no click; a touch leaves after its release, before its click.
   * @param {PointerEvent} event
   */
  function handleStepperPointerLeave(event) {
    stopRepeat();
    if (event.buttons) repeated = false;
  }

  /** @param {boolean} isIncrementing */
  function handleStepperClick(isIncrementing) {
    if (repeated) repeated = false;
    else updateValue(isIncrementing);
    dispatch("click:stepper", {
      value,
      direction: isIncrementing ? "up" : "down",
    });
  }

  onMount(() => stopRepeat);
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  class:bx--number-input--fluid={isFluid}
  class:bx--number-input--fluid--focus={isFluid && inputFocused}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div
    data-invalid={showInvalid || undefined}
    class:bx--number={true}
    class:bx--number--neutral={neutral}
    class:bx--number--helpertext={true}
    class:bx--number--readonly={readonly}
    class:bx--number--nolabel={hideLabel}
    class:bx--number--nosteppers={hideSteppers}
    class:bx--number--xs={effectiveSize === "xs"}
    class:bx--number--sm={effectiveSize === "sm"}
    class:bx--number--xl={effectiveSize === "xl"}
  >
    {#if $$slots.labelChildren || labelText}
      <label
        for={id}
        class:bx--label={true}
        class:bx--label--disabled={disabled}
        class:bx--visually-hidden={hideLabel}
        class:bx--label--slotted={isFluid && $$slots.labelChildren}
        class:bx--label--scrubbable={scrubEnabled}
        use:titleWhenTruncated={{ enabled: isFluid && !$$slots.labelChildren }}
        use:pointerDrag={{
          enabled: scrubEnabled,
          onStart: handleScrubStart,
          onMove: handleScrubMove,
          onEnd: handleScrubEnd,
        }}
      >
        <slot name="labelChildren">{labelText}</slot>
      </label>
    {/if}
    <div
      class:bx--number__input-wrapper={true}
      class:bx--number__input-wrapper--warning={showWarn}
      class:bx--number__input-wrapper--decorator={$$slots.decorator && !isFluid}
      class:bx--number__input-wrapper--ai-label={$aiLabelState === "active"}
    >
      {#if useTextMode}
        {#if name}
          <!-- The visible input shows formatted text (for example 1,234.5);
               submit the number itself, like a native number input. -->
          <input
            type="hidden"
            {name}
            value={value ?? ""}
            {disabled}
            form={$$restProps.form}
          />
        {/if}
        <input
          bind:this={ref}
          use:preserveFocusSelection={selectTextOnFocus && !disabled}
          use:formReset={handleFormReset}
          use:reflectDefaultValue={allowEmpty ? undefined : inputValue}
          value={inputValue}
          type="text"
          inputmode="decimal"
          aria-errormessage={hasErrorMessage ? errorId : undefined}
          data-invalid={showInvalid || undefined}
          aria-invalid={showInvalid ? "true" : undefined}
          aria-label={labelText ? undefined : ariaLabel}
          aria-readonly={readonly ? "true" : undefined}
          {disabled}
          {id}
          {max}
          {min}
          {step}
          {readonly}
          {...$$restProps}
          aria-describedby={joinDescribedBy(
            resolveStatusDescribedBy({
              showInvalid,
              showWarn,
              invalidText,
              warnText,
              helperText,
              isFluid,
              errorId,
              warnId,
              helperId,
              includeErrorId: false,
            }),
            $$restProps["aria-describedby"],
          )}
          on:change={handleChange}
          on:input={handleInput}
          on:keydown={handleKeydown}
          on:keydown
          on:keyup
          on:focus={handleInputFocus}
          on:focus
          on:blur={handleBlur}
          on:paste
          on:wheel|nonpassive={(event) => {
            if (disableWheel) event.preventDefault();
          }}
        />
      {:else}
        <!-- NVDA ignores `readonly` on a number input and announces it as
          editable, so a read-only field renders as a text input. -->
        <input
          bind:this={ref}
          use:preserveFocusSelection={selectTextOnFocus && !disabled}
          use:formReset={handleFormReset}
          use:reflectDefaultValue={allowEmpty ? undefined : value}
          type={readonly ? "text" : "number"}
          inputmode="decimal"
          aria-errormessage={hasErrorMessage ? errorId : undefined}
          data-invalid={showInvalid || undefined}
          aria-invalid={showInvalid ? "true" : undefined}
          aria-label={labelText ? undefined : ariaLabel}
          aria-readonly={readonly ? "true" : undefined}
          {disabled}
          {id}
          {name}
          {max}
          {min}
          {step}
          value={value ?? ""}
          {readonly}
          {...$$restProps}
          aria-describedby={joinDescribedBy(
            resolveStatusDescribedBy({
              showInvalid,
              showWarn,
              invalidText,
              warnText,
              helperText,
              isFluid,
              errorId,
              warnId,
              helperId,
              includeErrorId: false,
            }),
            $$restProps["aria-describedby"],
          )}
          on:change={handleChange}
          on:input={handleInput}
          on:keydown={handleKeydown}
          on:keydown
          on:keyup
          on:focus={handleInputFocus}
          on:focus
          on:blur={handleBlur}
          on:paste
          on:wheel|nonpassive={(event) => {
            if (disableWheel) event.preventDefault();
          }}
        />
      {/if}
      {#if readonly && hideSteppers && !isFluid}
        <!-- Read-only steppers stay visible but inert and mark the state
          instead, so the icon only shows without them. -->
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
      {#if $$slots.decorator}
        <Decorator
          class="bx--field-decorator bx--number__inner-wrapper--decorator"
          size={effectiveSize}
          state={aiLabelState}
        >
          <slot name="decorator" />
        </Decorator>
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
            on:click={() => handleStepperClick(false)}
            on:pointerdown={(event) => startRepeat(event, false)}
            on:pointerup={stopRepeat}
            on:pointerleave={handleStepperPointerLeave}
            on:pointercancel={() => {
              stopRepeat();
              repeated = false;
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
            on:click={() => handleStepperClick(true)}
            on:pointerdown={(event) => startRepeat(event, true)}
            on:pointerup={stopRepeat}
            on:pointerleave={handleStepperPointerLeave}
            on:pointercancel={() => {
              stopRepeat();
              repeated = false;
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
        <hr class:bx--number-input__divider={true} />
        {#if hasErrorMessage}
          <div id={errorId} class:bx--form-requirement={true} role="alert">
            {invalidText}
          </div>
        {/if}
        {#if showWarn && warnText}
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
      <div id={errorId} class:bx--form-requirement={true} role="alert">
        {invalidText}
      </div>
    {/if}
    {#if !isFluid && showWarn && warnText}
      <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
    {/if}
  </div>
</div>
