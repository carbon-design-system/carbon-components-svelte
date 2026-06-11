<script>
  /**
   * Specify the textarea value.
   * @type {null | string}
   * @bindable writable
   */
  export let value = "";

  /** Specify the placeholder text */
  export let placeholder = "";

  /**
   * Specify the number of cols.
   * If specified, the textarea will not be resizable.
   * Override this using the `resize` style attribute.
   * @type {number}
   */
  export let cols = undefined;

  /** Specify the number of rows */
  export let rows = 4;

  /**
   * Specify the max character count.
   * @type {number}
   */
  export let maxCount = undefined;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

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

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   */
  export let fluid = false;

  /** Set an id for the textarea element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Specify a name attribute for the input.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the textarea HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { getContext } from "svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";

  const formContext = getContext("carbon:Form");

  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
  $: showInvalid = invalid && !disabled && !readonly;
  $: showWarn = warn && !invalid && !disabled && !readonly;
  $: isFluid = fluid || !!formContext?.isFluid;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class:bx--form-item={true}
  class:bx--text-area--fluid={isFluid}
>
  {#if labelText || $$slots.labelChildren}
    <div class:bx--text-area__label-wrapper={true}>
      <label
        for={id}
        class:bx--label={true}
        class:bx--visually-hidden={hideLabel && !isFluid}
        class:bx--label--disabled={disabled}
        class:bx--label--slotted={isFluid && $$slots.labelChildren}
      >
        <slot name="labelChildren"> {labelText} </slot>
      </label>
      {#if maxCount}
        <div
          class:bx--label={true}
          class:bx--label--disabled={disabled}
          class:bx--text-area__label-counter={true}
        >
          {(value ?? "").length}/{maxCount}
        </div>
      {/if}
    </div>
  {/if}
  <div
    class:bx--text-area__wrapper={true}
    class:bx--text-area__wrapper--readonly={readonly}
    class:bx--text-area__wrapper--warn={showWarn}
    data-invalid={showInvalid || undefined}
    data-warn={showWarn || undefined}
  >
    {#if showInvalid && !isFluid}
      <WarningFilled class="bx--text-area__invalid-icon" />
    {/if}
    {#if showWarn && !isFluid}
      <WarningAltFilled
        class="bx--text-area__invalid-icon
        bx--text-area__invalid-icon--warning"
      />
    {/if}
    <textarea
      bind:this={ref}
      bind:value
      aria-invalid={showInvalid || undefined}
      aria-describedby={showInvalid
        ? errorId
        : showWarn && !isFluid
          ? warnId
          : undefined}
      data-warn={showWarn || undefined}
      {disabled}
      {id}
      {name}
      {cols}
      {rows}
      {placeholder}
      {readonly}
      class:bx--text-area={true}
      class:bx--text-area--light={light}
      class:bx--text-area--invalid={showInvalid}
      class:bx--text-area--warning={showWarn}
      style:resize={typeof cols === "number" ? "none" : undefined}
      maxlength={maxCount ?? undefined}
      {...$$restProps}
      on:change
      on:input
      on:keydown
      on:keyup
      on:focus
      on:blur
      on:paste
    ></textarea>
    {#if isFluid}
      <hr class:bx--text-area__divider={true}>
      {#if showInvalid}
        <div id={errorId} class:bx--form-requirement={true}>
          {invalidText}
          <WarningFilled class="bx--text-area__invalid-icon" />
        </div>
      {/if}
      {#if showWarn}
        <div id={warnId} class:bx--form-requirement={true}>
          {warnText}
          <WarningAltFilled
            class="bx--text-area__invalid-icon
            bx--text-area__invalid-icon--warning"
          />
        </div>
      {/if}
    {/if}
  </div>
  {#if !isFluid && !showInvalid && !showWarn && helperText}
    <div
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
  {#if !isFluid && showInvalid}
    <div id={errorId} class:bx--form-requirement={true}>{invalidText}</div>
  {/if}
  {#if !isFluid && showWarn}
    <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
  {/if}
</div>
