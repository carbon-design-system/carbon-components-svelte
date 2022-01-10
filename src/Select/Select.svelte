<script>
  /**
   * @event {string} change
   */

  /**
   * Specify the selected item value
   * @type {string}
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
  import ChevronDown16 from "../icons/ChevronDown16.svelte";
  import WarningFilled16 from "../icons/WarningFilled16.svelte";
  import WarningAltFilled16 from "../icons/WarningAltFilled16.svelte";

  const dispatch = createEventDispatcher();
  const selectedValue = writable(selected);

  setContext("Select", { selectedValue });

  afterUpdate(() => {
    selected = $selectedValue;
    dispatch("change", $selectedValue);
  });

  $: errorId = `error-${id}`;
  $: selectedValue.set(selected);
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
            class="{size && `bx--select-input--${size}`}"
            on:change="{({ target }) => {
              selectedValue.set(target.value);
            }}"
            on:input
            on:focus
            on:blur
          >
            <slot />
          </select>
          <ChevronDown16 class="bx--select__arrow" />
          {#if invalid}
            <WarningFilled16 class="bx--select__invalid-icon" />
          {/if}
        </div>
        {#if invalid}
          <div class:bx--form-requirement="{true}" id="{errorId}">
            {invalidText}
          </div>
        {/if}
      </div>
      {#if helperText}
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
          class="{size && `bx--select-input--${size}`}"
          on:change="{({ target }) => {
            selectedValue.set(target.value);
          }}"
          on:input
          on:focus
          on:blur
        >
          <slot />
        </select>
        <ChevronDown16 class="bx--select__arrow" />
        {#if invalid}
          <WarningFilled16 class="bx--select__invalid-icon" />
        {/if}
        {#if !invalid && warn}
          <WarningAltFilled16
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
