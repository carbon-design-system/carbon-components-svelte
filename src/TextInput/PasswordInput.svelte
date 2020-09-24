<script>
  /**
   * Set the size of the input
   * @type {"sm" | "xl"} [size]
   */
  export let size = undefined;

  /**
   * Specify the input value
   * @type {string} [value=""]
   */
  export let value = "";

  /**
   * Specify the input type
   * @type {string} [type="password"]
   */
  export let type = "password";

  /**
   * Specify the placeholder text
   * @type {string} [placeholder=""]
   */
  export let placeholder = "";

  /**
   * Specify the hide password label text
   * @type {string} [hidePasswordLabel="Hide password"]
   */
  export let hidePasswordLabel = "Hide password";

  /**
   * Specify the show password label text
   * @type {string} [showPasswordLabel="Show password"]
   */
  export let showPasswordLabel = "Show password";

  /**
   * Set the alignment of the tooltip relative to the icon
   * @type {"start" | "center" | "end"} [tooltipAlignment="center"]
   */
  export let tooltipAlignment = undefined;

  /**
   * Set the position of the tooltip relative to the icon
   * @type {"top" | "right" | "bottom" | "left"} [tooltipPosition="bottom"]
   */
  export let tooltipPosition = undefined;

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
   * Specify the helper text
   * @type {string} [helperText=""]
   */
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
   * Specify the text for the invalid state
   * @type {string} [invalidText=""]
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

  import WarningFilled16 from "carbon-icons-svelte/lib/WarningFilled16";
  import View16 from "carbon-icons-svelte/lib/View16";
  import ViewOff16 from "carbon-icons-svelte/lib/ViewOff16";

  $: errorId = `error-${id}`;
</script>

<div
  class:bx--form-item="{true}"
  class:bx--text-input-wrapper="{true}"
  class:bx--password-input-wrapper="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
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
  <div
    class:bx--text-input__field-wrapper="{true}"
    data-invalid="{invalid || undefined}"
  >
    {#if invalid}
      <WarningFilled16 class="bx--text-input__invalid-icon" />
    {/if}
    <input
      bind:this="{ref}"
      data-invalid="{invalid || undefined}"
      aria-invalid="{invalid || undefined}"
      aria-describedby="{invalid ? errorId : undefined}"
      id="{id}"
      name="{name}"
      placeholder="{placeholder}"
      type="{type}"
      value="{value}"
      disabled="{disabled}"
      class:bx--text-input="{true}"
      class:bx--password-input="{true}"
      class:bx--text-input--light="{light}"
      class:bx--text-input--invalid="{invalid}"
      class="{size && `bx--text-input--${size}`}"
      on:change
      on:input
      on:input="{({ target }) => {
        value = target.value;
      }}"
      on:keydown
      on:focus
      on:blur
    />
    <button
      type="button"
      class:bx--text-input--password__visibility__toggle="{true}"
      class:bx--btn--icon-only="{true}"
      class:bx--tooltip__trigger="{true}"
      class:bx--tooltip--a11y="{true}"
      class="{tooltipPosition && `bx--tooltip--${tooltipPosition}`}
        {tooltipAlignment && `bx--tooltip--align-${tooltipAlignment}`}"
      on:click="{() => {
        type = type === 'password' ? 'text' : 'password';
      }}"
    >
      <span class:bx--assistive-text="{true}">
        {#if type === 'text'}{hidePasswordLabel}{:else}{showPasswordLabel}{/if}
      </span>
      {#if type === 'text'}
        <ViewOff16 class="bx--icon-visibility-off" />
      {:else}
        <View16 class="bx--icon-visibility-on" />
      {/if}
    </button>
  </div>
  {#if !invalid && helperText}
    <div
      class:bx--form__helper-text="{true}"
      class:bx--form__helper-text--disabled="{disabled}"
    >
      {helperText}
    </div>
  {/if}
  {#if invalid}
    <div class:bx--form-requirement="{true}" id="{errorId}">{invalidText}</div>
  {/if}
</div>
