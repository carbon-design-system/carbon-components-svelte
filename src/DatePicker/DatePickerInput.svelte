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

  /**
   * Set a name for the input element
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import Calendar16 from "carbon-icons-svelte/lib/Calendar16";

  const {
    range,
    add,
    hasCalendar,
    declareRef,
    updateValue,
    blurInput,
    openCalendar,
    focusCalendar,
    inputValue,
  } = getContext("DatePicker");

  add({ id, labelText });

  onMount(() => {
    declareRef({ id, ref });
  });
</script>

<div
  class:bx--date-picker-container="{true}"
  class:bx--date-picker--nolabel="{!labelText}"
  {...$$restProps}
>
  {#if labelText}
    <label
      for="{id}"
      class:bx--label="{true}"
      class:bx--visually-hidden="{hideLabel}"
      class:bx--label--disabled="{disabled}"
    >
      {labelText}
    </label>
  {/if}
  <div class:bx--date-picker-input__wrapper="{true}">
    <input
      bind:this="{ref}"
      data-invalid="{invalid || undefined}"
      value="{!$range ? $inputValue : undefined}"
      id="{id}"
      name="{name}"
      placeholder="{placeholder}"
      type="{type}"
      pattern="{pattern}"
      disabled="{disabled}"
      class:bx--date-picker__input="{true}"
      class="{size && `bx--date-picker__input--${size}`}"
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
      on:blur
      on:blur="{({ relatedTarget }) => {
        blurInput(relatedTarget);
      }}"
    />
    {#if $hasCalendar}
      <Calendar16
        role="img"
        class="bx--date-picker__icon"
        aria-label="{iconDescription}"
        title="{iconDescription}"
        on:click="{openCalendar}"
      />
    {/if}
  </div>
  {#if invalid}
    <div class:bx--form-requirement="{true}">{invalidText}</div>
  {/if}
</div>
