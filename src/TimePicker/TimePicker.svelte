<script>
  /**
   * Specify the size of the input.
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /**
   * Specify the input value.
   * Follows the field's value after the owning form resets, on every Svelte version.
   * @type {string}
   * @bindable writable
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
  export let id = uniqueId();

  /**
   * Specify a name attribute for the input.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /**
   * Set to `true` to use the fluid variant.
   * Inherited from the parent `FluidForm` context,
   * so it does not need to be set when used inside `FluidForm`.
   */
  export let fluid = false;

  /** Set to `true` to select the input's text when it receives focus */
  export let selectTextOnFocus = false;

  import { getContext, setContext, tick } from "svelte";
  import { readonly as readOnly, writable } from "svelte/store";
  import { FORM_CONTEXT_KEY } from "../constants/context-keys.js";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import Stack from "../Stack/Stack.svelte";
  import {
    buildFieldIds,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { formReset } from "../utils/form-reset.js";
  import { uniqueId } from "../utils/unique-id.js";

  const formContext = getContext(FORM_CONTEXT_KEY);
  const selectCount = writable(0);

  /** @type {() => () => void} */
  function registerSelect() {
    selectCount.update((count) => count + 1);
    return () => {
      selectCount.update((count) => count - 1);
    };
  }

  const groupReadonly = writable(readonly);
  const groupDisabled = writable(disabled);

  const timePickerContext = {
    isFluid: false,
    registerSelect,
    readonly: readOnly(groupReadonly),
    disabled: readOnly(groupDisabled),
  };

  setContext("carbon:TimePicker", timePickerContext);

  function handleFocus() {
    if (selectTextOnFocus && !disabled) {
      tick().then(() => ref?.select());
    }
  }

  // A form reset restores the field without an input event. Svelte 5 syncs
  // `bind:value` back on its own; Svelte 3 and 4 do not, so read the field.
  function handleFormReset() {
    if (ref) value = ref.value;
  }

  $: ({ helperId, errorId, warnId } = buildFieldIds(id));
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled,
    readonly,
  }));
  $: isFluid = fluid || !!formContext?.isFluid;
  $: timePickerContext.isFluid = isFluid;
  $: groupReadonly.set(readonly);
  $: groupDisabled.set(disabled);
  $: equalWidth = $selectCount !== 2;
  $: fluidErrorText = showInvalid ? invalidText : showWarn ? warnText : "";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  class:bx--time-picker__form-item--fluid={isFluid}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if isFluid}
    <div
      class:bx--time-picker--fluid={true}
      class:bx--time-picker--equal-width={equalWidth}
      class:bx--time-picker--fluid--disabled={disabled}
      class:bx--time-picker--fluid--invalid={showInvalid}
      class:bx--time-picker--fluid--warning={showWarn}
      class:bx--time-picker--readonly={readonly}
    >
      <div class:bx--time-picker--fluid__wrapper={true}>
        <div class:bx--time-picker__input={true}>
          <div
            class:bx--form-item={true}
            class:bx--text-input-wrapper={true}
            class:bx--text-input--fluid={true}
            class:bx--text-input-wrapper--readonly={readonly}
          >
            {#if labelText || $$slots.labelChildren}
              <label
                for={id}
                class:bx--label={true}
                class:bx--visually-hidden={hideLabel}
                class:bx--label--disabled={disabled}
                class:bx--label--readonly={readonly}
                class:bx--label--slotted={$$slots.labelChildren}
              >
                <slot name="labelChildren"> {labelText} </slot>
              </label>
            {/if}
            <div class:bx--text-input__field-outer-wrapper={true}>
              <div class:bx--text-input__field-wrapper={true}>
                <input
                  bind:this={ref}
                  use:formReset={handleFormReset}
                  bind:value
                  type="text"
                  aria-invalid={showInvalid || undefined}
                  aria-describedby={resolveStatusDescribedBy({
                    showInvalid,
                    showWarn,
                    errorId,
                    warnId,
                  })}
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
                  on:change
                  on:input
                  on:keydown
                  on:keyup
                  on:focus
                  on:focus={handleFocus}
                  on:blur
                  on:paste
                >
              </div>
            </div>
          </div>
        </div>
        <slot />
      </div>
      {#if showInvalid || showWarn}
        <hr class:bx--time-picker__divider={true}>
        <div
          id={showInvalid ? errorId : warnId}
          class:bx--form-requirement={true}
        >
          {fluidErrorText}
        </div>
      {/if}
      {#if showInvalid}
        <WarningFilled
          class="bx--time-picker__icon bx--time-picker__icon--invalid"
        />
      {:else if showWarn}
        <WarningAltFilled
          class="bx--time-picker__icon bx--time-picker__icon--warn"
        />
      {/if}
    </div>
  {:else}
    <div
      class:bx--time-picker={true}
      class:bx--time-picker--light={light}
      class:bx--time-picker--invalid={showInvalid}
      class:bx--time-picker--warn={showWarn}
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
            data-invalid={showInvalid || undefined}
            data-warn={showWarn || undefined}
            class:bx--text-input__field-wrapper={true}
            class:bx--text-input__field-wrapper--warning={showWarn}
            style:width="auto"
          >
            {#if showInvalid}
              <WarningFilled class="bx--text-input__invalid-icon" />
            {:else if showWarn}
              <WarningAltFilled
                class="bx--text-input__invalid-icon bx--text-input__invalid-icon--warning"
              />
            {/if}
            <input
              bind:this={ref}
              use:formReset={handleFormReset}
              bind:value
              type="text"
              data-invalid={showInvalid || undefined}
              aria-invalid={showInvalid || undefined}
              aria-describedby={resolveStatusDescribedBy({
                showInvalid,
                showWarn,
                helperText,
                errorId,
                warnId,
                helperId,
              })}
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
              class:bx--text-input--invalid={showInvalid}
              class:bx--text-input--warning={showWarn}
              on:change
              on:input
              on:keydown
              on:keyup
              on:focus
              on:focus={handleFocus}
              on:blur
              on:paste
            >
          </div>
          <slot />
        </Stack>
      </div>
    </div>
    {#if showInvalid}
      <div id={errorId} class:bx--form-requirement={true}>{invalidText}</div>
    {:else if showWarn}
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
  {/if}
</div>
