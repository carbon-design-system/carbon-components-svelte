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

  /**
   * Set to `"text"` to toggle the password visibility
   * @type {"text" | "password"}
   */
  export let type = "password";

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Specify the hide password label text */
  export let hidePasswordLabel = "Hide password";

  /** Specify the show password label text */
  export let showPasswordLabel = "Show password";

  /**
   * Set the alignment of the tooltip relative to the icon
   * @type {"start" | "center" | "end"}
   */
  export let tooltipAlignment = "center";

  /**
   * Set the position of the tooltip relative to the icon
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let tooltipPosition = "bottom";

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the text for the invalid state */
  export let invalidText = "";

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the input
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  import { getContext } from "svelte";
  import WarningFilled16 from "carbon-icons-svelte/lib/WarningFilled16/WarningFilled16.svelte";
  import View16 from "carbon-icons-svelte/lib/View16/View16.svelte";
  import ViewOff16 from "carbon-icons-svelte/lib/ViewOff16/ViewOff16.svelte";

  const ctx = getContext("Form");

  $: isFluid = !!ctx && ctx.isFluid;
  $: errorId = `error-${id}`;
</script>

<div
  class:bx--form-item="{true}"
  class:bx--text-input-wrapper="{true}"
  class:bx--password-input-wrapper="{!isFluid}"
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
      {...$$restProps}
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
      disabled="{disabled}"
      class:bx--text-input--password__visibility__toggle="{true}"
      class:bx--btn="{true}"
      class:bx--btn--icon-only="{true}"
      class:bx--btn--disabled="{disabled}"
      class:bx--tooltip__trigger="{true}"
      class:bx--tooltip--a11y="{true}"
      class="{tooltipPosition &&
        `bx--tooltip--${tooltipPosition}`}
        {tooltipAlignment &&
        `bx--tooltip--align-${tooltipAlignment}`}"
      on:click="{() => {
        type = type === 'password' ? 'text' : 'password';
      }}"
    >
      {#if !disabled}
        <span class:bx--assistive-text="{true}">
          {#if type === "text"}
            {hidePasswordLabel}
          {:else}{showPasswordLabel}{/if}
        </span>
      {/if}
      {#if type === "text"}
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
