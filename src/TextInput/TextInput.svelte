<script>
  /**
   * Set the size of the input
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /**
   * Specify the input value
   * @type {number | string}
   */
  export let value = "";

  /** Specify the input type */
  export let type = "";

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the input
   * @type {string}
   */
  export let name = undefined;

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

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  /** Set to `true` to mark the field as required */
  export let required = false;

  /** Set to `true` to use the inline variant */
  export let inline = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  import { getContext } from "svelte";
  import WarningFilled16 from "../icons/WarningFilled16.svelte";
  import WarningAltFilled16 from "../icons/WarningAltFilled16.svelte";
  import EditOff16 from "../icons/EditOff16.svelte";

  const ctx = getContext("Form");

  $: isFluid = !!ctx && ctx.isFluid;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class:bx--form-item="{true}"
  class:bx--text-input-wrapper="{true}"
  class:bx--text-input-wrapper--inline="{inline}"
  class:bx--text-input-wrapper--light="{light}"
  class:bx--text-input-wrapper--readonly="{readonly}"
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if inline}
    <div class:bx--text-input__label-helper-wrapper="{true}">
      {#if labelText}
        <label
          for="{id}"
          class:bx--label="{true}"
          class:bx--visually-hidden="{hideLabel}"
          class:bx--label--disabled="{disabled}"
          class:bx--label--inline="{inline}"
          class="{inline && !!size && `bx--label--inline--${size}`}"
        >
          <slot name="labelText">
            {labelText}
          </slot>
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
      <slot name="labelText">
        {labelText}
      </slot>
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
      class:bx--text-input__field-wrapper--warning="{!invalid && warn}"
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
      {#if readonly}
        <EditOff16 class="bx--text-input__readonly-icon" />
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
        value="{value ?? ''}"
        required="{required}"
        readonly="{readonly}"
        class:bx--text-input="{true}"
        class:bx--text-input--light="{light}"
        class:bx--text-input--invalid="{invalid}"
        class:bx--text-input--warn="{warn}"
        {...$$restProps}
        class="{size && `bx--text-input--${size}`}"
        on:change
        on:input
        on:input="{({ target }) => {
          value = type === 'number' ? Number(target.value) : target.value;
        }}"
        on:keydown
        on:keyup
        on:focus
        on:blur
      />
      {#if isFluid}
        <hr class:bx--text-input__divider="{true}" />
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
