<script>
  export let size = undefined; // "sm" | "xl"
  export let type = "";
  export let value = "";
  export let placeholder = "";

  /**
   * Set to `true` to enable the light variant
   * @type {boolean} [light=false]
   */
  export let light = false;

  export let disabled = false;

  /**
   * Set an id for the input element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);
  export let name = undefined;
  export let helperText = "";
  /**
   * Specify the label text
   * @type {string} [labelText=""]
   */
  export let labelText = "";

  /**
   * Set to `true` to visually hide the label text
   * @type {boolean} [hideLabel=false]
   */
  export let hideLabel = false;

  /**
   * Set to `true` to indicate an invalid state
   * @type {boolean} [invalid=false]
   */
  export let invalid = false;

  /**
   * Specify the invalid state text
   * @type {string} [invalidText=""]
   */
  export let invalidText = "";

  export let ref = null;

  import WarningFilled16 from "carbon-icons-svelte/lib/WarningFilled16";

  $: errorId = `error-${id}`;
</script>

<div
  class:bx--form-item={true}
  class:bx--text-input-wrapper={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  {#if labelText}
    <label
      for={id}
      class:bx--label={true}
      class:bx--visually-hidden={hideLabel}
      class:bx--label--disabled={disabled}>
      {labelText}
    </label>
  {/if}
  {#if helperText}
    <div
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}>
      {helperText}
    </div>
  {/if}
  <div
    data-invalid={invalid || undefined}
    class:bx--text-input__field-wrapper={true}>
    {#if invalid}
      <WarningFilled16 class="bx--text-input__invalid-icon" />
    {/if}
    <input
      bind:this={ref}
      data-invalid={invalid || undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      {disabled}
      {id}
      {name}
      {placeholder}
      {type}
      {value}
      class:bx--text-input={true}
      class:bx--text-input--light={light}
      class:bx--text-input--invalid={invalid}
      class={size && `bx--text-input--${size}`}
      on:change
      on:input
      on:input={({ target }) => {
        value = target.value;
      }}
      on:focus
      on:blur />
  </div>
  {#if invalid}
    <div class:bx--form-requirement={true} id={errorId}>{invalidText}</div>
  {/if}
</div>
