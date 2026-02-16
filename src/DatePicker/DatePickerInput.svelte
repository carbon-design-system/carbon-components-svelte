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

  /** Specify the helper text */
  export let helperText = "";

  /** Specify the ARIA label for the calendar icon */
  export let iconDescription = "";

  /** Set an id for the input element */
  export let id = `ccs-${Math.random().toString(36)}`;

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

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  import { getContext } from "svelte";
  import Calendar from "../icons/Calendar.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";

  const {
    range,
    add,
    hasCalendar,
    dateFormat,
    declareRef,
    inputIds,
    updateValue,
    blurInput,
    openCalendar,
    focusCalendar,
    inputValue,
    inputValueFrom,
    inputValueTo,
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
        result += fmt[++i].replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      } else if (dateFormatTokens[ch]) {
        result += dateFormatTokens[ch];
      } else {
        result += ch.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
      }
    }
    return result;
  }

  add({ id, labelText });

  $: actualPattern = pattern ?? dateFormatToPattern($dateFormat ?? "m/d/Y");
  $: if (ref) declareRef({ id, ref });
</script>

<div
  class:bx--date-picker-container={true}
  class:bx--date-picker--nolabel={!labelText}
>
  {#if labelText || $$slots.labelChildren}
    <label
      for={id}
      class:bx--label={true}
      class:bx--visually-hidden={hideLabel}
      class:bx--label--disabled={disabled}
    >
      <slot name="labelChildren">
        {labelText}
      </slot>
    </label>
  {/if}
  <div
    class:bx--date-picker-input__wrapper={true}
    class:bx--date-picker-input__wrapper--invalid={invalid}
    class:bx--date-picker-input__wrapper--warn={warn}
  >
    <input
      bind:this={ref}
      data-invalid={invalid || undefined}
      {id}
      {name}
      {placeholder}
      {type}
      pattern={actualPattern}
      {disabled}
      {...$$restProps}
      value={$range
        ? $inputIds.indexOf(id) === 0
          ? $inputValueFrom
          : $inputValueTo
        : $inputValue}
      class:bx--date-picker__input={true}
      class:bx--date-picker__input--invalid={invalid}
      class:bx--date-picker__input--sm={size === "sm"}
      class:bx--date-picker__input--xl={size === "xl"}
      on:input
      on:input={({ target }) => {
        updateValue({ type: "input", value: target.value });
      }}
      on:change={({ target }) => {
        updateValue({ type: "change", value: target.value });
      }}
      on:keydown
      on:keydown={({ key }) => {
        if (key === "ArrowDown") {
          focusCalendar();
        }
      }}
      on:keyup
      on:blur
      on:blur={({ relatedTarget }) => {
        blurInput(relatedTarget);
      }}
      on:paste
    />
    {#if invalid}
      <WarningFilled
        class="bx--date-picker__icon bx--date-picker__icon--invalid"
      />
    {/if}
    {#if !invalid && warn}
      <WarningAltFilled
        class="bx--date-picker__icon bx--date-picker__icon--warn"
      />
    {/if}
    {#if $hasCalendar && !invalid && !warn}
      <Calendar
        class="bx--date-picker__icon"
        aria-label={iconDescription}
        on:click={openCalendar}
      />
    {/if}
  </div>
  {#if invalid}
    <div class:bx--form-requirement={true}>{invalidText}</div>
  {/if}
  {#if !invalid && warn}
    <div class:bx--form-requirement={true}>{warnText}</div>
  {/if}
  {#if !invalid && !warn && helperText}
    <div
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
</div>
