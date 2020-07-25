<script>
  export let size = undefined; // "sm" | "xl"
  export let type = "password";
  export let value = "";
  export let hidePasswordLabel = "Hide password";
  export let showPasswordLabel = "Show password";

  /**
   * Set to `true` to enable the light variant
   * @type {boolean} [light=false]
   */
  export let light = false;

  export let disabled = false;
  export let placeholder = "";
  export let helperText = "";

  /**
   * Set an id for the input element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);
  export let name = undefined;
  export let invalid = false;
  export let invalidText = "";

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
  export let tooltipAlignment = "center";
  export let tooltipPosition = "bottom";
  export let ref = null;

  import WarningFilled16 from "carbon-icons-svelte/lib/WarningFilled16";
  import View16 from "carbon-icons-svelte/lib/View16";
  import ViewOff16 from "carbon-icons-svelte/lib/ViewOff16";

  $: errorId = `error-${id}`;
</script>

<div
  class:bx--form-item={true}
  class:bx--text-input-wrapper={true}
  class:bx--password-input-wrapper={true}
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
    class:bx--text-input__field-wrapper={true}
    data-invalid={invalid || undefined}>
    {#if invalid}
      <WarningFilled16 class="bx--text-input__invalid-icon" />
    {/if}
    <input
      bind:this={ref}
      data-invalid={invalid || undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      {id}
      {name}
      {placeholder}
      {type}
      {value}
      {disabled}
      class:bx--text-input={true}
      class:bx--password-input={true}
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
    <button
      type="button"
      class:bx--text-input--password__visibility__toggle={true}
      class:bx--btn--icon-only={true}
      class:bx--tooltip__trigger={true}
      class:bx--tooltip--a11y={true}
      class="{tooltipPosition && `bx--tooltip--${tooltipPosition}`}
      {tooltipAlignment && `bx--tooltip--align-${tooltipAlignment}`}"
      on:click={() => {
        type = type === 'password' ? 'text' : 'password';
      }}>
      <span class:bx--assistive-text={true}>
        {#if type === 'text'}{hidePasswordLabel}{:else}{showPasswordLabel}{/if}
      </span>
      {#if type === 'text'}
        <ViewOff16 class="bx--icon-visibility-off" />
      {:else}
        <View16 class="bx--icon-visibility-on" />
      {/if}
    </button>
  </div>
  {#if invalid}
    <div class:bx--form-requirement={true} id={errorId}>{invalidText}</div>
  {/if}
</div>
