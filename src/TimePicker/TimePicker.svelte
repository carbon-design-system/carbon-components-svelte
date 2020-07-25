<script>
  export let value = "";
  export let type = "text";
  export let placeholder = "hh=mm";
  export let pattern = "(1[012]|[1-9]):[0-5][0-9](\\s)?";
  export let maxlength = 5;

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
  export let invalid = false;
  export let invalidText = "Invalid time format.";
  export let labelText = "";
  export let hideLabel = false;
</script>

<div
  class:bx--form-item={true}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  {...$$restProps}>
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
        data-invalid={invalid || undefined}
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
        on:blur
        {pattern}
        {placeholder}
        {maxlength}
        {id}
        {name}
        {type}
        {value}
        {disabled} />
    </div>
    <slot />
  </div>
  {#if invalid}
    <div class:bx--form-requirement={true}>{invalidText}</div>
  {/if}
</div>
