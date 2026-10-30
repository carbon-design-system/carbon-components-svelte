<script>
  /**
   * Set the size of the input.
   * Inherits the parent `Form` size when unset.
   * Also accepts Carbon v11's `"md"` (the 40px default, which overrides a
   * `Form` size) and `"lg"` (`"xl"`).
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
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
   * @type {string | undefined}
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
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  /** Set to `true` to select the input's text when it receives focus */
  export let selectTextOnFocus = false;

  import { getContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import Decorator from "../AILabel/Decorator.svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";
  import Calendar from "../icons/Calendar.svelte";
  import Close from "../icons/Close.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { formReset } from "../utils/form-reset.js";
  import { preserveFocusSelection } from "../utils/preserve-focus-selection.js";
  import { FIELD_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";
  import { titleWhenTruncated } from "../utils/title-when-truncated.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { getCalendarLocale } from "./calendar-dates.js";
  import {
    dateFormatToMultiplePattern,
    dateFormatToPattern,
  } from "./date-format-pattern.js";

  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  $: effectiveSize = normalizeSize(size ?? $formSize, FIELD_SIZE_ALIASES);

  /**
   * Starts active for a filled slot, so the server renders the AI surface.
   * `Decorator` clears it when no `AILabel` claims the slot.
   * @type {import("svelte/store").Writable<undefined | "active" | "revert">}
   */
  const aiLabelState = writable($$slots.decorator ? "active" : undefined);

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
    locale,
  } = getContext("carbon:DatePicker");

  add({ id, labelText });

  $: actualPattern =
    pattern ??
    ($multiple ? dateFormatToMultiplePattern : dateFormatToPattern)(
      $dateFormat ?? "m/d/Y",
      getCalendarLocale($locale),
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
  // A status icon takes the calendar's corner, except in fluid, where it
  // sits beside the message instead and the calendar keeps its place.
  $: showCalendarIcon =
    $hasCalendar && !showClear && ($isFluid || (!showInvalid && !showWarn));
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
  // While the input has focus, the overlay hides and the input shows its
  // own text, scrolled to the caret, so the part being edited is visible.
  let focused = false;
  $: ({ errorId, warnId, helperId } = buildFieldIds(id));
  // Fluid fields render no helper text, as with the other fluid fields.
  $: describedBy = resolveStatusDescribedBy({
    showInvalid,
    showWarn,
    isFluid: $isFluid,
    invalidText,
    warnText,
    helperText,
    errorId,
    warnId,
    helperId,
    includeErrorId: false,
  });

  function handleFocus() {
    focused = true;
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
  class:bx--date-picker--fluid--invalid={$isFluid && showInvalid}
  class:bx--date-picker--fluid--warn={$isFluid && showWarn}
  class:bx--date-picker--fluid--neutral={$isFluid && !showInvalid && !showWarn}
  class:bx--date-picker--fluid--readonly={$isFluid &&
    readonly &&
    !showInvalid &&
    !showWarn}
>
  {#if labelText || $$slots.labelChildren}
    <label
      for={id}
      class:bx--label={true}
      class:bx--label--slotted={$isFluid && $$slots.labelChildren}
      class:bx--visually-hidden={hideLabel}
      class:bx--label--disabled={disabled}
      class:bx--label--readonly={readonly}
      use:titleWhenTruncated={{ enabled: $isFluid && !$$slots.labelChildren }}
    >
      <slot name="labelChildren">{labelText}</slot>
    </label>
  {/if}
  <div
    class:bx--date-picker-input__wrapper={true}
    class:bx--date-picker-input__wrapper--invalid={showInvalid}
    class:bx--date-picker-input__wrapper--warn={showWarn}
    class:bx--date-picker-input__wrapper--readonly={readonly}
    class:bx--date-picker-input__wrapper--disabled={disabled}
    class:bx--date-picker-input__wrapper--decorator={$$slots.decorator &&
      !$isFluid}
    class:bx--date-picker-input__wrapper--ai-label={$aiLabelState === "active"}
    use:titleWhenTruncated={{
      measure: ".bx--date-picker__input-overlay span",
      enabled: $multiple,
    }}
  >
    <input
      bind:this={ref}
      use:preserveFocusSelection={selectTextOnFocus && !disabled && !$multiple}
      use:attachFormReset={handleFormReset}
      data-invalid={showInvalid || undefined}
      aria-invalid={showInvalid ? "true" : undefined}
      aria-errormessage={showInvalid && invalidText ? errorId : undefined}
      {id}
      {name}
      {placeholder}
      {type}
      pattern={actualPattern}
      {disabled}
      {readonly}
      {...$$restProps}
      aria-describedby={joinDescribedBy(
        describedBy,
        $$restProps["aria-describedby"],
      )}
      value={currentValue}
      class:bx--date-picker__input={true}
      class:bx--date-picker__input--invalid={showInvalid}
      class:bx--date-picker__input--with-icon={hasIcon}
      class:bx--date-picker__input--with-clear={showClear}
      class:bx--date-picker__input--xs={effectiveSize === "xs"}
      class:bx--date-picker__input--sm={effectiveSize === "sm"}
      class:bx--date-picker__input--xl={effectiveSize === "xl"}
      class:bx--date-picker__input--ghost-text={$multiple && !focused}
      on:input
      on:input={(event) => {
        const { value: inputValue } = /** @type {HTMLInputElement} */ (
          event.target
        );
        overlayValue = inputValue;
        updateValue({ type: "input", value: inputValue });
      }}
      on:change={(event) => {
        updateValue({
          type: "change",
          value: /** @type {HTMLInputElement} */ (event.target).value,
        });
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
        focused = false;
        blurInput(event.relatedTarget);
      }}
      on:paste
    />
    {#if $multiple}
      <div
        class:bx--date-picker__input={true}
        class:bx--date-picker__input-overlay={true}
        class:bx--date-picker__input-overlay--hidden={focused}
        class:bx--date-picker__input--with-icon={hasIcon}
        class:bx--date-picker__input--with-clear={showClear}
        class:bx--date-picker__input--xs={effectiveSize === "xs"}
        class:bx--date-picker__input--sm={effectiveSize === "sm"}
        class:bx--date-picker__input--xl={effectiveSize === "xl"}
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
    {#if $$slots.decorator}
      <Decorator
        class="bx--field-decorator bx--date-picker-input-inner-wrapper--decorator"
        size={effectiveSize}
        state={aiLabelState}
      >
        <slot name="decorator" />
      </Decorator>
    {/if}
    {#if showCalendarIcon}
      <Calendar
        class="bx--date-picker__icon"
        aria-label={iconDescription}
        on:click={openCalendar}
      />
    {/if}
  </div>
  {#if showInvalid && invalidText}
    <div class:bx--form-requirement={true} id={errorId} role="alert">
      {invalidText}
    </div>
  {/if}
  {#if showWarn && warnText}
    <div class:bx--form-requirement={true} id={warnId}>{warnText}</div>
  {/if}
  {#if !$isFluid && !showInvalid && !showWarn && helperText}
    <div
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
      id={helperId}
    >
      {helperText}
    </div>
  {/if}
</div>
