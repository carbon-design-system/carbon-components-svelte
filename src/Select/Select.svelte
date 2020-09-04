<script>
  /**
   * Specify the selected item value
   * @type {string} [selected]
   */
  export let selected = undefined;

  /**
   * Set the size of the select input
   * @type {"sm" | "xl"} [size]
   */
  export let size = undefined;

  /**
   * Set to `true` to use the inline variant
   * @type {boolean} [inline=false]
   */
  export let inline = false;

  /**
   * Set to `true` to enable the light variant
   * @type {boolean} [light=false]
   */
  export let light = false;

  /**
   * Set to `true` to disable the select element
   * @type {boolean} [disabled=false]
   */
  export let disabled = false;

  /**
   * Set an id for the select element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the select element
   * @type {string} [name]
   */
  export let name = undefined;

  /**
   * Set to `true` to indicate an invalid state
   * @type {boolean} [invalid=false]
   */
  export let invalid = false;

  /**
   * Specify the invalid state text
   * @type {string} [invalidText=""]
   */
  export let invalidText = "";

  /**
   * Specify the helper text
   * @type {string} [helperText=""]
   */
  export let helperText = "";

  /**
   * Set to `true` to not render a label
   * @type {boolean} [noLabel=false]
   */
  export let noLabel = false;

  /**
   * Specify the label text
   * @type {string} [labelText=""]
   */
  export let labelText = "";

  /**
   * Set to `true` to visually hide the label text
   * @type {boolean} [hideLabel=false]
   */
  export let hideLabel = false;

  /**
   * Obtain a reference to the select HTML element
   * @type {null | HTMLSelectElement} [ref=null]
   */
  export let ref = null;

  import { createEventDispatcher, setContext, afterUpdate } from "svelte";
  import { writable } from "svelte/store";
  import ChevronDown16 from "carbon-icons-svelte/lib/ChevronDown16";
  import WarningFilled16 from "carbon-icons-svelte/lib/WarningFilled16";

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
    class:bx--select--disabled="{disabled}">
    {#if !noLabel}
      <label
        for="{id}"
        class:bx--label="{true}"
        class:bx--visually-hidden="{hideLabel}"
        class:bx--label--disabled="{disabled}">
        {labelText}
      </label>
    {/if}
    {#if !inline && helperText}
      <div
        class:bx--form__helper-text="{true}"
        class:bx--form__helper-text--disabled="{disabled}">
        {helperText}
      </div>
    {/if}
    {#if inline}
      <div class:bx--select-input--inline__wrapper="{true}">
        <div
          class:bx--select-input__wrapper="{true}"
          data-invalid="{invalid || undefined}">
          <select
            bind:this="{ref}"
            aria-describedby="{invalid ? errorId : undefined}"
            aria-invalid="{invalid || undefined}"
            disabled="{disabled || undefined}"
            id="{id}"
            name="{name}"
            class:bx--select-input="{true}"
            class="{size && `bx--select-input--${size}`}"
            on:change="{({ target }) => {
              selectedValue.set(target.value);
            }}"
            on:blur>
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
          class:bx--form__helper-text--disabled="{disabled}">
          {helperText}
        </div>
      {/if}
    {/if}
    {#if !inline}
      <div
        class:bx--select-input__wrapper="{true}"
        data-invalid="{invalid || undefined}">
        <select
          bind:this="{ref}"
          id="{id}"
          name="{name}"
          aria-describedby="{invalid ? errorId : undefined}"
          disabled="{disabled || undefined}"
          aria-invalid="{invalid || undefined}"
          class:bx--select-input="{true}"
          class="{size && `bx--select-input--${size}`}"
          on:change="{({ target }) => {
            selectedValue.set(target.value);
          }}"
          on:blur>
          <slot />
        </select>
        <ChevronDown16 class="bx--select__arrow" />
        {#if invalid}
          <WarningFilled16 class="bx--select__invalid-icon" />
        {/if}
      </div>
      {#if invalid}
        <div id="{errorId}" class:bx--form-requirement="{true}">
          {invalidText}
        </div>
      {/if}
    {/if}
  </div>
</div>
