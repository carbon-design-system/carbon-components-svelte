<script>
  /**
   * Specify the textarea value.
   * @type {null | string}
   */
  export let value = "";

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Specify the number of cols */
  export let cols = 50;

  /** Specify the number of rows */
  export let rows = 4;

  /**
   * Specify the max character count
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

  /** Set an id for the textarea element */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the input
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the textarea HTML element */
  export let ref = null;

  import WarningFilled from "../icons/WarningFilled.svelte";

  $: errorId = `error-${id}`;
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
>
  {#if (labelText || $$slots.labelText)}
    <div class:bx--text-area__label-wrapper={true}>
      <label
        for={id}
        class:bx--label={true}
        class:bx--visually-hidden={hideLabel}
        class:bx--label--disabled={disabled}
      >
        <slot name="labelText">
          {labelText}
        </slot>
      </label>
      {#if maxCount}
        <div class:bx--label={true} class:bx--label--disabled={disabled}>
          {(value ?? "").length}/{maxCount}
        </div>
      {/if}
    </div>
  {/if}
  <div class:bx--text-area__wrapper={true} data-invalid={invalid || undefined}>
    {#if invalid}
      <WarningFilled class="bx--text-area__invalid-icon" />
    {/if}
    <textarea
      bind:this={ref}
      bind:value
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      {disabled}
      {id}
      {name}
      {cols}
      {rows}
      {placeholder}
      {readonly}
      class:bx--text-area={true}
      class:bx--text-area--light={light}
      class:bx--text-area--invalid={invalid}
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
  </div>
  {#if !invalid && helperText}
    <div
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
  {#if invalid}
    <div id={errorId} class:bx--form-requirement={true}>{invalidText}</div>
  {/if}
</div>
