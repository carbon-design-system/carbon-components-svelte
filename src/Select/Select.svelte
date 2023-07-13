<script>
  /**
   * @event {string | number} update The selected value.
   */

  /**
   * Specify the selected item value
   * @type {string | number}
   */
  export let selected = undefined;

  /**
   * Set the size of the select input
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /** Set to `true` to use the inline variant */
  export let inline = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the select element */
  export let disabled = false;

  /** Set an id for the select element */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the select element
   * @type {string}
   */
  export let name = undefined;

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate an warning state */
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

  /** Obtain a reference to the select HTML element */
  export let ref = null;

  /** Set to `true` to mark the field as required */
  export let required = false;

  import { createEventDispatcher, setContext, afterUpdate } from "svelte";
  import { writable } from "svelte/store";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";

  const dispatch = createEventDispatcher();
  const selectedValue = writable(selected);
  const defaultSelectId = writable(null);
  const defaultValue = writable(null);
  const itemTypesByValue = writable({});

  setContext("Select", {
    selectedValue,
    setDefaultValue: (id, value) => {
      /**
       * Use the first `SelectItem` value as the
       * default value if `selected` is `undefined`.
       */
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
    },
  });

  const handleChange = ({ target }) => {
    let value = target.value;

    if ($itemTypesByValue[value] === "number") {
      value = Number(value);
    }

    selectedValue.set(value);
  };

  let prevSelected = undefined;

  afterUpdate(() => {
    selected = $selectedValue;

    if (prevSelected !== undefined && selected !== prevSelected) {
      dispatch("update", $selectedValue);
    }

    prevSelected = selected;
  });

  $: errorId = `error-${id}`;
  $: selectedValue.set(selected ?? $defaultValue);
</script>

<div class:bx--form-item="{true}" {...$$restProps}>
  <div
    class:bx--select="{true}"
    class:bx--select--inline="{inline}"
    class:bx--select--light="{light}"
    class:bx--select--invalid="{invalid}"
    class:bx--select--disabled="{disabled}"
    class:bx--select--warning="{warn}"
  >
    {#if !noLabel}
      <label
        for="{id}"
        class:bx--label="{true}"
        class:bx--visually-hidden="{hideLabel}"
        class:bx--label--disabled="{disabled}"
      >
        <slot name="labelText">
          {labelText}
        </slot>
      </label>
    {/if}
    {#if inline}
      <div class:bx--select-input--inline__wrapper="{true}">
        <div
          class:bx--select-input__wrapper="{true}"
          data-invalid="{invalid || undefined}"
        >
          <select
            bind:this="{ref}"
            aria-describedby="{invalid ? errorId : undefined}"
            aria-invalid="{invalid || undefined}"
            disabled="{disabled || undefined}"
            required="{required || undefined}"
            id="{id}"
            name="{name}"
            class:bx--select-input="{true}"
            class:bx--select-input--sm="{size === 'sm'}"
            class:bx--select-input--xl="{size === 'xl'}"
            on:change="{handleChange}"
            on:change
            on:input
            on:focus
            on:blur
          >
            <slot />
          </select>
          <ChevronDown class="bx--select__arrow" />
          {#if invalid}
            <WarningFilled class="bx--select__invalid-icon" />
          {/if}
        </div>
        {#if invalid}
          <div class:bx--form-requirement="{true}" id="{errorId}">
            {invalidText}
          </div>
        {/if}
      </div>
      {#if !invalid && !warn && helperText}
        <div
          class:bx--form__helper-text="{true}"
          class:bx--form__helper-text--disabled="{disabled}"
        >
          {helperText}
        </div>
      {/if}
    {/if}
    {#if !inline}
      <div
        class:bx--select-input__wrapper="{true}"
        data-invalid="{invalid || undefined}"
      >
        <select
          bind:this="{ref}"
          id="{id}"
          name="{name}"
          aria-describedby="{invalid ? errorId : undefined}"
          disabled="{disabled || undefined}"
          required="{required || undefined}"
          aria-invalid="{invalid || undefined}"
          class:bx--select-input="{true}"
          class:bx--select-input--sm="{size === 'sm'}"
          class:bx--select-input--xl="{size === 'xl'}"
          on:change="{handleChange}"
          on:change
          on:input
          on:focus
          on:blur
        >
          <slot />
        </select>
        <ChevronDown class="bx--select__arrow" />
        {#if invalid}
          <WarningFilled class="bx--select__invalid-icon" />
        {/if}
        {#if !invalid && warn}
          <WarningAltFilled
            class="bx--select__invalid-icon bx--select__invalid-icon--warning"
          />
        {/if}
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
        <div id="{errorId}" class:bx--form-requirement="{true}">
          {invalidText}
        </div>
      {/if}
      {#if !invalid && warn}
        <div id="{errorId}" class:bx--form-requirement="{true}">
          {warnText}
        </div>
      {/if}
    {/if}
  </div>
</div>
