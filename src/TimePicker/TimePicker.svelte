<script>
  /**
   * @typedef {import("../utils/time-format.js").TimeFormat} TimeFormat
   * @typedef {{ value: string; hours: number | null; minutes: number | null; seconds?: number | null; valid: boolean }} TimePickerChangeDetail
   * @event {TimePickerChangeDetail} change
   */

  /**
   * Specify the size of the input.
   * Inherits the parent `Form` size when unset.
   * @type {"xs" | "sm" | "xl"}
   */
  export let size = undefined;

  /**
   * Specify the input value.
   * Follows the field's value after the owning form resets, on every Svelte version.
   * @type {string}
   * @bindable writable
   */
  export let value = "";

  /**
   * Specify the time format. Drives pattern, placeholder, and maxlength
   * presets unless those props are set explicitly.
   * @type {TimeFormat}
   */
  export let format = "12";

  /**
   * Set to `true` to accept seconds (`hh:mm:ss`).
   * Extends pattern, placeholder, and maxlength presets.
   */
  export let seconds = false;

  /**
   * Set to `true` to reformat a valid value on blur
   * (for example `930` → `09:30`).
   */
  export let normalize = false;

  /**
   * Specify the input placeholder text.
   * Defaults from `format` and `seconds` when unset.
   * @type {string}
   */
  export let placeholder = undefined;

  /**
   * Specify the `pattern` attribute for the input element.
   * Defaults from `format` and `seconds`. Overrides the format preset when set.
   * @type {string}
   */
  export let pattern = undefined;

  /**
   * Specify the `maxlength` input attribute.
   * Defaults from `format` and `seconds` when unset.
   * @type {number}
   */
  export let maxlength = undefined;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Set to `true` to mark the input as read-only */
  export let readonly = false;

  /** Specify the label text */
  export let labelText = "";

  /**
   * Set to `true` to visually hide the label text. In the fluid variant,
   * the `TimePickerSelect` labels are hidden too.
   */
  export let hideLabel = false;

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

  /** Set an id for the input element */
  export let id = uniqueId();

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

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   */
  export let fluid = false;

  /** Set to `true` to select the input's text when it receives focus */
  export let selectTextOnFocus = false;

  import { createEventDispatcher, getContext, setContext, tick } from "svelte";
  import { readonly as readOnly, writable } from "svelte/store";
  import {
    FORM_CONTEXT_KEY,
    FORM_SIZE_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import Stack from "../Stack/Stack.svelte";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { formReset } from "../utils/form-reset.js";
  import { preserveFocusSelection } from "../utils/preserve-focus-selection.js";
  import { getTimeInputPreset, parseTime } from "../utils/time-format.js";
  import { uniqueId } from "../utils/unique-id.js";

  const formContext = getContext(FORM_CONTEXT_KEY);
  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = size ?? $formSize;
  const dispatch = createEventDispatcher();
  const groupReadonly = writable(readonly);
  const groupDisabled = writable(disabled);
  // Fluid selects show their own labels; hiding the picker's hides theirs.
  const groupHideLabel = writable(hideLabel);

  const timePickerContext = {
    isFluid: false,
    readonly: readOnly(groupReadonly),
    disabled: readOnly(groupDisabled),
    hideLabel: readOnly(groupHideLabel),
  };

  setContext("carbon:TimePicker", timePickerContext);

  function handleFocus() {
    if (selectTextOnFocus && !disabled) {
      tick().then(() => ref?.select());
    }
  }

  // A form reset restores the field without an input event. Svelte 5 syncs
  // `bind:value` back on its own; Svelte 3 and 4 do not, so read the field.
  function handleFormReset() {
    if (ref) value = ref.value;
  }

  /** @returns {TimePickerChangeDetail} */
  function changeDetail() {
    const parsed = parseTime(value, { format, seconds });
    /** @type {TimePickerChangeDetail} */
    const detail = {
      value,
      hours: parsed.hours,
      minutes: parsed.minutes,
      valid: parsed.valid,
    };
    if (seconds) {
      detail.seconds = parsed.seconds;
    }
    return detail;
  }

  function applyNormalize() {
    if (!normalize || disabled || readonly) return;
    const parsed = parseTime(value, { format, seconds });
    if (parsed.valid && parsed.value !== value) {
      value = parsed.value;
    }
  }

  function handleBlur() {
    applyNormalize();
  }

  function handleChange() {
    // Native `change` can fire before `blur`; normalize first so detail matches
    // the reformatted value.
    applyNormalize();
    dispatch("change", changeDetail());
  }

  $: preset = getTimeInputPreset(format, seconds);
  $: resolvedPattern = pattern ?? preset.pattern;
  $: resolvedPlaceholder = placeholder ?? preset.placeholder;
  $: resolvedMaxlength = maxlength ?? preset.maxlength;
  $: ({ helperId, errorId, warnId } = buildFieldIds(id));
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled,
    readonly,
  }));
  $: isFluid = fluid || !!formContext?.isFluid;
  $: timePickerContext.isFluid = isFluid;
  $: groupReadonly.set(readonly);
  $: groupDisabled.set(disabled);
  $: groupHideLabel.set(hideLabel);
  $: fluidErrorText = showInvalid ? invalidText : showWarn ? warnText : "";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  class:bx--form-item--fit={!isFluid}
  class:bx--time-picker__form-item--fluid={isFluid}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if isFluid}
    <div
      class:bx--time-picker--fluid={true}
      class:bx--time-picker--fluid--disabled={disabled}
      class:bx--time-picker--fluid--invalid={showInvalid}
      class:bx--time-picker--fluid--warning={showWarn}
      class:bx--time-picker--readonly={readonly}
    >
      <div class:bx--time-picker--fluid__wrapper={true}>
        <div class:bx--time-picker__input={true}>
          <div
            class:bx--form-item={true}
            class:bx--text-input-wrapper={true}
            class:bx--text-input--fluid={true}
            class:bx--text-input-wrapper--readonly={readonly}
          >
            {#if labelText || $$slots.labelChildren}
              <label
                for={id}
                class:bx--label={true}
                class:bx--visually-hidden={hideLabel}
                class:bx--label--disabled={disabled}
                class:bx--label--readonly={readonly}
                class:bx--label--slotted={$$slots.labelChildren}
              >
                <slot name="labelChildren"> {labelText} </slot>
              </label>
            {/if}
            <div class:bx--text-input__field-outer-wrapper={true}>
              <div class:bx--text-input__field-wrapper={true}>
                <input
                  bind:this={ref}
                  use:preserveFocusSelection={selectTextOnFocus && !disabled}
                  use:formReset={handleFormReset}
                  bind:value
                  type="text"
                  aria-invalid={showInvalid || undefined}
                  aria-errormessage={showInvalid && invalidText
                    ? errorId
                    : undefined}
                  pattern={resolvedPattern}
                  placeholder={resolvedPlaceholder}
                  maxlength={resolvedMaxlength}
                  {id}
                  {name}
                  {disabled}
                  readonly={readonly || undefined}
                  {...$$restProps}
                  aria-describedby={joinDescribedBy(
                    resolveStatusDescribedBy({
                      showInvalid,
                      showWarn,
                      invalidText,
                      warnText,
                      errorId,
                      warnId,
                      includeErrorId: false,
                    }),
                    $$restProps["aria-describedby"],
                  )}
                  class:bx--time-picker__input-field={true}
                  class:bx--text-input={true}
                  on:change={handleChange}
                  on:input
                  on:keydown
                  on:keyup
                  on:focus
                  on:focus={handleFocus}
                  on:blur
                  on:blur={handleBlur}
                  on:paste
                >
              </div>
            </div>
          </div>
        </div>
        <slot />
      </div>
      {#if showInvalid || showWarn}
        <hr class:bx--time-picker__divider={true}>
        <div
          id={showInvalid ? errorId : warnId}
          role={showInvalid ? "alert" : undefined}
          class:bx--form-requirement={true}
        >
          {fluidErrorText}
        </div>
      {/if}
      {#if showInvalid}
        <WarningFilled
          class="bx--time-picker__icon bx--time-picker__icon--invalid"
        />
      {:else if showWarn}
        <WarningAltFilled
          class="bx--time-picker__icon bx--time-picker__icon--warn"
        />
      {/if}
    </div>
  {:else}
    <div
      class:bx--time-picker={true}
      class:bx--time-picker--invalid={showInvalid}
      class:bx--time-picker--warn={showWarn}
      class:bx--time-picker--readonly={readonly}
      class:bx--time-picker--xs={effectiveSize === "xs"}
      class:bx--time-picker--sm={effectiveSize === "sm"}
      class:bx--time-picker--xl={effectiveSize === "xl"}
    >
      <div class:bx--time-picker__input={true}>
        {#if labelText || $$slots.labelChildren}
          <label
            for={id}
            class:bx--label={true}
            class:bx--visually-hidden={hideLabel}
            class:bx--label--disabled={disabled}
            class:bx--label--readonly={readonly}
          >
            <slot name="labelChildren"> {labelText} </slot>
          </label>
        {/if}
        <Stack orientation="horizontal" gap={0}>
          <div
            data-invalid={showInvalid || undefined}
            data-warn={showWarn || undefined}
            class:bx--text-input__field-wrapper={true}
            class:bx--text-input__field-wrapper--warning={showWarn}
            style:width="auto"
          >
            {#if showInvalid}
              <WarningFilled class="bx--text-input__invalid-icon" />
            {:else if showWarn}
              <WarningAltFilled
                class="bx--text-input__invalid-icon bx--text-input__invalid-icon--warning"
              />
            {/if}
            <input
              bind:this={ref}
              use:preserveFocusSelection={selectTextOnFocus && !disabled}
              use:formReset={handleFormReset}
              bind:value
              type="text"
              data-invalid={showInvalid || undefined}
              aria-invalid={showInvalid || undefined}
              aria-errormessage={showInvalid && invalidText
                ? errorId
                : undefined}
              pattern={resolvedPattern}
              placeholder={resolvedPlaceholder}
              maxlength={resolvedMaxlength}
              {id}
              {name}
              {disabled}
              readonly={readonly || undefined}
              {...$$restProps}
              aria-describedby={joinDescribedBy(
                resolveStatusDescribedBy({
                  showInvalid,
                  showWarn,
                  invalidText,
                  warnText,
                  helperText,
                  errorId,
                  warnId,
                  helperId,
                  includeErrorId: false,
                }),
                $$restProps["aria-describedby"],
              )}
              class:bx--time-picker__input-field={true}
              class:bx--text-input={true}
              class:bx--text-input--invalid={showInvalid}
              class:bx--text-input--warning={showWarn}
              on:change={handleChange}
              on:input
              on:keydown
              on:keyup
              on:focus
              on:focus={handleFocus}
              on:blur
              on:blur={handleBlur}
              on:paste
            >
          </div>
          <slot />
        </Stack>
      </div>
    </div>
    {#if showInvalid}
      {#if invalidText}
        <div id={errorId} class:bx--form-requirement={true} role="alert">
          {invalidText}
        </div>
      {/if}
    {:else if showWarn}
      {#if warnText}
        <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
      {/if}
    {:else if helperText}
      <div
        id={helperId}
        class:bx--form__helper-text={true}
        class:bx--form__helper-text--disabled={disabled}
      >
        {helperText}
      </div>
    {/if}
  {/if}
</div>
