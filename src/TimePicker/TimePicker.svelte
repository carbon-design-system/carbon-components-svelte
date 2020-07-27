<script>
  /**
   * Specify the input value
   * @type {string} [value=""]
   */
  export let value = "";

  /**
   * Specify the input type
   * @type {string} [type="text"]
   */
  export let type = "text";

  /**
   * Specify the input placeholder text
   * @type {string} [placeholder="hh=mm"]
   */
  export let placeholder = "hh=mm";

  /**
   * Specify the `pattern` attribute for the input element
   * @type {string} [pattern="(1[012]|[1-9]):[0-5][0-9](\\s)?"]
   */
  export let pattern = "(1[012]|[1-9]):[0-5][0-9](\\s)?";

  /**
   * Specify the `maxlength` input attribute
   * @type {number} [maxLength=5]
   */
  export let maxlength = 5;

  /**
   * Set to `true` to enable the light variant
   * @type {boolean} [light=false]
   */
  export let light = false;

  /**
   * Set to `true` to disable the input
   * @type {boolean} [disabled=false]
   */
  export let disabled = false;

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
   * @type {string} [invalidText="Invalid time format."]
   */
  export let invalidText = "";

  /**
   * Set an id for the input element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the input
   * @type {string} [name]
   */
  export let name = undefined;

  /**
   * Obtain a reference to the input HTML element
   * @type {null | HTMLInputElement} [ref=null]
   */
  export let ref = null;
</script>

<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <div
    class:bx--time-picker={true}
    class:bx--time-picker--light={light}
    class:bx--select--light={light}>
    <div class:bx--time-picker__input={true}>
      {#if labelText}
        <label
          for={id}
          class:bx--label={true}
          class:bx--visually-hidden={hideLabel}
          class:bx--label--disabled={disabled}>
          {labelText}
        </label>
      {/if}
      <input
        bind:this={ref}
        data-invalid={invalid || undefined}
        {pattern}
        {placeholder}
        {maxlength}
        {id}
        {name}
        {type}
        {value}
        {disabled}
        class:bx--time-picker__input-field={true}
        class:bx--text-input={true}
        class:bx--text-input--light={light}
        class:bx--text-input--invalid={invalid}
        on:change
        on:input
        on:input={({ target }) => {
          value = target.value;
        }}
        on:focus
        on:blur />
    </div>
    <slot />
  </div>
  {#if invalid}
    <div class:bx--form-requirement={true}>{invalidText}</div>
  {/if}
</div>
