<script>
  /**
   * Set the size of the input.
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /** Specify the input type */
  export let type = "text";

  /** Specify the input placeholder text */
  export let placeholder = "";

  /**
   * Specify the Regular Expression for the input value.
   * By default, the pattern is derived from the parent
   * `DatePicker`'s `dateFormat` prop.
   * @type {string}
   */
  export let pattern = undefined;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Set to `true` to mark the input as read-only */
  export let readonly = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Specify the ARIA label for the calendar icon */
  export let iconDescription = "";

  /** Set an id for the input element */
  export let id = uniqueId();

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /**
   * Set a name for the input element.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /** Set to `true` to select the input's text when it receives focus */
  export let selectTextOnFocus = false;

  import { getContext, tick } from "svelte";
  import Calendar from "../icons/Calendar.svelte";
  import Close from "../icons/Close.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import {
    buildFieldIds,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { formReset } from "../utils/form-reset.js";
  import { uniqueId } from "../utils/unique-id.js";

  const REGEX_SPECIAL_CHARS = /[/\\^$*+?.()|[\]{}]/g;

  const {
    range,
    multiple,
    add,
    setReadonly,
    setDisabled,
    setValidation,
    hasCalendar,
    dateFormat,
    declareRef,
    inputIds,
    updateValue,
    handleFormReset,
    blurInput,
    openCalendar,
    focusCalendar,
    inputValue,
    inputValueFrom,
    inputValueTo,
    isFluid,
    clearable,
    clearButtonLabelText,
    clear,
  } = getContext("carbon:DatePicker");

  const dateFormatTokens = {
    d: "\\d{1,2}",
    j: "\\d{1,2}",
    m: "\\d{1,2}",
    n: "\\d{1,2}",
    Y: "\\d{4}",
    y: "\\d{2}",
    F: "\\w+",
    M: "\\w+",
    D: "\\w+",
    l: "\\w+",
  };

  function dateFormatToPattern(fmt) {
    let result = "";
    for (let i = 0; i < fmt.length; i++) {
      const ch = fmt[i];
      if (ch === "\\" && i + 1 < fmt.length) {
        result += fmt[++i].replace(REGEX_SPECIAL_CHARS, "\\$&");
      } else if (dateFormatTokens[ch]) {
        result += dateFormatTokens[ch];
      } else {
        result += ch.replace(REGEX_SPECIAL_CHARS, "\\$&");
      }
    }
    return result;
  }

  /**
   * `datePickerType="multiple"` joins each selected date with Flatpickr's
   * default `", "` conjunction into one input value, so the derived pattern
   * must allow one or more repetitions instead of a single date.
   */
  function dateFormatToMultiplePattern(fmt) {
    const single = dateFormatToPattern(fmt);
    return `${single}(, ${single})*`;
  }

  add({ id, labelText });

  $: actualPattern =
    pattern ??
    ($multiple ? dateFormatToMultiplePattern : dateFormatToPattern)(
      $dateFormat ?? "m/d/Y",
    );
  $: if (ref) declareRef({ id, ref });
  $: setReadonly(id, readonly);
  $: setDisabled(id, disabled);
  // Invalid/warn states are suppressed when the input is disabled or read-only.
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled,
    readonly,
  }));
  $: setValidation(id, showInvalid, showWarn);
  // The invalid/warn/calendar icons all render after the input in the DOM
  // (see below), so the vendor CSS's `.icon ~ .input` padding-right rule
  // never matches. This class is the fix; see _date-picker.scss.
  // While the clear button shows, it takes the decorative calendar icon's
  // place, so a narrow (range) input keeps room for the date.
  $: showCalendarIcon = $hasCalendar && !showInvalid && !showWarn && !showClear;
  $: hasIcon = showInvalid || showWarn || showCalendarIcon;
  // One button, on the last input, clears the whole selection.
  $: showClear =
    $clearable &&
    !readonly &&
    !disabled &&
    $inputIds[$inputIds.length - 1] === id &&
    ($range
      ? $inputValueFrom !== "" || $inputValueTo !== ""
      : $inputValue !== "");
  $: currentValue = $range
    ? $inputIds.indexOf(id) === 0
      ? $inputValueFrom
      : $inputValueTo
    : $inputValue;
  // The "multiple"-mode ghost overlay (see below) mirrors this instead of
  // `currentValue` directly: while a calendar exists, `updateValue` only
  // pushes typed keystrokes into the shared store on "change" (blur/Enter),
  // not "input", to avoid fighting flatpickr's own value management. That
  // deliberate lag would otherwise leave the overlay showing stale text
  // while the (invisible) real input already has the freshly typed value.
  $: overlayValue = currentValue;
  $: ({ errorId, warnId, helperId } = buildFieldIds(id));
  // Unlike its siblings, this field does not suppress the helper
  // fallback while fluid (no `isFluid` passed here) — the helper
  // text block below has the same omission.
  $: describedBy = resolveStatusDescribedBy({
    showInvalid,
    showWarn,
    helperText,
    errorId,
    warnId,
    helperId,
    includeErrorId: false,
  });

  function handleFocus() {
    if (selectTextOnFocus && !disabled && !$multiple) {
      tick().then(() => ref?.select());
    }
  }

  /**
   * Range mode has two DatePickerInputs sharing one reset handler. Attach
   * only to whichever declared itself first (the same check `declareRef`
   * uses to split `inputRef` from `inputRefTo`), so the restore runs once.
   */
  function attachFormReset(node, onReset) {
    if ($inputIds.indexOf(id) !== 0) return {};
    return formReset(node, onReset);
  }
