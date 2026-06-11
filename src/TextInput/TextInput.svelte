<script>
  /**
   * @event {null | number | string} change
   * @event {null | number | string} input
   */

  /**
   * Set the size of the input.
   * @type {"xs" | "sm" | "xl"}
   */
  export let size = undefined;

  /**
   * Specify the input value.
   *
   * `value` will be set to `null` if type="number" and the value is empty.
   * @type {null | number | string}
   * @bindable writable
   */
  export let value = "";

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Set an id for the input element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Specify a name attribute for the input.
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

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /** Set to `true` to mark the field as required */
  export let required = false;

  /** Set to `true` to use the inline variant */
  export let inline = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   * Cannot be combined with the inline variant.
   */
  export let fluid = false;

  import { createEventDispatcher, getContext } from "svelte";
  import EditOff from "../icons/EditOff.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";

  const ctx = getContext("carbon:Form");
  const dispatch = createEventDispatcher();

  function parse(raw) {
    if ($$restProps.type !== "number") return raw;
    return raw === "" ? null : Number(raw);
  }

  /** @type {(e: Event) => void} */
  function onInput(event) {
    value = parse(event.target.value);
    dispatch("input", value);
  }

  /** @type {(e: Event) => void} */
  function onChange(event) {
    dispatch("change", parse(event.target.value));
  }

  $: showInvalid = invalid && !disabled && !readonly;
  $: showWarn = warn && !invalid && !disabled && !readonly;
  $: isFluid = !inline && (fluid || !!ctx?.isFluid);
  $: helperId = `helper-${id}`;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  class:bx--text-input-wrapper={true}
  class:bx--text-input-wrapper--inline={inline}
  class:bx--text-input-wrapper--light={light}
  class:bx--text-input-wrapper--readonly={readonly}
  class:bx--text-input--fluid={isFluid}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if inline}
    <div class:bx--text-input__label-helper-wrapper={true}>
      {#if labelText || $$slots.labelChildren}
        <label
          for={id}
          class:bx--label={true}
          class:bx--visually-hidden={hideLabel}
          class:bx--label--disabled={disabled}
          class:bx--label--inline={inline}
          class:bx--label--inline--xs={size === "xs"}
          class:bx--label--inline--sm={size === "sm"}
          class:bx--label--inline--xl={size === "xl"}
          class:bx--label--slotted={isFluid && $$slots.labelChildren}
        >
          <slot name="labelChildren"> {labelText} </slot>
        </label>
      {/if}
      {#if !isFluid && helperText}
        <div
          class:bx--form__helper-text={true}
          class:bx--form__helper-text--disabled={disabled}
          class:bx--form__helper-text--inline={inline}
        >
          {helperText}
        </div>
      {/if}
    </div>
  {/if}
  {#if !inline && (labelText || $$slots.labelChildren)}
    <label
      for={id}
      class:bx--label={true}
      class:bx--visually-hidden={hideLabel}
      class:bx--label--disabled={disabled}
      class:bx--label--inline={inline}
      class:bx--label--inline-sm={inline && size === "sm"}
      class:bx--label--inline-xl={inline && size === "xl"}
      class:bx--label--slotted={isFluid && $$slots.labelChildren}
    >
      <slot name="labelChildren"> {labelText} </slot>
    </label>
  {/if}
  <div
    class:bx--text-input__field-outer-wrapper={true}
    class:bx--text-input__field-outer-wrapper--inline={inline}
  >
    <div
      data-invalid={showInvalid || undefined}
      data-warn={showWarn || undefined}
      class:bx--text-input__field-wrapper={true}
      class:bx--text-input__field-wrapper--warning={showWarn}
    >
      {#if readonly}
        <EditOff class="bx--text-input__readonly-icon" />
      {:else}
        {#if showInvalid}
          <WarningFilled class="bx--text-input__invalid-icon" />
        {/if}
        {#if showWarn}
          <WarningAltFilled
            class="bx--text-input__invalid-icon
            bx--text-input__invalid-icon--warning"
          />
        {/if}
      {/if}
      <input
        bind:this={ref}
        data-invalid={showInvalid || undefined}
        aria-invalid={showInvalid || undefined}
        data-warn={showWarn || undefined}
        aria-describedby={showInvalid
          ? errorId
          : showWarn
            ? warnId
            : helperText && !isFluid
              ? helperId
              : undefined}
        {disabled}
        {id}
        {name}
        {placeholder}
        bind:value
        {required}
        {readonly}
        class:bx--text-input={true}
        class:bx--text-input--light={light}
        class:bx--text-input--invalid={showInvalid}
        class:bx--text-input--warning={showWarn}
        class:bx--text-input--xs={size === "xs"}
        class:bx--text-input--sm={size === "sm"}
        class:bx--text-input--xl={size === "xl"}
        {...$$restProps}
        on:change={onChange}
        on:input={onInput}
        on:keydown
        on:keyup
        on:focus
        on:blur
        on:paste
      >
      {#if isFluid}
        <hr class:bx--text-input__divider={true}>
      {/if}
      {#if isFluid && showInvalid}
        <div class:bx--form-requirement={true} id={errorId}>{invalidText}</div>
      {/if}
      {#if isFluid && showWarn}
        <div class:bx--form-requirement={true} id={warnId}>{warnText}</div>
      {/if}
    </div>
    {#if !showInvalid && !showWarn && !isFluid && !inline && helperText}
      <div
        id={helperId}
        class:bx--form__helper-text={true}
        class:bx--form__helper-text--disabled={disabled}
        class:bx--form__helper-text--inline={inline}
      >
        {helperText}
      </div>
    {/if}
    {#if !isFluid && showInvalid}
      <div class:bx--form-requirement={true} id={errorId}>{invalidText}</div>
    {/if}
    {#if !isFluid && showWarn}
      <div class:bx--form-requirement={true} id={warnId}>{warnText}</div>
    {/if}
  </div>
</div>
