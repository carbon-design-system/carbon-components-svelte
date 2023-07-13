<script>
  /**
   * Set the size of the input
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /** Specify the input type */
  export let type = "text";

  /** Specify the input placeholder text */
  export let placeholder = "";

  /** Specify the Regular Expression for the input value */
  export let pattern = "\\d{1,2}\\/\\d{1,2}\\/\\d{4}";

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Specify the ARIA label for the calendar icon */
  export let iconDescription = "";

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate an warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /**
   * Set a name for the input element
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  import { getContext } from "svelte";
  import Calendar from "../icons/Calendar.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";

  const {
    range,
    add,
    hasCalendar,
    declareRef,
    inputIds,
    updateValue,
    blurInput,
    openCalendar,
    focusCalendar,
    inputValue,
    inputValueFrom,
    inputValueTo,
  } = getContext("DatePicker");

  add({ id, labelText });

  $: if (ref) declareRef({ id, ref });
</script>

<div
  class:bx--date-picker-container="{true}"
  class:bx--date-picker--nolabel="{!labelText}"
>
  {#if labelText || $$slots.labelText}
    <label
      for="{id}"
      class:bx--label="{true}"
      class:bx--visually-hidden="{hideLabel}"
      class:bx--label--disabled="{disabled}"
    >
      <slot name="labelText">
        {labelText}
      </slot>
    </label>
  {/if}
  <div
    class:bx--date-picker-input__wrapper="{true}"
    class:bx--date-picker-input__wrapper--invalid="{invalid}"
    class:bx--date-picker-input__wrapper--warn="{warn}"
  >
    <input
      bind:this="{ref}"
      data-invalid="{invalid || undefined}"
      id="{id}"
      name="{name}"
      placeholder="{placeholder}"
      type="{type}"
      pattern="{pattern}"
      disabled="{disabled}"
      {...$$restProps}
      value="{$range
        ? $inputIds.indexOf(id) === 0
          ? $inputValueFrom
          : $inputValueTo
        : $inputValue}"
      class:bx--date-picker__input="{true}"
      class:bx--date-picker__input--invalid="{invalid}"
      class:bx--date-picker__input--sm="{size === 'sm'}"
      class:bx--date-picker__input--xl="{size === 'xl'}"
      on:input
      on:input="{({ target }) => {
        updateValue({ type: 'input', value: target.value });
      }}"
      on:change="{({ target }) => {
        updateValue({ type: 'change', value: target.value });
      }}"
      on:keydown
      on:keydown="{({ key }) => {
        if (key === 'ArrowDown') {
          focusCalendar();
        }
      }}"
      on:keyup
      on:blur
      on:blur="{({ relatedTarget }) => {
        blurInput(relatedTarget);
      }}"
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
        aria-label="{iconDescription}"
        on:click="{openCalendar}"
      />
    {/if}
  </div>
  {#if invalid}
    <div class:bx--form-requirement="{true}">{invalidText}</div>
  {/if}
  {#if !invalid && warn}
    <div class:bx--form-requirement="{true}">{warnText}</div>
  {/if}
  {#if !invalid && !warn && helperText}
    <div
      class:bx--form__helper-text="{true}"
      class:bx--form__helper-text--disabled="{disabled}"
    >
      {helperText}
    </div>
  {/if}
</div>