</script>

<div
  class:bx--date-picker-container={true}
  class:bx--date-picker--nolabel={!labelText}
  class:bx--date-picker--fluid--invalid={$isFluid && showInvalid}
  class:bx--date-picker--fluid--warn={$isFluid && showWarn}
>
  {#if labelText || $$slots.labelChildren}
    <label
      for={id}
      class:bx--label={true}
      class:bx--label--slotted={$isFluid && $$slots.labelChildren}
      class:bx--visually-hidden={hideLabel}
      class:bx--label--disabled={disabled}
      class:bx--label--readonly={readonly}
    >
      <slot name="labelChildren"> {labelText} </slot>
    </label>
  {/if}
  <div
    class:bx--date-picker-input__wrapper={true}
    class:bx--date-picker-input__wrapper--invalid={showInvalid}
    class:bx--date-picker-input__wrapper--warn={showWarn}
    class:bx--date-picker-input__wrapper--readonly={readonly}
    class:bx--date-picker-input__wrapper--disabled={disabled}
  >
    <input
      bind:this={ref}
      use:attachFormReset={handleFormReset}
      data-invalid={showInvalid || undefined}
      aria-invalid={showInvalid || undefined}
      aria-errormessage={showInvalid ? errorId : undefined}
      aria-describedby={describedBy}
      {id}
      {name}
      {placeholder}
      {type}
      pattern={actualPattern}
      {disabled}
      {readonly}
      {...$$restProps}
      value={currentValue}
      class:bx--date-picker__input={true}
      class:bx--date-picker__input--invalid={showInvalid}
      class:bx--date-picker__input--with-icon={hasIcon}
      class:bx--date-picker__input--with-clear={showClear}
      class:bx--date-picker__input--sm={size === "sm"}
      class:bx--date-picker__input--xl={size === "xl"}
      class:bx--date-picker__input--ghost-text={$multiple}
      on:input
      on:input={(event) => {
        overlayValue = event.target.value;
        updateValue({ type: "input", value: event.target.value });
      }}
      on:change={(event) => {
        updateValue({ type: "change", value: event.target.value });
      }}
      on:keydown
      on:keydown={(event) => {
        if (!readonly && event.key === "ArrowDown" && focusCalendar()) {
          // flatpickr only intercepts arrow keys on the input when
          // `allowInput` is off, so it never runs its own preventDefault
          // here; without this, moving focus into the calendar also
          // triggers the browser's native arrow-key page scroll.
          event.preventDefault();
        }
      }}
      on:keyup
      on:focus
      on:focus={handleFocus}
      on:blur
      on:blur={(event) => {
        blurInput(event.relatedTarget);
      }}
      on:paste
    >
    {#if $multiple}
      <div
        class:bx--date-picker__input={true}
        class:bx--date-picker__input-overlay={true}
        class:bx--date-picker__input--with-icon={hasIcon}
        class:bx--date-picker__input--with-clear={showClear}
        class:bx--date-picker__input--sm={size === "sm"}
        class:bx--date-picker__input--xl={size === "xl"}
        aria-hidden="true"
      >
        <span>{overlayValue}</span>
      </div>
    {/if}
    {#if showClear}
      <button
        type="button"
        class:bx--date-picker__clear={true}
        class:bx--date-picker__clear--with-icon={showInvalid || showWarn}
        aria-label={$clearButtonLabelText}
        on:click={clear}
      >
        <Close />
      </button>
    {/if}
    {#if showInvalid}
      <WarningFilled
        class="bx--date-picker__icon bx--date-picker__icon--invalid"
      />
    {/if}
    {#if showWarn}
      <WarningAltFilled
        class="bx--date-picker__icon bx--date-picker__icon--warn"
      />
    {/if}
    {#if showCalendarIcon}
      <Calendar
        class="bx--date-picker__icon"
        aria-label={iconDescription}
        on:click={openCalendar}
      />
    {/if}
  </div>
  {#if showInvalid}
    <div class:bx--form-requirement={true} id={errorId} role="alert">
      {invalidText}
    </div>
  {/if}
  {#if showWarn}
    <div class:bx--form-requirement={true} id={warnId}>{warnText}</div>
  {/if}
  {#if !showInvalid && !showWarn && helperText}
    <div
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
      id={helperId}
    >
      {helperText}
    </div>
  {/if}
</div>
