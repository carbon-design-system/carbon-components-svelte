<script>
  /**
   * Specify the size of the input.
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /**
   * Specify the input value.
   * @type {string}
   */
  export let value = "";

  /** Specify the input placeholder text */
  export let placeholder = "hh:mm";

  /** Specify the `pattern` attribute for the input element */
  export let pattern = "(1[012]|[1-9]):[0-5][0-9](\\s)?";

  /** Specify the `maxlength` input attribute */
  export let maxlength = 5;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the input */
  export let disabled = false;

  /** Set to `true` to mark the input as read-only */
  export let readonly = false;

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

  /** Specify the helper text */
  export let helperText = "";

  /** Set an id for the input element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Specify a name attribute for the input.
   * @type {string}
   */
  export let name = undefined;

  /** Obtain a reference to the input HTML element */
  export let ref = null;

  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import Stack from "../Stack/Stack.svelte";

  $: helperId = `helper-${id}`;
  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div
    class:bx--time-picker={true}
    class:bx--time-picker--light={light}
    class:bx--time-picker--invalid={invalid}
    class:bx--time-picker--warn={warn}
    class:bx--time-picker--readonly={readonly}
    class:bx--time-picker--sm={size === "sm"}
    class:bx--time-picker--xl={size === "xl"}
    class:bx--select--light={light}
  >
    <div class:bx--time-picker__input={true}>
      {#if labelText || $$slots.labelChildren}
        <label
          for={id}
          class:bx--label={true}
          class:bx--visually-hidden={hideLabel}
          class:bx--label--disabled={disabled}
          class:bx--label--readonly={readonly}
        >
          <slot name="labelChildren"> {labelText} </slot>
        </label>
      {/if}
      <Stack orientation="horizontal" gap={0}>
        <div
          data-invalid={invalid || undefined}
          data-warn={!invalid && warn ? true : undefined}
          class:bx--text-input__field-wrapper={true}
          class:bx--text-input__field-wrapper--warning={!invalid && warn}
          style:width="auto"
        >
          {#if !invalid && warn}
            <WarningAltFilled
              class="bx--text-input__invalid-icon bx--text-input__invalid-icon--warning"
            />
          {/if}
          <input
            bind:this={ref}
            bind:value
            type="text"
            data-invalid={invalid || undefined}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid
              ? errorId
              : warn
                ? warnId
                : helperText
                  ? helperId
                  : undefined}
            {pattern}
            {placeholder}
            {maxlength}
            {id}
            {name}
            {disabled}
            readonly={readonly || undefined}
            {...$$restProps}
            class:bx--time-picker__input-field={true}
            class:bx--text-input={true}
            class:bx--text-input--light={light}
            class:bx--text-input--invalid={invalid}
            class:bx--text-input--warning={!invalid && warn}
            on:change
            on:input
            on:keydown
            on:keyup
            on:focus
            on:blur
            on:paste
          >
        </div>
        <slot />
      </Stack>
    </div>
  </div>
  {#if invalid}
    <div id={errorId} class:bx--form-requirement={true}>{invalidText}</div>
  {:else if warn}
    <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
  {:else if helperText}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={disabled}
    >
      {helperText}
    </div>
  {/if}
</div>
