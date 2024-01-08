<script>
  /**
   * Set the size of the input
   * @type {"sm" | "lg"}
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

  /** Set to `true` to indicate an warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Set to `true` to use inline version */
  export let inline = false;

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
  import WarningFilled from "../icons/WarningFilled.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import View from "../icons/View.svelte";
  import ViewOff from "../icons/ViewOff.svelte";

  const ctx = getContext("Form");

  $: isFluid = !!ctx && ctx.isFluid;
  $: helperId = `helper-${id}`;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:cds--form-item="{true}"
  class:cds--text-input-wrapper="{true}"
  class:cds--password-input-wrapper="{!isFluid}"
  class:cds--text-input-wrapper--light="{light}"
  class:cds--text-input-wrapper--inline="{inline}"
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if inline}
    <label
      for="{id}"
      class:cds--label="{true}"
      class:cds--visually-hidden="{hideLabel}"
      class:cds--label--disabled="{disabled}"
      class:cds--label--inline="{inline}"
      class:cds--label--inline--sm="{inline && size === 'sm'}"
      class:cds--label--inline--lg="{inline &&
        (size === 'lg' || size === 'xl')}"
    >
      <slot name="labelText">
        {labelText}
      </slot>
    </label>
    {#if !isFluid && helperText}
      <div
        id="{helperId}"
        class:cds--form__helper-text="{true}"
        class:cds--form__helper-text--disabled="{disabled}"
        class:cds--form__helper-text--inline="{inline}"
      >
        {helperText}
      </div>
    {/if}
  {/if}
  {#if !inline && (labelText || $$slots.labelText)}
    <label
      for="{id}"
      class:cds--label="{true}"
      class:cds--visually-hidden="{hideLabel}"
      class:cds--label--disabled="{disabled}"
      class:cds--label--inline="{inline}"
      class:cds--label--inline--sm="{inline && size === 'sm'}"
      class:cds--label--inline--lg="{inline &&
        (size === 'lg' || size === 'xl')}"
    >
      <slot name="labelText">
        {labelText}
      </slot>
    </label>
  {/if}
  <div
    class:cds--text-input__field-outer-wrapper="{true}"
    class:cds--text-input__field-outer-wrapper--inline="{inline}"
  >
    <div
      class:cds--text-input__field-wrapper="{true}"
      class:cds--text-input__field-wrapper--warning="{warn}"
      data-invalid="{invalid || undefined}"
    >
      {#if invalid}
        <WarningFilled class="cds--text-input__invalid-icon" />
      {/if}
      {#if !invalid && warn}
        <WarningAltFilled
          class="cds--text-input__invalid-icon
            cds--text-input__invalid-icon--warning"
        />
      {/if}
      <input
        bind:this="{ref}"
        data-invalid="{invalid || undefined}"
        aria-invalid="{invalid || undefined}"
        aria-describedby="{invalid
          ? errorId
          : warn
          ? warnId
          : helperText
          ? helperId
          : undefined}"
        id="{id}"
        name="{name}"
        placeholder="{placeholder}"
        type="{type}"
        value="{value ?? ''}"
        disabled="{disabled}"
        class:cds--text-input="{true}"
        class:cds--password-input="{true}"
        class:cds--text-input--light="{light}"
        class:cds--text-input--invalid="{invalid}"
        class:cds--text-input--warning="{warn}"
        class:cds--text-input--sm="{size === 'sm'}"
        class:cds--text-input--lg="{size === 'lg' || size === 'xl'}"
        {...$$restProps}
        on:change
        on:input
        on:input="{({ target }) => {
          value = target.value;
        }}"
        on:keydown
        on:keyup
        on:focus
        on:blur
        on:paste
      />
      {#if isFluid && invalid}
        <hr class="cds--text-input__divider" />
        <div class="cds--form-requirement" id="{errorId}">
          {invalidText}
        </div>
      {/if}
      {#if !(isFluid && invalid)}
        <button
          type="button"
          disabled="{disabled}"
          class:cds--text-input--password__visibility__toggle="{true}"
          class:cds--btn="{true}"
          class:cds--btn--icon-only="{true}"
          class:cds--btn--disabled="{disabled}"
          class:cds--tooltip__trigger="{true}"
          class:cds--tooltip--a11y="{true}"
          class:cds--tooltip--top="{tooltipPosition === 'top'}"
          class:cds--tooltip--right="{tooltipPosition === 'right'}"
          class:cds--tooltip--bottom="{tooltipPosition === 'bottom'}"
          class:cds--tooltip--left="{tooltipPosition === 'left'}"
          class:cds--tooltip--align-start="{tooltipAlignment === 'start'}"
          class:cds--tooltip--align-center="{tooltipAlignment === 'center'}"
          class:cds--tooltip--align-end="{tooltipAlignment === 'end'}"
          on:click="{() => {
            type = type === 'password' ? 'text' : 'password';
          }}"
        >
          {#if !disabled}
            <span class:cds--assistive-text="{true}">
              {#if type === "text"}
                {hidePasswordLabel}
              {:else}{showPasswordLabel}{/if}
            </span>
          {/if}
          {#if type === "text"}
            <ViewOff class="cds--icon-visibility-off" />
          {:else}
            <View class="cds--icon-visibility-on" />
          {/if}
        </button>
      {/if}
    </div>
    {#if !isFluid && invalid}
      <div class:cds--form-requirement="{true}" id="{errorId}">
        {invalidText}
      </div>
    {/if}
    {#if !invalid && !warn && !isFluid && !inline && helperText}
      <div
        class:cds--form__helper-text="{true}"
        class:cds--form__helper-text--disabled="{disabled}"
        class:cds--form__helper-text--inline="{inline}"
      >
        {helperText}
      </div>
    {/if}
    {#if !isFluid && !invalid && warn}
      <div class:cds--form-requirement="{true}" id="{warnId}">{warnText}</div>
    {/if}
  </div>
</div>
