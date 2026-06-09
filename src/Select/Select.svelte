<script>
  /**
   * @template {string | number} [Value=string | number]
   * @event {Value} update The selected value.
   */

  /**
   * Specify the selected item value.
   * @type {Value | undefined}
   * @bindable writable
   */
  export let selected = undefined;

  /**
   * Set the size of the select input.
   * @type {"xs" | "sm" | "xl"}
   */
  export let size = undefined;

  /** Set to `true` to use the inline variant */
  export let inline = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the select element */
  export let disabled = false;

  /** Set an id for the select element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Specify a name attribute for the select element.
   * @type {string}
   */
  export let name = undefined;

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

  /** Set to `true` to not render a label */
  export let noLabel = false;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /**
   * Obtain a reference to the select HTML element.
   * @bindable readonly
   */
  export let ref = null;

  /** Set to `true` to mark the field as required */
  export let required = false;

  /** Set to `true` for the select to be read-only */
  export let readonly = false;

  import { afterUpdate, createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<string | number | undefined>}
   */
  const selectedValue = writable(selected);
  const defaultSelectId = writable(null);
  const defaultValue = writable(null);
  const itemTypesByValue = writable({});

  /**
   * Use the first `SelectItem` value as the
   * default value if `selected` is `undefined`.
   * @type {(id: string, value: string | number) => void}
   */
  function setDefaultValue(id, value) {
    if ($defaultValue === null) {
      defaultSelectId.set(id);
      defaultValue.set(value);
    } else {
      if ($defaultSelectId === id) {
        selectedValue.set(value);
      }
    }

    itemTypesByValue.update((types) => ({
      ...types,
      [value]: typeof value,
    }));
  }

  setContext("carbon:Select", {
    selectedValue,
    setDefaultValue,
  });

  function handleChange(event) {
    let value = event.target.value;

    if ($itemTypesByValue[value] === "number") {
      value = Number(value);
    }

    selectedValue.set(value);
  }

  const selectReadOnlyKeys = ["ArrowDown", "ArrowUp", " "];

  /** @type {(e: MouseEvent) => void} */
  function onMouseDown(event) {
    if (readonly) {
      event.preventDefault();
      event.currentTarget.focus();
    }
  }

  /** @type {(e: KeyboardEvent) => void} */
  function onKeyDown(event) {
    if (readonly && selectReadOnlyKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  let prevSelected = null;

  afterUpdate(() => {
    if (selected !== $selectedValue) {
      const isInitialRender = prevSelected === null;
      selected = $selectedValue;
      if (!isInitialRender) {
        dispatch("update", $selectedValue);
      }
    }

    prevSelected = selected;
  });

  $: errorId = `error-${id}`;
  $: warnId = `warn-${id}`;
  $: helperId = `helper-${id}`;
  $: selectedValue.set(selected ?? $defaultValue);
  // Invalid/warn states are suppressed when the select is disabled or read-only.
  $: showInvalid = invalid && !disabled && !readonly;
  $: showWarn = warn && !invalid && !disabled && !readonly;
</script>

<div class:bx--form-item={true}>
  <div
    class:bx--select={true}
    class:bx--select--inline={inline}
    class:bx--select--light={light}
    class:bx--select--invalid={showInvalid}
    class:bx--select--disabled={disabled}
    class:bx--select--warning={showWarn}
    class:bx--select--readonly={readonly}
  >
    {#if !noLabel && (labelText || $$slots.labelChildren)}
      <label
        for={id}
        class:bx--label={true}
        class:bx--visually-hidden={hideLabel}
        class:bx--label--disabled={disabled}
      >
        <slot name="labelChildren"> {labelText} </slot>
      </label>
    {/if}
    {#if inline}
      <div class:bx--select-input--inline__wrapper={true}>
        <div
          class:bx--select-input__wrapper={true}
          data-invalid={showInvalid || undefined}
        >
          <select
            bind:this={ref}
            aria-describedby={showInvalid
              ? errorId
              : showWarn
                ? warnId
                : helperText
                  ? helperId
                  : undefined}
            aria-invalid={showInvalid || undefined}
            aria-readonly={readonly || undefined}
            disabled={disabled || undefined}
            required={required || undefined}
            {id}
            {name}
            class:bx--select-input={true}
            class:bx--select-input--xs={size === "xs"}
            class:bx--select-input--sm={size === "sm"}
            class:bx--select-input--xl={size === "xl"}
            {...$$restProps}
            on:change={handleChange}
            on:change
            on:input
            on:focus
            on:blur
            on:mousedown={onMouseDown}
            on:keydown={onKeyDown}
          >
            <slot />
          </select>
          <ChevronDown class="bx--select__arrow" />
          {#if showInvalid}
            <WarningFilled class="bx--select__invalid-icon" />
          {/if}
          {#if showWarn}
            <WarningAltFilled
              class="bx--select__invalid-icon bx--select__invalid-icon--warning"
            />
          {/if}
        </div>
        {#if showInvalid}
          <div class:bx--form-requirement={true} id={errorId}>
            {invalidText}
          </div>
        {/if}
        {#if showWarn}
          <div class:bx--form-requirement={true} id={warnId}>
            {warnText}
          </div>
        {/if}
      </div>
      {#if helperText && !showInvalid && !showWarn}
        <div
          id={helperId}
          class:bx--form__helper-text={true}
          class:bx--form__helper-text--disabled={disabled}
        >
          {helperText}
        </div>
      {/if}
    {/if}
    {#if !inline}
      <div
        class:bx--select-input__wrapper={true}
        data-invalid={showInvalid || undefined}
      >
        <select
          bind:this={ref}
          {id}
          {name}
          aria-describedby={showInvalid
            ? errorId
            : showWarn
              ? warnId
              : helperText
                ? helperId
                : undefined}
          disabled={disabled || undefined}
          required={required || undefined}
          aria-invalid={showInvalid || undefined}
          aria-readonly={readonly || undefined}
          class:bx--select-input={true}
          class:bx--select-input--xs={size === "xs"}
          class:bx--select-input--sm={size === "sm"}
          class:bx--select-input--xl={size === "xl"}
          {...$$restProps}
          on:change={handleChange}
          on:change
          on:input
          on:focus
          on:blur
          on:mousedown={onMouseDown}
          on:keydown={onKeyDown}
        >
          <slot />
        </select>
        <ChevronDown class="bx--select__arrow" />
        {#if showInvalid}
          <WarningFilled class="bx--select__invalid-icon" />
        {/if}
        {#if showWarn}
          <WarningAltFilled
            class="bx--select__invalid-icon bx--select__invalid-icon--warning"
          />
        {/if}
      </div>
      {#if helperText && !showInvalid && !showWarn}
        <div
          id={helperId}
          class:bx--form__helper-text={true}
          class:bx--form__helper-text--disabled={disabled}
        >
          {helperText}
        </div>
      {/if}
      {#if showInvalid}
        <div id={errorId} class:bx--form-requirement={true}>{invalidText}</div>
      {/if}
      {#if showWarn}
        <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
      {/if}
    {/if}
  </div>
</div>
