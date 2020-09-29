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
   * @type {string} [type=""]
   */
  export let type = "";

  /**
   * Specify the placeholder text
   * @type {string} [placeholder=""]
   */
  export let placeholder = "";

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

  /**
   * Set to `true` to indicate an warning state
   * @type {boolean} [warn=false]
   */
  export let warn = false;

  /**
   * Specify the warning state text
   * @type {string} [warnText=""]
   */
  export let warnText = "";

  /**
   * Obtain a reference to the input HTML element
   * @type {null | HTMLInputElement} [ref=null]
   */
  export let ref = null;

  /**
   * Set to `true` to mark the field as required
   * @type {boolean} [required=false]
   */
  export let required = false;

  /**
   * Set to `true` to use inline version
   * @type {boolean} [inline=false]
   */
  export let inline = false;

  import { getContext } from "svelte";
  import WarningFilled16 from "carbon-icons-svelte/lib/WarningFilled16";
  import WarningAltFilled16 from "carbon-icons-svelte/lib/WarningAltFilled16";

  const ctx = getContext("Form");

  $: isFluid = !!ctx && ctx.isFluid;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
</script>

<div
  class:bx--form-item="{true}"
  class:bx--text-input-wrapper="{true}"
  class:bx--text-input-wrapper--inline="{inline}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if inline}
    <div class="bx--text-input__label-helper-wrapper">
      {#if labelText}
        <label
          for="{id}"
          class:bx--label="{true}"
          class:bx--visually-hidden="{hideLabel}"
          class:bx--label--disabled="{disabled}"
          class:bx--label--inline="{inline}"
          class="{inline && !!size && `bx--label--inline--${size}`}"
        >
          {labelText}
        </label>
      {/if}
      {#if !isFluid && helperText}
        <div
          class:bx--form__helper-text="{true}"
          class:bx--form__helper-text--disabled="{disabled}"
          class:bx--form__helper-text--inline="{inline}"
        >
          {helperText}
        </div>
      {/if}
    </div>
  {/if}
  {#if !inline && labelText}
    <label
      for="{id}"
      class:bx--label="{true}"
      class:bx--visually-hidden="{hideLabel}"
      class:bx--label--disabled="{disabled}"
      class:bx--label--inline="{inline}"
      class="{inline && !!size && `bx--label--inline--${size}`}"
    >
      {labelText}
    </label>
  {/if}
  <div
    class:bx--text-input__field-outer-wrapper="{true}"
    class:bx--text-input__field-outer-wrapper--inline="{inline}"
  >
    <div
      data-invalid="{invalid || undefined}"
      data-warn="{warn || undefined}"
      class:bx--text-input__field-wrapper="{true}"
    >
      {#if invalid}
        <WarningFilled16 class="bx--text-input__invalid-icon" />
      {/if}
      {#if !invalid && warn}
        <WarningAltFilled16
          class="bx--text-input__invalid-icon
            bx--text-input__invalid-icon--warning"
        />
      {/if}
      <input
        bind:this="{ref}"
        data-invalid="{invalid || undefined}"
        aria-invalid="{invalid || undefined}"
        data-warn="{warn || undefined}"
        aria-describedby="{invalid ? errorId : warn ? warnId : undefined}"
        disabled="{disabled}"
        id="{id}"
        name="{name}"
        placeholder="{placeholder}"
        type="{type}"
        value="{value}"
        required="{required}"
        class:bx--text-input="{true}"
        class:bx--text-input--light="{light}"
        class:bx--text-input--invalid="{invalid}"
        class:bx--text-input--warn="{warn}"
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
      {#if isFluid}
        <hr className="bx--text-input__divider" />
      {/if}
      {#if isFluid && !inline && invalid}
        <div class:bx--form-requirement="{true}" id="{errorId}">
          {invalidText}
        </div>
      {/if}
      {#if isFluid && !inline && warn}
        <div class:bx--form-requirement="{true}" id="{warnId}">{warnText}</div>
      {/if}
    </div>
    {#if !invalid && !warn && !isFluid && !inline && helperText}
      <div
        class:bx--form__helper-text="{true}"
        class:bx--form__helper-text--disabled="{disabled}"
        class:bx--form__helper-text--inline="{inline}"
      >
        {helperText}
      </div>
    {/if}
    {#if !isFluid && invalid}
      <div class:bx--form-requirement="{true}" id="{errorId}">
        {invalidText}
      </div>
    {/if}
    {#if !isFluid && !invalid && warn}
      <div class:bx--form-requirement="{true}" id="{warnId}">{warnText}</div>
    {/if}
  </div>
</div>
