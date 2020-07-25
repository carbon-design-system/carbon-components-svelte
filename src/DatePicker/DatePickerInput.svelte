<script>
  export let size = undefined; // "sm" | "xl"
  export let type = "text";
  export let placeholder = "";
  export let pattern = "\\d{1,2}\\/\\d{1,2}\\/\\d{4}";
  export let disabled = false;
  export let iconDescription = "";

  /**
   * Set an id for the input element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);
  export let labelText = "";
  export let hideLabel = false;
  export let invalid = false;
  export let invalidText = "";
  export let name = undefined;

  /**
   * Obtain a reference to the input HTML element
   * @type {null | HTMLElement} [ref=null]
   */
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
  class:bx--date-picker-container={true}
  class:bx--date-picker--nolabel={!labelText}
  {...$$restProps}>
  {#if labelText}
    <label
      for={id}
      class:bx--label={true}
      class:bx--visually-hidden={hideLabel}
      class:bx--label--disabled={disabled}>
      {labelText}
    </label>
  {/if}
  <div class:bx--date-picker-input__wrapper={true}>
    <input
      bind:this={ref}
      data-invalid={invalid || undefined}
      value={!$range ? $inputValue : undefined}
      {id}
      {name}
      {placeholder}
      {type}
      {pattern}
      {disabled}
      class:bx--date-picker__input={true}
      class={size && `bx--date-picker__input--${size}`}
      on:input
      on:input={({ target }) => {
        updateValue({ type: 'input', value: target.value });
      }}
      on:change={({ target }) => {
        updateValue({ type: 'change', value: target.value });
      }}
      on:keydown
      on:keydown={({ key }) => {
        if (key === 'ArrowDown') {
          focusCalendar();
        }
      }}
      on:blur
      on:blur={({ relatedTarget }) => {
        blurInput(relatedTarget);
      }} />
    {#if $hasCalendar}
      <Calendar16
        role="img"
        class="bx--date-picker__icon"
        aria-label={iconDescription}
        title={iconDescription}
        on:click={openCalendar} />
    {/if}
  </div>
  {#if invalid}
    <div class:bx--form-requirement={true}>{invalidText}</div>
  {/if}
</div>
